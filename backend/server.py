from dotenv import load_dotenv

load_dotenv()

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional
import logging
import os
import re
import secrets
import uuid

import bcrypt
import jwt
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
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
app = FastAPI(title="Sukhara Travels API", version="5.0.0")
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
    phone: str = Field(min_length=5, max_length=40, pattern=r"^[0-9+\-\s()]+$")
    email: Optional[EmailStr] = None
    destination: Optional[str] = None
    package_id: Optional[str] = None
    travel_date: Optional[str] = None
    travellers: Optional[str] = None
    adults: Optional[str] = Field(default=None, max_length=10)
    children: Optional[str] = Field(default=None, max_length=10)
    budget: Optional[str] = None
    holiday_type: Optional[str] = None
    hotel_preference: Optional[str] = None
    transportation_preference: Optional[str] = None
    special_requirements: Optional[str] = None
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

BLOG_SEEDS = [
    {
        "title": "A slower way to see Kashmir",
        "category": "Destinations",
        "excerpt": "The valley rewards travellers who leave room in the plan. Notes on pacing a Kashmir trip so it feels like a holiday, not a checklist.",
        "content": "Most Kashmir itineraries try to do too much. Srinagar, Gulmarg, Pahalgam and Sonamarg in four days sounds efficient on paper — and exhausting in practice.\n\nA better approach is to pick a base and let the valley come to you. Two unhurried days on and around Dal Lake, a slow morning walk through the old city, and one or two day trips into the meadows will tell you more about Kashmir than a rushed circuit ever could.\n\nTravel in shoulder season if you can. April brings blossom, October brings gold — and both bring thinner crowds than peak summer. Keep one afternoon completely unplanned; in our experience that is the afternoon people remember.\n\nWhen you are ready, we can shape a Kashmir route around the pace you actually enjoy.",
    },
    {
        "title": "How to choose between Bali and the Maldives",
        "category": "Planning",
        "excerpt": "Both are beautiful. They are also completely different holidays. A simple way to decide which one is yours.",
        "content": "The Maldives is a place you go to stop. Barefoot mornings, warm water, long lunches and very little agenda. If your idea of a perfect day is doing almost nothing, beautifully, it is hard to beat.\n\nBali is a place you go to wander. Temples at sunrise, rice-terrace walks, cafés in Ubud, beach clubs in Seminyak — the island rewards curiosity and a little bit of planning.\n\nA few honest questions settle it quickly. Do you want one resort or several bases? Do you want to explore most days, or barely leave the lagoon? Is this a switch-off trip or a see-everything trip?\n\nThere is no wrong answer — only the one that fits the way you like to travel. Tell us your answers and we will tell you which island we would pick for you.",
    },
    {
        "title": "What a thoughtfully planned honeymoon actually looks like",
        "category": "Honeymoon",
        "excerpt": "The best honeymoons are not the most expensive ones. They are the ones with room to breathe. Here is how we think about them.",
        "content": "A honeymoon has one unusual requirement: it comes right after a wedding, when most couples are pleasantly exhausted. The single kindest thing an itinerary can do is start slow.\n\nWe like to open with two or three nights somewhere effortless — a resort where the biggest decision is breakfast — before any sightseeing begins. From there, one beautiful experience a day is plenty: a sunset cruise, a private dinner, a morning snorkel.\n\nSmall details matter more than grand gestures. A room with a view you will actually sit in. Transfers that do not eat a day. One surprise neither of you planned.\n\nIf you are dreaming about where to go, tell us how you like to travel together. We will help turn it into the right first journey.",
    },
]

