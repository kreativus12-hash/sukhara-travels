from dotenv import load_dotenv

load_dotenv()

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import logging
import os
import secrets
import uuid

import bcrypt
import jwt
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, EmailStr, Field


ROOT_DIR = Path(__file__).parent
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"].lower()
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
JWT_ALGORITHM = "HS256"
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
app = FastAPI(title="Sukhara Travels API", version="2.0.0")
api_router = APIRouter(prefix="/api")
logger = logging.getLogger("sukhara")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def public_doc(document: Dict[str, Any]) -> Dict[str, Any]:
    document.pop("_id", None)
    return document


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_token(user_id: str, email: str, token_type: str, expires: timedelta) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": token_type,
        "exp": datetime.now(timezone.utc) + expires,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Any, user_id: str, email: str) -> None:
    response.set_cookie("access_token", create_token(user_id, email, "access", timedelta(minutes=15)), httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie("refresh_token", create_token(user_id, email, "refresh", timedelta(days=7)), httponly=True, secure=True, samesite="none", max_age=604800, path="/")


async def current_user(request: Request) -> Dict[str, Any]:
    token = request.cookies.get("access_token")
    if not token:
        header = request.headers.get("Authorization", "")
        token = header[7:] if header.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc


async def admin_user(user: Dict[str, Any] = Depends(current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


class AuthInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class EnquiryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=5, max_length=40)
    email: Optional[EmailStr] = None
    destination: Optional[str] = None
    package_id: Optional[str] = None
    travel_date: Optional[str] = None
    travellers: Optional[str] = None
    budget: Optional[str] = None
    holiday_type: Optional[str] = None
    message: Optional[str] = None
    source: str = Field(default="homepage", max_length=120)


class ContactSubmissionCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=40)
    email: Optional[EmailStr] = None
    subject: Optional[str] = Field(default=None, max_length=160)
    message: str = Field(min_length=2, max_length=3000)


def base_record(data: Dict[str, Any]) -> Dict[str, Any]:
    stamp = now_iso()
    return {"id": new_id(), **data, "created_at": stamp, "updated_at": stamp}


DESTINATION_SEEDS = [
    ("Goa", "India", "Domestic Holidays", "Sunlit shores and slow coastal days", "A relaxed coastal escape with Portuguese lanes, warm water and plenty of room to slow down.", "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80", ["Baga Beach", "Old Goa", "Fontainhas"], "November to February", "4–6 days"),
    ("Kashmir", "India", "Domestic Holidays", "Meadows, mountains and quiet wonder", "Alpine lakes, meadow walks and the timeless beauty of the valley make Kashmir a journey to remember.", "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80", ["Srinagar", "Gulmarg", "Pahalgam"], "April to October", "6–8 days"),
    ("Kerala", "India", "Domestic Holidays", "Backwaters, spice trails and soul", "A gentle route through Kerala's backwaters, forests, beaches and rich food traditions.", "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80", ["Alleppey", "Munnar", "Thekkady"], "October to March", "6–8 days"),
    ("Rajasthan", "India", "Domestic Holidays", "Royal routes through living history", "Colourful cities, desert sunsets and grand architecture on a route shaped by stories.", "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80", ["Jaipur", "Jodhpur", "Udaipur"], "October to March", "7–10 days"),
    ("Dubai", "United Arab Emirates", "International Holidays", "A bold city of unforgettable contrasts", "A polished city break balancing design, desert, dining and sky-high views.", "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80", ["Burj Khalifa", "Desert safari", "Dubai Marina"], "November to March", "4–6 days"),
    ("Bali", "Indonesia", "International Holidays", "Rituals, rice terraces and ocean air", "Find a little of everything in Bali: creative towns, temple rituals, generous food and beautiful shores.", "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80", ["Ubud", "Nusa Dua", "Seminyak"], "April to October", "6–8 days"),
    ("Maldives", "Maldives", "International Holidays", "Barefoot luxury in brilliant blue", "An easygoing island escape built around warm water, quiet mornings and unhurried evenings.", "https://images.pexels.com/photos/9149367/pexels-photo-9149367.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1200", ["Overwater villa", "Lagoon days", "Island dining"], "November to April", "4–6 days"),
    ("Thailand", "Thailand", "International Holidays", "Island escapes with a little more colour", "A bright, generous journey between bustling streets, lush islands and old-world neighbourhoods.", "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=1200&q=80", ["Bangkok", "Phuket", "Krabi"], "November to February", "6–8 days"),
]


async def seed_content() -> None:
    await db.destination_categories.create_index("slug", unique=True)
    await db.destinations.create_index("slug", unique=True)
    await db.packages.create_index("slug", unique=True)
    await db.enquiries.create_index("created_at")
    await db.contact_submissions.create_index("created_at")
    await db.testimonials.create_index("published")
    await db.gallery.create_index("published")
    await db.blog_posts.create_index("slug", unique=True)
    await db.faqs.create_index([("category", 1), ("sort_order", 1)])
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    for name, slug, description in [("Domestic Holidays", "domestic-holidays", "Thoughtful journeys across India."), ("International Holidays", "international-holidays", "Beautiful ways to see more of the world."), ("Honeymoon", "honeymoon", "Slow, personal escapes for two.")]:
        await db.destination_categories.update_one({"slug": slug}, {"$setOnInsert": {"id": new_id(), "name": name, "slug": slug, "description": description}}, upsert=True)
    ids: Dict[str, str] = {}
    for name, country, category, short, full, image, highlights, season, duration in DESTINATION_SEEDS:
        slug = name.lower().replace(" ", "-")
        existing = await db.destinations.find_one({"slug": slug}, {"_id": 0})
        record = base_record({"name": name, "slug": slug, "country": country, "category": category, "short_description": short, "full_description": full, "hero_image": image, "gallery": [image], "highlights": highlights, "best_time_to_visit": season, "recommended_duration": duration, "featured": True, "published": True, "seo_title": f"{name} Holidays | Sukhara Travels", "seo_description": short})
        if existing:
            ids[name] = existing["id"]
            await db.destinations.update_one({"slug": slug}, {"$set": {key: value for key, value in record.items() if key not in {"id", "created_at"}}, "$setOnInsert": {"id": record["id"], "created_at": record["created_at"]}})
        else:
            await db.destinations.insert_one(record)
            ids[name] = record["id"]
    packages = [
        ("Valleys of Kashmir", "Kashmir", "Domestic Holidays", "6 days / 5 nights", "₹42,500", ["Srinagar", "Gulmarg", "Pahalgam"]),
        ("The Bali Edit", "Bali", "International Holidays", "7 days / 6 nights", "₹58,900", ["Ubud", "Nusa Dua", "Seminyak"]),
        ("Blue Horizon Escape", "Maldives", "International Holidays", "4 days / 3 nights", "₹68,500", ["Overwater villa", "Breakfast", "Transfers"]),
        ("Goa, Slowly", "Goa", "Domestic Holidays", "5 days / 4 nights", "₹29,500", ["North Goa", "Old Goa", "Sunset cruise"]),
    ]
    for title, destination, category, duration, price, highlights in packages:
        slug = title.lower().replace(" ", "-").replace(",", "")
        if not await db.packages.find_one({"slug": slug}):
            package = base_record({"title": title, "slug": slug, "destination_id": ids[destination], "destination": destination, "category": category, "short_description": f"A considered {duration.lower()} journey through {destination}.", "full_description": f"A sample demonstration itinerary for {destination}, designed to show how Sukhara can shape an easy, memorable holiday.", "duration": duration, "starting_price": price, "hero_image": next(item[5] for item in DESTINATION_SEEDS if item[0] == destination), "gallery": [next(item[5] for item in DESTINATION_SEEDS if item[0] == destination)], "highlights": highlights, "inclusions": ["Accommodation as listed", "Daily breakfast", "Private transfers"], "exclusions": ["International flights", "Personal expenses", "Travel insurance"], "featured": True, "published": True, "seo_title": f"{title} | Sukhara Travels", "seo_description": f"Explore the sample {title} itinerary."})
            await db.packages.insert_one(package)
            for day, day_title in enumerate(["Arrive and settle in", "A day to discover", "The scenic route", "Time to wander", "One last beautiful morning"], 1):
                await db.package_itineraries.insert_one({"id": new_id(), "package_id": package["id"], "day_number": day, "title": day_title, "description": f"A flexible sample day in {destination}, with space for local experiences and easy moments.", "meals": "Breakfast", "accommodation": "Selected stay", "activities": highlights[:2]})
    await db.website_settings.update_one({"id": "main"}, {"$setOnInsert": {"id": "main", "company_name": "Sukhara Travels and Tourism", "logo": "", "favicon": "", "phone": "+91 98765 43210", "whatsapp": "919876543210", "email": "hello@sukharatravels.com", "address": "Kerala, India", "map_url": "", "instagram": "", "facebook": "", "youtube": "", "business_hours": "Mon–Sat · 9am–6pm", "default_seo_title": "Sukhara Travels & Tourism | Thoughtful Journeys", "default_seo_description": "Thoughtfully planned domestic and international journeys."}}, upsert=True)
    admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if not admin:
        await db.users.insert_one({"id": new_id(), "email": ADMIN_EMAIL, "password_hash": hash_password(ADMIN_PASSWORD), "name": "Sukhara Administrator", "role": "admin", "created_at": now_iso()})
    elif not verify_password(ADMIN_PASSWORD, admin["password_hash"]):
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})


