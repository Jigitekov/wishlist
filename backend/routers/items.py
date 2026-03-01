from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from decimal import Decimal
import secrets
from database import get_db
from models import User, Wishlist, Item, Reservation, Contribution, PriorityEnum
from auth_utils import get_current_user, get_optional_user
from ws_manager import manager

router = APIRouter()


class CreateItemRequest(BaseModel):
    title: str
    url: str | None = None
    price: float | None = None
    image_url: str | None = None
    description: str | None = None
    priority: PriorityEnum = PriorityEnum.medium


class ReserveRequest(BaseModel):
    reserver_name: str
    reserver_contact: str | None = None


class ContributeRequest(BaseModel):
    contributor_name: str
    amount: float


async def load_item(item_id: str, db: AsyncSession) -> Item:
    result = await db.execute(
        select(Item).where(Item.id == item_id)
        .options(selectinload(Item.wishlist), selectinload(Item.reservation), selectinload(Item.contributions))
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item not found")
    return item


@router.post("/wishlists/{wishlist_id}/items")
async def add_item(wishlist_id: str, body: CreateItemRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Wishlist).where(Wishlist.id == wishlist_id))
    wishlist = result.scalar_one_or_none()
    if not wishlist or str(wishlist.owner_id) != str(user.id):
        raise HTTPException(403, "Forbidden")
    item = Item(wishlist_id=wishlist_id, title=body.title, url=body.url,
                price=Decimal(str(body.price)) if body.price else None,
                image_url=body.image_url, description=body.description, priority=body.priority)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    await manager.broadcast(wishlist.slug, {"type": "item_added", "item": {
        "id": str(item.id), "title": item.title, "url": item.url,
        "price": float(item.price) if item.price else None,
        "image_url": item.image_url, "description": item.description,
        "priority": item.priority, "is_deleted": False, "is_reserved": False,
        "total_contributed": 0, "contributor_count": 0,
    }})
    return {"id": str(item.id), "title": item.title}


@router.delete("/{item_id}")
async def delete_item(item_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    item = await load_item(item_id, db)
    if str(item.wishlist.owner_id) != str(user.id):
        raise HTTPException(403, "Forbidden")
    item.is_deleted = True
    await db.commit()
    await manager.broadcast(item.wishlist.slug, {"type": "item_deleted", "item_id": str(item.id), "has_contributions": len(item.contributions) > 0})
    return {"ok": True}


@router.post("/{item_id}/reserve")
async def reserve_item(item_id: str, body: ReserveRequest, db: AsyncSession = Depends(get_db)):
    item = await load_item(item_id, db)
    if item.is_deleted:
        raise HTTPException(400, "Item was removed")
    if item.reservation:
        raise HTTPException(409, "Already reserved")
    token = secrets.token_urlsafe(16)
    reservation = Reservation(item_id=item.id, reserver_name=body.reserver_name, reserver_contact=body.reserver_contact, token=token)
    db.add(reservation)
    await db.commit()
    await manager.broadcast(item.wishlist.slug, {"type": "item_reserved", "item_id": str(item.id), "is_reserved": True, "reserver_initial": body.reserver_name[0].upper()})
    return {"ok": True, "token": token}


@router.delete("/{item_id}/reserve")
async def unreserve_item(item_id: str, token: str, db: AsyncSession = Depends(get_db)):
    item = await load_item(item_id, db)
    if not item.reservation:
        raise HTTPException(404, "Not reserved")
    if item.reservation.token != token:
        raise HTTPException(403, "Invalid token")
    await db.delete(item.reservation)
    await db.commit()
    await manager.broadcast(item.wishlist.slug, {"type": "item_unreserved", "item_id": str(item.id)})
    return {"ok": True}


@router.post("/{item_id}/contribute")
async def contribute(item_id: str, body: ContributeRequest, db: AsyncSession = Depends(get_db)):
    if body.amount < 1:
        raise HTTPException(400, "Minimum contribution is 1")
    item = await load_item(item_id, db)
    if item.is_deleted:
        raise HTTPException(400, "Item was removed. Contributions are paused.")
    contribution = Contribution(item_id=item.id, contributor_name=body.contributor_name, amount=Decimal(str(body.amount)))
    db.add(contribution)
    await db.commit()
    new_total = sum(float(c.amount) for c in item.contributions) + float(body.amount)
    new_count = len(item.contributions) + 1
    await manager.broadcast(item.wishlist.slug, {"type": "contribution_added", "item_id": str(item.id), "new_total": new_total, "contributor_count": new_count})
    return {"ok": True, "new_total": new_total}


@router.post("/parse-url")
async def parse_url(payload: dict):
    url = payload.get("url", "")
    if not url:
        raise HTTPException(400, "URL required")
    try:
        import httpx
        from bs4 import BeautifulSoup
        headers = {"User-Agent": "Mozilla/5.0 (compatible; WishFlow/1.0)"}
        async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
            response = await client.get(url, headers=headers)
        soup = BeautifulSoup(response.text, "html.parser")
        def og(prop):
            tag = soup.find("meta", property=f"og:{prop}")
            return tag["content"] if tag and tag.get("content") else None
        title = og("title") or (soup.title.string.strip() if soup.title else None)
        image = og("image")
        description = og("description")
        price = None
        price_tag = soup.find("meta", property="product:price:amount") or soup.find("meta", property="og:price:amount")
        if price_tag:
            try:
                price = float(price_tag.get("content", "").replace(",", "."))
            except Exception:
                pass
        if not price:
            import json
            for script in soup.find_all("script", type="application/ld+json"):
                try:
                    data = json.loads(script.string)
                    if isinstance(data, list): data = data[0]
                    offers = data.get("offers", {})
                    if isinstance(offers, list): offers = offers[0]
                    p = offers.get("price") or offers.get("lowPrice")
                    if p:
                        price = float(str(p).replace(",", "."))
                        break
                except Exception:
                    continue
        return {"title": title, "image_url": image, "description": description, "price": price}
    except Exception as e:
        return {"title": None, "image_url": None, "description": None, "price": None, "error": str(e)}