FAQ_SEEDS = [
    ("General", "How far in advance should I plan my trip?", "For domestic holidays, 3–6 weeks is usually comfortable. For international trips and peak-season travel, 2–3 months gives the best choice of stays and fares. That said, tell us your dates — we will always tell you honestly what is possible.", 1),
    ("Bookings", "How do I book a holiday with Sukhara?", "Start with an enquiry — through the website, WhatsApp or a call. We discuss your trip, share a tailored itinerary and quote, and once you are happy, confirm your booking with a clear payment schedule.", 1),
    ("Payments", "How do payments work?", "Once your itinerary is finalised, we share a clear cost breakdown and payment schedule before you confirm anything. An advance secures your bookings, and the balance is due before travel — the exact terms are always shared in writing first.", 1),
    ("Cancellation", "What is your cancellation policy?", "Cancellation terms depend on the hotels, airlines and providers in your specific itinerary. We share the exact terms that apply to your trip before you confirm, so there are no surprises later.", 1),
    ("Customized Trips", "Can you build a trip around my budget?", "Yes — that is our favourite way to work. Tell us your destination, dates and a comfortable budget range, and we will shape an itinerary around it, explaining honestly what each choice adds or saves.", 1),
    ("International Travel", "Do you help with visas and documentation?", "We guide you on the documentation, timelines and application process for your destination, and flag anything that needs early attention. Visa decisions always rest with the respective embassy or authority.", 1),
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
    if await db.destinations.count_documents({}) == 0:
        for name, country, category, short, full, image, highlights, season, duration in DESTINATION_SEEDS:
            slug = name.lower().replace(" ", "-")
            record = base_record({"name": name, "slug": slug, "country": country, "category": category, "short_description": short, "full_description": full, "hero_image": image, "gallery": [image], "highlights": highlights, "best_time_to_visit": season, "recommended_duration": duration, "featured": True, "published": True, "seo_title": f"{name} Holidays | Sukhara Travels", "seo_description": short})
            await db.destinations.insert_one(record)
            ids[name] = record["id"]
    else:
        async for doc in db.destinations.find({}, {"_id": 0, "name": 1, "id": 1}):
            ids[doc["name"]] = doc["id"]
    packages = [
        ("Valleys of Kashmir", "Kashmir", "Domestic Holidays", "6 days / 5 nights", "₹42,500", ["Srinagar", "Gulmarg", "Pahalgam"]),
        ("The Bali Edit", "Bali", "International Holidays", "7 days / 6 nights", "₹58,900", ["Ubud", "Nusa Dua", "Seminyak"]),
        ("Blue Horizon Escape", "Maldives", "International Holidays", "4 days / 3 nights", "₹68,500", ["Overwater villa", "Breakfast", "Transfers"]),
        ("Goa, Slowly", "Goa", "Domestic Holidays", "5 days / 4 nights", "₹29,500", ["North Goa", "Old Goa", "Sunset cruise"]),
    ]
    if await db.packages.count_documents({}) == 0:
        for title, destination, category, duration, price, highlights in packages:
            slug = title.lower().replace(" ", "-").replace(",", "")
            package = base_record({"title": title, "slug": slug, "destination_id": ids.get(destination, ""), "destination": destination, "category": category, "short_description": f"A considered {duration.lower()} journey through {destination}.", "full_description": f"A sample demonstration itinerary for {destination}, designed to show how Sukhara can shape an easy, memorable holiday.", "duration": duration, "starting_price": price, "hero_image": next(item[5] for item in DESTINATION_SEEDS if item[0] == destination), "gallery": [next(item[5] for item in DESTINATION_SEEDS if item[0] == destination)], "highlights": highlights, "inclusions": ["Accommodation as listed", "Daily breakfast", "Private transfers"], "exclusions": ["International flights", "Personal expenses", "Travel insurance"], "featured": True, "published": True, "seo_title": f"{title} | Sukhara Travels", "seo_description": f"Explore the sample {title} itinerary."})
            await db.packages.insert_one(package)
            for day, day_title in enumerate(["Arrive and settle in", "A day to discover", "The scenic route", "Time to wander", "One last beautiful morning"], 1):
                await db.package_itineraries.insert_one({"id": new_id(), "package_id": package["id"], "day_number": day, "title": day_title, "description": f"A flexible sample day in {destination}, with space for local experiences and easy moments.", "meals": "Breakfast", "accommodation": "Selected stay", "activities": highlights[:2]})
    if await db.blog_posts.count_documents({}) == 0:
        for index, post in enumerate(BLOG_SEEDS):
            record = base_record({**post, "slug": slugify(post["title"]), "author": "Sukhara Travels", "cover_image": DESTINATION_SEEDS[[1, 5, 6][index]][5], "published": True, "published_at": now_iso(), "seo_title": f"{post['title']} | Sukhara Journal", "seo_description": post["excerpt"]})
            await db.blog_posts.insert_one(record)
    if await db.faqs.count_documents({}) == 0:
        for category, question, answer, order in FAQ_SEEDS:
            await db.faqs.insert_one(base_record({"question": question, "answer": answer, "category": category, "sort_order": order, "published": True}))
    if await db.gallery.count_documents({}) == 0:
        for name, _, _, _, _, image, *_ in DESTINATION_SEEDS:
            await db.gallery.insert_one(base_record({"title": f"{name}, in focus", "image_url": image, "category": "Destinations", "destination": name, "published": True}))
    await db.website_settings.update_one({"id": "main"}, {"$setOnInsert": {"id": "main", "company_name": "Sukhara Travels and Tourism", "logo": "", "favicon": "", "phone": "+91 98765 43210", "whatsapp": "919876543210", "email": "hello@sukharatravels.com", "address": "Kerala, India", "map_url": "", "instagram": "", "facebook": "", "youtube": "", "business_hours": "Mon–Sat · 9am–6pm", "default_seo_title": "Sukhara Travels & Tourism | Thoughtful Journeys", "default_seo_description": "Thoughtfully planned domestic and international journeys."}}, upsert=True)
    admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if not admin:
        await db.users.insert_one({"id": new_id(), "email": ADMIN_EMAIL, "password_hash": hash_password(ADMIN_PASSWORD), "name": "Sukhara Administrator", "role": "admin", "created_at": now_iso()})
    elif not verify_password(ADMIN_PASSWORD, admin["password_hash"]):
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})


