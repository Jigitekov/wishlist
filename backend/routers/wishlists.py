from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
import secrets, string
from database import get_db
from models import User, Wishlist, Item, Reservation, Contribution, OccasionEnum
from auth_utils import get_current_user, get_optional_user

router = APIRouter()

OCCASION_EMOJI = {"birthday": "🎂", "newyear": "🎆", "wedding": "💍", "other": "🎁"}


def generate_slug(length=8):
    chars = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


def serialize_item(item: Item, is_owner: bool) -> dict:
    total = sum(float(c.amount) for c in item.contributions)
    base = {
        "id": str(item.id), "title": item.title, "url": item.url,
        "price": float(item.price) if item.price else None,
        "image_url": item.image_url, "description": item.description,
        "priority": item.priority, "is_deleted": item.is_deleted,
        "is_reserved": item.reservation is not None,
        "total_contributed": total, "contributor_count": len(item.contributions),
        "created_at": item.created_at.isoformat(),
    }
    if not is_owner and item.reservation:
        base["reserver_initial"] = item.reservation.reserver_name[0].upper()
    return base


class CreateWishlistRequest(BaseModel):
    title: str
    description: str | None = None
    occasion: OccasionEnum = OccasionEnum.other


@router.post("/")
async def create_wishlist(body: CreateWishlistRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    slug = generate_slug()
    while True:
        result = await db.execute(select(Wishlist).where(Wishlist.slug == slug))
        if not result.scalar_one_or_none():
            break
        slug = generate_slug()
    wishlist = Wishlist(owner_id=user.id, title=body.title, description=body.description, occasion=body.occasion, slug=slug)
    db.add(wishlist)
    await db.commit()
    await db.refresh(wishlist)
    return {"id": str(wishlist.id), "slug": wishlist.slug, "title": wishlist.title, "occasion": wishlist.occasion, "occasion_emoji": OCCASION_EMOJI.get(wishlist.occasion, "🎁")}


@router.get("/my")
async def my_wishlists(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Wishlist).where(Wishlist.owner_id == user.id)
        .options(selectinload(Wishlist.items).selectinload(Item.reservation),
                 selectinload(Wishlist.items).selectinload(Item.contributions))
        .order_by(Wishlist.created_at.desc())
    )
    wishlists = result.scalars().all()
    return [{"id": str(w.id), "slug": w.slug, "title": w.title, "description": w.description,
             "occasion": w.occasion, "occasion_emoji": OCCASION_EMOJI.get(w.occasion, "🎁"),
             "is_active": w.is_active, "item_count": len([i for i in w.items if not i.is_deleted]),
             "created_at": w.created_at.isoformat()} for w in wishlists]


@router.get("/{slug}")
async def get_wishlist(slug: str, db: AsyncSession = Depends(get_db), user=Depends(get_optional_user)):
    result = await db.execute(
        select(Wishlist).where(Wishlist.slug == slug, Wishlist.is_active == True)
        .options(selectinload(Wishlist.owner),
                 selectinload(Wishlist.items).selectinload(Item.reservation),
                 selectinload(Wishlist.items).selectinload(Item.contributions))
    )
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        raise HTTPException(404, "Wishlist not found")
    is_owner = user is not None and str(user.id) == str(wishlist.owner_id)
    items = [serialize_item(i, is_owner) for i in sorted(wishlist.items, key=lambda x: x.created_at) if not i.is_deleted or is_owner]
    return {"id": str(wishlist.id), "slug": wishlist.slug, "title": wishlist.title,
            "description": wishlist.description, "occasion": wishlist.occasion,
            "occasion_emoji": OCCASION_EMOJI.get(wishlist.occasion, "🎁"),
            "owner": {"name": wishlist.owner.name, "avatar_url": wishlist.owner.avatar_url},
            "is_owner": is_owner, "items": items, "created_at": wishlist.created_at.isoformat()}


@router.delete("/{wishlist_id}")
async def delete_wishlist(wishlist_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Wishlist).where(Wishlist.id == wishlist_id))
    wishlist = result.scalar_one_or_none()
    if not wishlist or str(wishlist.owner_id) != str(user.id):
        raise HTTPException(404, "Not found")
    wishlist.is_active = False
    await db.commit()
    return {"ok": True}