@app.on_event("startup")
async def startup() -> None:
    await seed_content()


@api_router.get("/")
async def root() -> Dict[str, str]:
    return {"message": "Sukhara Travels API"}


@api_router.get("/settings")
async def get_settings() -> Dict[str, Any]:
    return public_doc(await db.website_settings.find_one({"id": "main"}, {"_id": 0}) or {})


@api_router.get("/destinations")
async def list_destinations(featured: Optional[bool] = None) -> List[Dict[str, Any]]:
    query: Dict[str, Any] = {"published": True}
    if featured is not None:
        query["featured"] = featured
    return await db.destinations.find(query, {"_id": 0}).sort("name", 1).to_list(100)


@api_router.get("/destinations/{slug}")
async def get_destination(slug: str) -> Dict[str, Any]:
    destination = await db.destinations.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not destination:
        raise HTTPException(404, "Destination not found")
    destination["related_packages"] = await db.packages.find({"destination_id": destination["id"], "published": True}, {"_id": 0}).to_list(50)
    return destination


@api_router.get("/packages")
async def list_packages(featured: Optional[bool] = None, destination_id: Optional[str] = None) -> List[Dict[str, Any]]:
    query: Dict[str, Any] = {"published": True}
    if featured is not None:
        query["featured"] = featured
    if destination_id:
        query["destination_id"] = destination_id
    return await db.packages.find(query, {"_id": 0}).sort("title", 1).to_list(100)