async def migrate_enquiries() -> None:
    await db.enquiries.update_many({"status": "quoted"}, {"$set": {"status": "quotation-sent"}})
    await db.enquiries.update_many({"status": "booked"}, {"$set": {"status": "confirmed"}})
    missing = db.enquiries.find({"$or": [{"lead_id": {"$exists": False}}, {"notes": {"$exists": False}}, {"timeline": {"$exists": False}}]}).sort("created_at", 1)
    sequence = await db.enquiries.count_documents({"lead_id": {"$exists": True}})
    year = datetime.now(timezone.utc).year
    async for doc in missing:
        sequence += 1
        updates: Dict[str, Any] = {}
        if "lead_id" not in doc:
            updates["lead_id"] = f"ST-{year}-{sequence:04d}"
        if "notes" not in doc:
            updates["notes"] = ([{"id": new_id(), "text": doc["admin_notes"], "created_at": doc.get("updated_at") or doc["created_at"], "by": "Admin"}] if doc.get("admin_notes") else [])
        if "timeline" not in doc:
            updates["timeline"] = [{"event": "Enquiry created", "at": doc["created_at"], "by": "Website"}]
        await db.enquiries.update_one({"id": doc["id"]}, {"$set": updates})


@app.on_event("startup")
async def startup() -> None:
    await seed_content()
    await migrate_enquiries()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or secrets.token_hex(4)


async def unique_slug(collection: Any, base: str, exclude_id: Optional[str] = None) -> str:
    candidate, counter = base, 2
    while True:
        query: Dict[str, Any] = {"slug": candidate}
        if exclude_id:
            query["id"] = {"$ne": exclude_id}
        if not await collection.find_one(query, {"_id": 1}):
            return candidate
        candidate = f"{base}-{counter}"
        counter += 1


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


@api_router.get("/blog-posts/{slug}")
async def get_blog_post(slug: str) -> Dict[str, Any]:
    post = await db.blog_posts.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Article not found")
    post["related_posts"] = await db.blog_posts.find({"published": True, "slug": {"$ne": slug}, "category": post.get("category", "")}, {"_id": 0}).sort("published_at", -1).to_list(3)
    if not post["related_posts"]:
        post["related_posts"] = await db.blog_posts.find({"published": True, "slug": {"$ne": slug}}, {"_id": 0}).sort("published_at", -1).to_list(3)
    return post


@api_router.get("/faqs")
async def list_faqs() -> List[Dict[str, Any]]:
    return await db.faqs.find({"published": True}, {"_id": 0}).sort([("category", 1), ("sort_order", 1)]).to_list(100)


# ---------------- Public form rate limiting ----------------

