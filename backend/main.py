from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
from routers import auth, wishlists, items, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="WishFlow API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(wishlists.router, prefix="/wishlists", tags=["wishlists"])
app.include_router(items.router, prefix="/items", tags=["items"])
app.include_router(ws.router, tags=["websocket"])


@app.get("/health")
async def health():
    return {"status": "ok"}