@api_router.get("/packages/{slug}")
async def get_package(slug: str) -> Dict[str, Any]:
    package = await db.packages.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not package:
        raise HTTPException(404, "Package not found")
    package["itinerary"] = await db.package_itineraries.find({"package_id": package["id"]}, {"_id": 0}).sort("day_number", 1).to_list(50)
    return package


@api_router.get("/destination-categories")
async def list_destination_categories() -> List[Dict[str, Any]]:
    return await db.destination_categories.find({}, {"_id": 0}).sort("name", 1).to_list(50)


@api_router.get("/testimonials")
async def list_testimonials() -> List[Dict[str, Any]]:
    return await db.testimonials.find({"published": True}, {"_id": 0}).sort("created_at", -1).to_list(100)


@api_router.get("/gallery")
async def list_gallery() -> List[Dict[str, Any]]:
    return await db.gallery.find({"published": True}, {"_id": 0}).sort("created_at", -1).to_list(100)


@api_router.get("/blog-posts")
async def list_blog_posts() -> List[Dict[str, Any]]:
    return await db.blog_posts.find({"published": True}, {"_id": 0}).sort("published_at", -1).to_list(100)


@api_router.get("/faqs")
async def list_faqs() -> List[Dict[str, Any]]:
    return await db.faqs.find({"published": True}, {"_id": 0}).sort([("category", 1), ("sort_order", 1)]).to_list(100)


@api_router.post("/enquiries", status_code=201)
async def create_enquiry(payload: EnquiryCreate) -> Dict[str, str]:
    record = base_record(payload.model_dump())
    record["status"] = "new"
    record["admin_notes"] = ""
    await db.enquiries.insert_one(record)
    return {"id": record["id"], "message": "Your enquiry has been received."}


@api_router.post("/contact-submissions", status_code=201)
async def create_contact_submission(payload: ContactSubmissionCreate) -> Dict[str, str]:
    record = base_record(payload.model_dump())
    await db.contact_submissions.insert_one(record)
    return {"id": record["id"], "message": "Your message has been received."}


@api_router.post("/auth/login")
async def login(payload: AuthInput, request: Request) -> Dict[str, Any]:
    identifier = f"{request.client.host if request.client else 'unknown'}:{payload.email.lower()}"
    attempt = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if attempt and attempt.get("locked_until", "") > now_iso():
        raise HTTPException(429, "Too many attempts. Please try again later.")
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        failed = (attempt or {}).get("count", 0) + 1
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": {"identifier": identifier, "count": failed, "locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat() if failed >= 5 else ""}}, upsert=True)
        raise HTTPException(401, "Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    from fastapi.responses import JSONResponse
    response = JSONResponse({"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]})
    set_auth_cookies(response, user["id"], user["email"])
    return response


@api_router.get("/auth/me")
async def me(user: Dict[str, Any] = Depends(current_user)) -> Dict[str, Any]:
    return user


@api_router.post("/auth/logout")
async def logout() -> Dict[str, str]:
    from fastapi.responses import JSONResponse
    response = JSONResponse({"message": "Logged out"})
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return response


@api_router.get("/admin/enquiries")
async def admin_enquiries(_: Dict[str, Any] = Depends(admin_user)) -> List[Dict[str, Any]]:
    return await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.get("/admin/contact-submissions")
async def admin_contacts(_: Dict[str, Any] = Depends(admin_user)) -> List[Dict[str, Any]]:
    return await db.contact_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


app.include_router(api_router)
origins = [item.strip() for item in os.environ["CORS_ORIGINS"].split(",") if item.strip()]
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=origins, allow_methods=["*"], allow_headers=["*"])


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()