SUBMISSION_WINDOW_SECONDS = 600
SUBMISSION_MAX = 5
submission_log: Dict[str, List[float]] = {}


def submission_guard(request: Request) -> None:
    forwarded = request.headers.get("x-forwarded-for")
    key = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    now = datetime.now(timezone.utc).timestamp()
    entries = [stamp for stamp in submission_log.get(key, []) if now - stamp < SUBMISSION_WINDOW_SECONDS]
    if len(entries) >= SUBMISSION_MAX:
        raise HTTPException(429, "Too many submissions in a short time. Please wait a few minutes and try again.")
    entries.append(now)
    submission_log[key] = entries


@api_router.post("/enquiries", status_code=201)
async def create_enquiry(payload: EnquiryCreate, request: Request) -> Dict[str, str]:
    submission_guard(request)
    data = payload.model_dump()
    if data.get("package_id"):
        package = await db.packages.find_one({"id": data["package_id"]}, {"_id": 0, "title": 1, "destination": 1})
        if package:
            data["package_title"] = package["title"]
            if not data.get("destination"):
                data["destination"] = package.get("destination", "")
    duplicate_checks: List[Dict[str, Any]] = [{"phone": data["phone"]}]
    if data.get("email"):
        duplicate_checks.append({"email": data["email"]})
    duplicate = await db.enquiries.find_one({"$or": duplicate_checks}, {"_id": 0, "id": 1})
    record = base_record(data)
    record["lead_id"] = f"ST-{datetime.now(timezone.utc).year}-{await db.enquiries.count_documents({}) + 1:04d}"
    record["status"] = "new"
    record["admin_notes"] = ""
    record["notes"] = []
    record["follow_up_date"] = ""
    record["follow_up_note"] = ""
    record["possible_duplicate"] = bool(duplicate)
    record["timeline"] = [{"event": "Enquiry created", "at": record["created_at"], "by": "Website"}]
    await db.enquiries.insert_one(record)
    return {"id": record["id"], "lead_id": record["lead_id"], "message": "Your enquiry has been received."}


