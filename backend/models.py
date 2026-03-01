from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Numeric, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from database import Base


class OccasionEnum(str, enum.Enum):
    birthday = "birthday"
    newyear = "newyear"
    wedding = "wedding"
    other = "other"


class PriorityEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    wishlists = relationship("Wishlist", back_populates="owner")


class Wishlist(Base):
    __tablename__ = "wishlists"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    occasion = Column(SAEnum(OccasionEnum), default=OccasionEnum.other)
    slug = Column(String, unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="wishlists")
    items = relationship("Item", back_populates="wishlist")


class Item(Base):
    __tablename__ = "items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wishlist_id = Column(UUID(as_uuid=True), ForeignKey("wishlists.id"), nullable=False)
    title = Column(String, nullable=False)
    url = Column(String, nullable=True)
    price = Column(Numeric(10, 2), nullable=True)
    image_url = Column(String, nullable=True)
    description = Column(String, nullable=True)
    priority = Column(SAEnum(PriorityEnum), default=PriorityEnum.medium)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    wishlist = relationship("Wishlist", back_populates="items")
    reservation = relationship("Reservation", back_populates="item", uselist=False)
    contributions = relationship("Contribution", back_populates="item")


class Reservation(Base):
    __tablename__ = "reservations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False, unique=True)
    reserver_name = Column(String, nullable=False)
    reserver_contact = Column(String, nullable=True)
    token = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    item = relationship("Item", back_populates="reservation")


class Contribution(Base):
    __tablename__ = "contributions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False)
    contributor_name = Column(String, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    item = relationship("Item", back_populates="contributions")