@api_router.post("/contact-submissions", status_code=201)
async def create_contact_submission(payload: ContactSubmissionCreate, request: Request) -> Dict[str, str]:
    submission_guard(request)
    record = base_record(payload.model_dump())
    record["status"] = "new"
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
    response = JSONResponse({"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]})
    set_auth_cookies(response, user["id"], user["email"])
    return response


@api_router.get("/auth/me")
async def me(user: Dict[str, Any] = Depends(current_user)) -> Dict[str, Any]:
    return user


@api_router.post("/auth/refresh")
async def refresh_session(request: Request) -> Dict[str, str]:
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    user = await db.users.find_one({"id": payload.get("sub")})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    response = JSONResponse({"message": "Session refreshed"})
    response.set_cookie("access_token", create_token(user["id"], user["email"], "access", timedelta(minutes=15)), httponly=True, secure=True, samesite="none", max_age=900, path="/")
    return response


@api_router.post("/auth/logout")
async def logout() -> Dict[str, str]:
    response = JSONResponse({"message": "Logged out"})
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return response


# ---------------- Admin: dashboard & enquiry management ----------------

ENQUIRY_STATUS_VALUES = {"new", "contacted", "follow-up", "quotation-sent", "confirmed", "closed", "lost"}
ENQUIRY_STATUS_LABELS = {"new": "New", "contacted": "Contacted", "follow-up": "Follow-up", "quotation-sent": "Quotation Sent", "confirmed": "Confirmed", "closed": "Closed", "lost": "Lost"}
ENQUIRY_STATUS_ORDER = ["new", "contacted", "follow-up", "quotation-sent", "confirmed", "closed", "lost"]
TERMINAL_STATUSES = {"closed", "confirmed", "lost"}
CONTACT_STATUS_VALUES = {"new", "read", "replied"}


@api_router.get("/admin/stats")
async def admin_stats(_: Dict[str, Any] = Depends(admin_user)) -> Dict[str, Any]:
    tracked = {"destinations": db.destinations, "packages": db.packages, "enquiries": db.enquiries, "testimonials": db.testimonials, "faqs": db.faqs, "gallery": db.gallery, "blog_posts": db.blog_posts, "contact_submissions": db.contact_submissions}
    counts = {name: await collection.count_documents({}) for name, collection in tracked.items()}
    status_counts = {value: await db.enquiries.count_documents({"status": value}) for value in ENQUIRY_STATUS_ORDER}
    counts["status_counts"] = status_counts
    counts["new_enquiries"] = status_counts.get("new", 0)
    counts["new_contacts"] = await db.contact_submissions.count_documents({"status": {"$ne": "read"}})
    recent_enquiries = await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(6)
    recent_contacts = await db.contact_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(3)
    today = datetime.now(timezone.utc).date().isoformat()
    open_leads: Dict[str, Any] = {"status": {"$nin": list(TERMINAL_STATUSES)}}
    upcoming = await db.enquiries.find({**open_leads, "follow_up_date": {"$gte": today, "$ne": ""}}, {"_id": 0}).sort("follow_up_date", 1).to_list(5)
    overdue = await db.enquiries.find({**open_leads, "follow_up_date": {"$lt": today, "$ne": ""}}, {"_id": 0}).sort("follow_up_date", 1).to_list(5)
    counts["overdue_followups"] = await db.enquiries.count_documents({**open_leads, "follow_up_date": {"$lt": today, "$ne": ""}})
    return {"counts": counts, "recent_enquiries": recent_enquiries, "recent_contacts": recent_contacts, "upcoming_followups": upcoming, "overdue_followups": overdue}


@api_router.get("/admin/enquiries")
async def admin_enquiries(_: Dict[str, Any] = Depends(admin_user)) -> List[Dict[str, Any]]:
    return await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


class EnquiryUpdate(BaseModel):
    status: Optional[str] = None
    follow_up_date: Optional[str] = None
    follow_up_note: Optional[str] = None


@api_router.patch("/admin/enquiries/{item_id}")
async def admin_update_enquiry(item_id: str, payload: EnquiryUpdate, user: Dict[str, Any] = Depends(admin_user)) -> Dict[str, Any]:
    existing = await db.enquiries.find_one({"id": item_id}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Enquiry not found")
    data = {key: value for key, value in payload.model_dump().items() if value is not None}
    if "status" in data and data["status"] not in ENQUIRY_STATUS_VALUES:
        raise HTTPException(422, "Invalid status")
    if not data:
        raise HTTPException(422, "Nothing to update")
    actor = user.get("name") or user["email"]
    stamp = now_iso()
    events = []
    if "status" in data and data["status"] != existing.get("status", "new"):
        events.append({"event": f"Status changed to {ENQUIRY_STATUS_LABELS[data['status']]}", "at": stamp, "by": actor})
    if data.get("follow_up_date") and data.get("follow_up_date") != existing.get("follow_up_date"):
        events.append({"event": f"Follow-up scheduled for {data['follow_up_date']}", "at": stamp, "by": actor})
    data["updated_at"] = stamp
    update: Dict[str, Any] = {"$set": data}
    if events:
        update["$push"] = {"timeline": {"$each": events}}
    await db.enquiries.update_one({"id": item_id}, update)
    return public_doc(await db.enquiries.find_one({"id": item_id}, {"_id": 0}))


class NoteInput(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


@api_router.post("/admin/enquiries/{item_id}/notes", status_code=201)
async def admin_add_enquiry_note(item_id: str, payload: NoteInput, user: Dict[str, Any] = Depends(admin_user)) -> Dict[str, Any]:
    actor = user.get("name") or user["email"]
    stamp = now_iso()
    note = {"id": new_id(), "text": payload.text, "created_at": stamp, "by": actor}
    result = await db.enquiries.update_one({"id": item_id}, {"$push": {"notes": note, "timeline": {"event": "Internal note added", "at": stamp, "by": actor}}, "$set": {"updated_at": stamp}})
    if not result.matched_count:
        raise HTTPException(404, "Enquiry not found")
    return note


@api_router.delete("/admin/enquiries/{item_id}")
async def admin_delete_enquiry(item_id: str, _: Dict[str, Any] = Depends(admin_user)) -> Dict[str, str]:
    result = await db.enquiries.delete_one({"id": item_id})
    if not result.deleted_count:
        raise HTTPException(404, "Enquiry not found")
    return {"message": "Deleted"}


@api_router.get("/admin/contact-submissions")
async def admin_contacts(_: Dict[str, Any] = Depends(admin_user)) -> List[Dict[str, Any]]:
    return await db.contact_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


class ContactUpdate(BaseModel):
    status: Optional[str] = None


@api_router.patch("/admin/contact-submissions/{item_id}")
async def admin_update_contact(item_id: str, payload: ContactUpdate, _: Dict[str, Any] = Depends(admin_user)) -> Dict[str, Any]:
    data = {key: value for key, value in payload.model_dump().items() if value is not None}
    if "status" in data and data["status"] not in CONTACT_STATUS_VALUES:
        raise HTTPException(422, "Invalid status")
    if not data:
        raise HTTPException(422, "Nothing to update")
    data["updated_at"] = now_iso()
    result = await db.contact_submissions.update_one({"id": item_id}, {"$set": data})
    if not result.matched_count:
        raise HTTPException(404, "Submission not found")
    return public_doc(await db.contact_submissions.find_one({"id": item_id}, {"_id": 0}))


@api_router.delete("/admin/contact-submissions/{item_id}")
async def admin_delete_contact(item_id: str, _: Dict[str, Any] = Depends(admin_user)) -> Dict[str, str]:
    result = await db.contact_submissions.delete_one({"id": item_id})
    if not result.deleted_count:
        raise HTTPException(404, "Submission not found")
    return {"message": "Deleted"}


# ---------------- Admin: content management ----------------

class DestinationInput(BaseModel):
    name: str = Field(min_length=2, max_length=140)
    slug: Optional[str] = None
    country: str = ""
    category: str = ""
    short_description: str = ""
    full_description: str = ""
    hero_image: str = ""
    gallery: List[str] = Field(default_factory=list)
    highlights: List[str] = Field(default_factory=list)
    best_time_to_visit: str = ""
    recommended_duration: str = ""
    featured: bool = False
    published: bool = True
    seo_title: str = ""
    seo_description: str = ""


class TestimonialInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    location: str = ""
    trip: str = ""
    quote: str = ""
    rating: int = Field(default=5, ge=1, le=5)
    photo: str = ""
    date: str = ""
    sample: bool = False
    published: bool = True


class FaqInput(BaseModel):
    question: str = Field(min_length=2, max_length=300)
    answer: str = ""
    category: str = "General"
    sort_order: int = 0
    published: bool = True


class GalleryInput(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    image_url: str = Field(min_length=5)
    category: str = ""
    destination: str = ""
    published: bool = True


class BlogInput(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    slug: Optional[str] = None
    category: str = "Journal"
    author: str = "Sukhara Travels"
    excerpt: str = ""
    content: str = ""
    cover_image: str = ""
    published: bool = False
    seo_title: str = ""
    seo_description: str = ""


def blog_hook(data: Dict[str, Any], existing: Optional[Dict[str, Any]]) -> None:
    if data.get("published"):
        data["published_at"] = (existing or {}).get("published_at") or now_iso()
    else:
        data["published_at"] = None


def register_crud(resource: str, collection: Any, model: Any, *, slug_source: Optional[str] = None, sort: Optional[List[Any]] = None, hook: Optional[Callable[[Dict[str, Any], Optional[Dict[str, Any]]], None]] = None) -> None:
    async def list_items(_: Dict[str, Any] = Depends(admin_user)) -> List[Dict[str, Any]]:
        cursor = collection.find({}, {"_id": 0})
        if sort:
            cursor = cursor.sort(sort)
        return await cursor.to_list(500)

    async def create_item(payload: model, _: Dict[str, Any] = Depends(admin_user)) -> Dict[str, Any]:
        data = payload.model_dump()
        if slug_source:
            data["slug"] = await unique_slug(collection, slugify(data.get("slug") or data[slug_source]))
        if hook:
            hook(data, None)
        record = base_record(data)
        await collection.insert_one(record)
        return public_doc(record)

    async def update_item(item_id: str, payload: model, _: Dict[str, Any] = Depends(admin_user)) -> Dict[str, Any]:
        existing = await collection.find_one({"id": item_id}, {"_id": 0})
        if not existing:
            raise HTTPException(404, "Item not found")
        data = payload.model_dump()
        if slug_source:
            data["slug"] = await unique_slug(collection, slugify(data.get("slug") or data[slug_source]), exclude_id=item_id)
        if hook:
            hook(data, existing)
        data["updated_at"] = now_iso()
        await collection.update_one({"id": item_id}, {"$set": data})
        return public_doc(await collection.find_one({"id": item_id}, {"_id": 0}))

    async def delete_item(item_id: str, _: Dict[str, Any] = Depends(admin_user)) -> Dict[str, str]:
        result = await collection.delete_one({"id": item_id})
        if not result.deleted_count:
            raise HTTPException(404, "Item not found")
        return {"message": "Deleted"}

    api_router.get(f"/admin/{resource}", name=f"admin-{resource}-list")(list_items)
    api_router.post(f"/admin/{resource}", status_code=201, name=f"admin-{resource}-create")(create_item)
    api_router.put(f"/admin/{resource}/{{item_id}}", name=f"admin-{resource}-update")(update_item)
    api_router.delete(f"/admin/{resource}/{{item_id}}", name=f"admin-{resource}-delete")(delete_item)


register_crud("destinations", db.destinations, DestinationInput, slug_source="name", sort=[("name", 1)])
register_crud("testimonials", db.testimonials, TestimonialInput, sort=[("created_at", -1)])
register_crud("faqs", db.faqs, FaqInput, sort=[("category", 1), ("sort_order", 1)])
register_crud("gallery", db.gallery, GalleryInput, sort=[("created_at", -1)])
register_crud("blog-posts", db.blog_posts, BlogInput, slug_source="title", sort=[("created_at", -1)], hook=blog_hook)


# ---------------- Admin: packages & itineraries ----------------

class ItineraryDayInput(BaseModel):
    day_number: int = Field(default=1, ge=1, le=60)
    title: str = ""
    description: str = ""
    meals: str = ""
    accommodation: str = ""
    activities: List[str] = Field(default_factory=list)


class PackageInput(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    slug: Optional[str] = None
    destination_id: Optional[str] = None
    destination: str = ""
    category: str = ""
    short_description: str = ""
    full_description: str = ""
    duration: str = ""
    starting_price: str = ""
    hero_image: str = ""
    gallery: List[str] = Field(default_factory=list)
    highlights: List[str] = Field(default_factory=list)
    inclusions: List[str] = Field(default_factory=list)
    exclusions: List[str] = Field(default_factory=list)
    featured: bool = False
    published: bool = True
    seo_title: str = ""
    seo_description: str = ""
    itinerary: List[ItineraryDayInput] = Field(default_factory=list)


async def save_itinerary(package_id: str, days: List[Dict[str, Any]]) -> None:
    await db.package_itineraries.delete_many({"package_id": package_id})
    for index, day in enumerate(days, 1):
        await db.package_itineraries.insert_one({"id": new_id(), "package_id": package_id, "day_number": index, "title": day.get("title", ""), "description": day.get("description", ""), "meals": day.get("meals", ""), "accommodation": day.get("accommodation", ""), "activities": day.get("activities", [])})


async def resolve_destination_name(data: Dict[str, Any]) -> None:
    if data.get("destination_id") and not data.get("destination"):
        destination = await db.destinations.find_one({"id": data["destination_id"]}, {"_id": 0, "name": 1})
        if destination:
            data["destination"] = destination["name"]


@api_router.get("/admin/packages")
async def admin_list_packages(_: Dict[str, Any] = Depends(admin_user)) -> List[Dict[str, Any]]:
    return await db.packages.find({}, {"_id": 0}).sort("title", 1).to_list(500)


@api_router.get("/admin/packages/{item_id}")
async def admin_get_package(item_id: str, _: Dict[str, Any] = Depends(admin_user)) -> Dict[str, Any]:
    package = await db.packages.find_one({"id": item_id}, {"_id": 0})
    if not package:
        raise HTTPException(404, "Package not found")
    package["itinerary"] = await db.package_itineraries.find({"package_id": item_id}, {"_id": 0}).sort("day_number", 1).to_list(100)
    return package


@api_router.post("/admin/packages", status_code=201)
async def admin_create_package(payload: PackageInput, _: Dict[str, Any] = Depends(admin_user)) -> Dict[str, Any]:
    data = payload.model_dump()
    itinerary = [day for day in data.pop("itinerary")]
    data["slug"] = await unique_slug(db.packages, slugify(data.get("slug") or data["title"]))
    await resolve_destination_name(data)
    record = base_record(data)
    await db.packages.insert_one(record)
    await save_itinerary(record["id"], itinerary)
    return public_doc(record)


@api_router.put("/admin/packages/{item_id}")
async def admin_update_package(item_id: str, payload: PackageInput, _: Dict[str, Any] = Depends(admin_user)) -> Dict[str, Any]:
    existing = await db.packages.find_one({"id": item_id}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Package not found")
    data = payload.model_dump()
    itinerary = [day for day in data.pop("itinerary")]
    data["slug"] = await unique_slug(db.packages, slugify(data.get("slug") or data["title"]), exclude_id=item_id)
    await resolve_destination_name(data)
    data["updated_at"] = now_iso()
    await db.packages.update_one({"id": item_id}, {"$set": data})
    await save_itinerary(item_id, itinerary)
    return public_doc(await db.packages.find_one({"id": item_id}, {"_id": 0}))


@api_router.delete("/admin/packages/{item_id}")
async def admin_delete_package(item_id: str, _: Dict[str, Any] = Depends(admin_user)) -> Dict[str, str]:
    result = await db.packages.delete_one({"id": item_id})
    if not result.deleted_count:
        raise HTTPException(404, "Package not found")
    await db.package_itineraries.delete_many({"package_id": item_id})
    return {"message": "Deleted"}


# ---------------- Admin: website settings ----------------

class SettingsInput(BaseModel):
    company_name: Optional[str] = None
    logo: Optional[str] = None
    favicon: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    map_url: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    youtube: Optional[str] = None
    business_hours: Optional[str] = None
    default_seo_title: Optional[str] = None
    default_seo_description: Optional[str] = None


@api_router.get("/admin/settings")
async def admin_get_settings(_: Dict[str, Any] = Depends(admin_user)) -> Dict[str, Any]:
    return public_doc(await db.website_settings.find_one({"id": "main"}, {"_id": 0}) or {})


@api_router.put("/admin/settings")
async def admin_save_settings(payload: SettingsInput, _: Dict[str, Any] = Depends(admin_user)) -> Dict[str, Any]:
    data = {key: value for key, value in payload.model_dump().items() if value is not None}
    data["updated_at"] = now_iso()
    await db.website_settings.update_one({"id": "main"}, {"$set": data, "$setOnInsert": {"id": "main"}}, upsert=True)
    return public_doc(await db.website_settings.find_one({"id": "main"}, {"_id": 0}))


# ---------------- SEO: dynamic sitemap ----------------

SITE_URL = os.environ.get("SITE_URL", "https://sukharatravels.com").rstrip("/")
STATIC_SITEMAP_ROUTES = ["", "/blog", "/gallery", "/testimonials", "/faq", "/about", "/contact", "/customized-trips", "/honeymoon", "/family-holidays", "/corporate-group-travel"]


@api_router.get("/sitemap.xml")
async def sitemap_xml() -> Response:
    paths = list(STATIC_SITEMAP_ROUTES)
    async for doc in db.destinations.find({"published": True}, {"_id": 0, "slug": 1}):
        paths.append(f"/destinations/{doc['slug']}")
    async for doc in db.packages.find({"published": True}, {"_id": 0, "slug": 1}):
        paths.append(f"/packages/{doc['slug']}")
    async for doc in db.blog_posts.find({"published": True}, {"_id": 0, "slug": 1}):
        paths.append(f"/blog/{doc['slug']}")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += "\n".join(f"  <url><loc>{SITE_URL}{path}</loc></url>" for path in paths)
    xml += "\n</urlset>"
    return Response(content=xml, media_type="application/xml")


app.include_router(api_router)
origins = [item.strip() for item in os.environ["CORS_ORIGINS"].split(",") if item.strip()]
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=origins, allow_methods=["*"], allow_headers=["*"])


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()
