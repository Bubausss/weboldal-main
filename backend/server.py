from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
import secrets
import string
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'ghost-driver-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    invite_key: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    is_admin: bool
    subscription_days: int
    subscription_end: Optional[str] = None
    is_banned: bool = False
    created_at: str

class InviteKeyResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    key: str
    created_by: str
    used: bool
    used_by: Optional[str] = None
    created_at: str

class InviteRequestCreate(BaseModel):
    email: EmailStr
    reason: str

class InviteRequestResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    reason: str
    status: str  # pending, approved, rejected
    invite_key: Optional[str] = None
    created_at: str

class UserConfigCreate(BaseModel):
    # ESP Settings
    esp_enabled: bool = False
    esp_color: str = "#FF0000"
    esp_sound: bool = False
    esp_sound_color: str = "#FFFF00"
    esp_head_circle: bool = False
    esp_snap_line: bool = False
    
    # RCS Settings
    rcs_enabled: bool = False
    rcs_strength: int = 50
    
    # Triggerbot Settings
    triggerbot_enabled: bool = False
    triggerbot_delay: int = 100
    triggerbot_key: str = "MOUSE4"
    
    # Radar Settings
    radar_enabled: bool = False
    radar_color: str = "#00FF00"
    
    # Grenade Prediction Settings
    grenade_prediction_enabled: bool = False
    grenade_prediction_color: str = "#FF8800"
    
    # Bomb Timer Settings
    bomb_timer_enabled: bool = False
    bomb_timer_color: str = "#FF0000"
    
    # Spectator List Settings
    spectator_list_enabled: bool = False
    spectator_list_color: str = "#FFFFFF"

class UserConfigResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    
    # ESP Settings
    esp_enabled: bool
    esp_color: str = "#FF0000"
    esp_sound: bool = False
    esp_sound_color: str = "#FFFF00"
    esp_head_circle: bool = False
    esp_snap_line: bool = False
    
    # RCS Settings
    rcs_enabled: bool
    rcs_strength: int = 50
    
    # Triggerbot Settings
    triggerbot_enabled: bool
    triggerbot_delay: int = 100
    triggerbot_key: str = "MOUSE4"
    
    # Radar Settings
    radar_enabled: bool = False
    radar_color: str = "#00FF00"
    
    # Grenade Prediction Settings
    grenade_prediction_enabled: bool = False
    grenade_prediction_color: str = "#FF8800"
    
    # Bomb Timer Settings
    bomb_timer_enabled: bool = False
    bomb_timer_color: str = "#FF0000"
    
    # Spectator List Settings
    spectator_list_enabled: bool = False
    spectator_list_color: str = "#FFFFFF"
    
    updated_at: str

class SystemStatus(BaseModel):
    driver_status: str = "Undetected"
    last_update: str = "2 hours ago"
    killswitch_active: bool = False

class LiveStats(BaseModel):
    active_users: int
    server_connectivity: str

class ExtendSubscription(BaseModel):
    days: int

class SuggestionCreate(BaseModel):
    message: str

class SuggestionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_email: str
    message: str
    status: str = "new"  # new, reviewed, implemented
    created_at: str

# ============== HELPER FUNCTIONS ==============

def generate_invite_key():
    """Generate a key in format ANELY-XXXX-XXXX"""
    chars = string.ascii_uppercase + string.digits
    part1 = ''.join(secrets.choice(chars) for _ in range(4))
    part2 = ''.join(secrets.choice(chars) for _ in range(4))
    return f"ANELY-{part1}-{part2}"

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(user_id: str, is_admin: bool) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "is_admin": is_admin,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        if user.get("is_banned", False):
            raise HTTPException(status_code=403, detail="User is banned")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check invite key
    invite = await db.invite_keys.find_one({"key": user_data.invite_key, "used": False})
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or already used invite key")
    
    # Check if this is the admin key
    is_admin = user_data.invite_key.startswith("ADMIN-")
    
    # Create user
    user_id = str(uuid.uuid4())
    subscription_end = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "is_admin": is_admin,
        "subscription_days": 30,
        "subscription_end": subscription_end,
        "is_banned": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Mark invite key as used
    await db.invite_keys.update_one(
        {"key": user_data.invite_key},
        {"$set": {"used": True, "used_by": user_id}}
    )
    
    # Create default config
    config_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "esp_enabled": False,
        "esp_color": "#FF0000",
        "esp_sound": False,
        "esp_sound_color": "#FFFF00",
        "esp_head_circle": False,
        "esp_snap_line": False,
        "rcs_enabled": False,
        "rcs_strength": 50,
        "triggerbot_enabled": False,
        "triggerbot_delay": 100,
        "triggerbot_key": "MOUSE4",
        "radar_enabled": False,
        "radar_color": "#00FF00",
        "grenade_prediction_enabled": False,
        "grenade_prediction_color": "#FF8800",
        "bomb_timer_enabled": False,
        "bomb_timer_color": "#FF0000",
        "spectator_list_enabled": False,
        "spectator_list_color": "#FFFFFF",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_configs.insert_one(config_doc)
    
    token = create_token(user_id, is_admin)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "is_admin": is_admin,
            "subscription_days": 30
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.get("is_banned", False):
        raise HTTPException(status_code=403, detail="User is banned")
    
    token = create_token(user["id"], user.get("is_admin", False))
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "is_admin": user.get("is_admin", False),
            "subscription_days": user.get("subscription_days", 0)
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

# ============== INVITE REQUEST ROUTES (Public) ==============

@api_router.post("/invite-requests", response_model=InviteRequestResponse)
async def create_invite_request(request: InviteRequestCreate):
    # Check if email already has a pending request
    existing = await db.invite_requests.find_one({"email": request.email, "status": "pending"})
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending invite request")
    
    # Check if email is already registered
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")
    
    request_id = str(uuid.uuid4())
    doc = {
        "id": request_id,
        "email": request.email,
        "reason": request.reason,
        "status": "pending",
        "invite_key": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.invite_requests.insert_one(doc)
    return InviteRequestResponse(**doc)

# ============== SUGGESTION ROUTES ==============

@api_router.post("/suggestions", response_model=SuggestionResponse)
async def create_suggestion(suggestion: SuggestionCreate, current_user: dict = Depends(get_current_user)):
    suggestion_id = str(uuid.uuid4())
    doc = {
        "id": suggestion_id,
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "message": suggestion.message,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.suggestions.insert_one(doc)
    return SuggestionResponse(**doc)

@api_router.get("/admin/suggestions", response_model=dict)
async def get_suggestions(
    admin: dict = Depends(get_admin_user),
    skip: int = 0,
    limit: int = 50
):
    limit = min(limit, 100)
    total = await db.suggestions.count_documents({})
    suggestions = await db.suggestions.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {
        "suggestions": [SuggestionResponse(**s) for s in suggestions],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@api_router.post("/admin/suggestions/{suggestion_id}/review")
async def mark_suggestion_reviewed(suggestion_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.suggestions.update_one(
        {"id": suggestion_id},
        {"$set": {"status": "reviewed"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    return {"message": "Suggestion marked as reviewed"}

@api_router.delete("/admin/suggestions/{suggestion_id}")
async def delete_suggestion(suggestion_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.suggestions.delete_one({"id": suggestion_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    return {"message": "Suggestion deleted"}

# ============== CONFIG ROUTES ==============

@api_router.get("/config", response_model=UserConfigResponse)
async def get_config(current_user: dict = Depends(get_current_user)):
    config = await db.user_configs.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not config:
        # Create default config
        config = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "esp_enabled": False,
            "esp_color": "#FF0000",
            "esp_sound": False,
            "esp_sound_color": "#FFFF00",
            "esp_head_circle": False,
            "esp_snap_line": False,
            "rcs_enabled": False,
            "rcs_strength": 50,
            "triggerbot_enabled": False,
            "triggerbot_delay": 100,
            "triggerbot_key": "MOUSE4",
            "radar_enabled": False,
            "radar_color": "#00FF00",
            "grenade_prediction_enabled": False,
            "grenade_prediction_color": "#FF8800",
            "bomb_timer_enabled": False,
            "bomb_timer_color": "#FF0000",
            "spectator_list_enabled": False,
            "spectator_list_color": "#FFFFFF",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.user_configs.insert_one(config)
    return UserConfigResponse(**config)

@api_router.put("/config", response_model=UserConfigResponse)
async def update_config(config_data: UserConfigCreate, current_user: dict = Depends(get_current_user)):
    update_doc = config_data.model_dump()
    update_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.user_configs.find_one_and_update(
        {"user_id": current_user["id"]},
        {"$set": update_doc},
        return_document=True
    )
    
    if not result:
        # Create new config
        config_id = str(uuid.uuid4())
        update_doc["id"] = config_id
        update_doc["user_id"] = current_user["id"]
        await db.user_configs.insert_one(update_doc)
        result = update_doc
    
    # Remove _id for response
    if "_id" in result:
        del result["_id"]
    
    return UserConfigResponse(**result)

# ============== DASHBOARD ROUTES ==============

@api_router.get("/dashboard/status", response_model=SystemStatus)
async def get_system_status(current_user: dict = Depends(get_current_user)):
    # Check killswitch
    killswitch = await db.system_settings.find_one({"key": "killswitch"}, {"_id": 0})
    is_active = killswitch.get("active", False) if killswitch else False
    
    status = "OFFLINE - KILLSWITCH ACTIVE" if is_active else "Undetected"
    
    return SystemStatus(
        driver_status=status,
        last_update="2 hours ago",
        killswitch_active=is_active
    )

@api_router.get("/dashboard/stats", response_model=LiveStats)
async def get_live_stats(current_user: dict = Depends(get_current_user)):
    # Count active (non-banned) users
    active_count = await db.users.count_documents({"is_banned": False})
    
    return LiveStats(
        active_users=active_count,
        server_connectivity="Online"
    )

# ============== ADMIN ROUTES ==============

@api_router.get("/admin/users", response_model=dict)
async def get_all_users(
    admin: dict = Depends(get_admin_user),
    skip: int = 0,
    limit: int = 50
):
    limit = min(limit, 100)  # Max 100 per page
    total = await db.users.count_documents({})
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    return {
        "users": [UserResponse(**u) for u in users],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@api_router.post("/admin/users/{user_id}/ban")
async def ban_user(user_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_banned": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User banned successfully"}

@api_router.post("/admin/users/{user_id}/unban")
async def unban_user(user_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_banned": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User unbanned successfully"}

@api_router.post("/admin/users/{user_id}/extend")
async def extend_subscription(user_id: str, data: ExtendSubscription, admin: dict = Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_end = datetime.fromisoformat(user.get("subscription_end", datetime.now(timezone.utc).isoformat()))
    if current_end < datetime.now(timezone.utc):
        current_end = datetime.now(timezone.utc)
    
    new_end = current_end + timedelta(days=data.days)
    new_days = user.get("subscription_days", 0) + data.days
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"subscription_end": new_end.isoformat(), "subscription_days": new_days}}
    )
    
    return {"message": f"Subscription extended by {data.days} days"}

@api_router.get("/admin/invite-requests", response_model=dict)
async def get_invite_requests(
    admin: dict = Depends(get_admin_user),
    skip: int = 0,
    limit: int = 50
):
    limit = min(limit, 100)
    total = await db.invite_requests.count_documents({})
    requests = await db.invite_requests.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {
        "requests": [InviteRequestResponse(**r) for r in requests],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@api_router.post("/admin/invite-requests/{request_id}/approve")
async def approve_invite_request(request_id: str, admin: dict = Depends(get_admin_user)):
    request = await db.invite_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    # Generate invite key
    invite_key = generate_invite_key()
    
    # Create invite key in DB
    invite_doc = {
        "id": str(uuid.uuid4()),
        "key": invite_key,
        "created_by": admin["id"],
        "used": False,
        "used_by": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.invite_keys.insert_one(invite_doc)
    
    # Update request
    await db.invite_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "approved", "invite_key": invite_key}}
    )
    
    return {"message": "Request approved", "invite_key": invite_key}

@api_router.post("/admin/invite-requests/{request_id}/reject")
async def reject_invite_request(request_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.invite_requests.update_one(
        {"id": request_id, "status": "pending"},
        {"$set": {"status": "rejected"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found or already processed")
    return {"message": "Request rejected"}

@api_router.get("/admin/invite-keys", response_model=dict)
async def get_invite_keys(
    admin: dict = Depends(get_admin_user),
    skip: int = 0,
    limit: int = 50
):
    limit = min(limit, 100)
    total = await db.invite_keys.count_documents({})
    keys = await db.invite_keys.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {
        "keys": [InviteKeyResponse(**k) for k in keys],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@api_router.post("/admin/invite-keys/generate", response_model=InviteKeyResponse)
async def generate_new_invite_key(admin: dict = Depends(get_admin_user)):
    invite_key = generate_invite_key()
    
    doc = {
        "id": str(uuid.uuid4()),
        "key": invite_key,
        "created_by": admin["id"],
        "used": False,
        "used_by": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.invite_keys.insert_one(doc)
    return InviteKeyResponse(**doc)

@api_router.post("/admin/killswitch/activate")
async def activate_killswitch(admin: dict = Depends(get_admin_user)):
    await db.system_settings.update_one(
        {"key": "killswitch"},
        {"$set": {"active": True, "activated_by": admin["id"], "activated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "KILLSWITCH ACTIVATED - All drivers stopped"}

@api_router.post("/admin/killswitch/deactivate")
async def deactivate_killswitch(admin: dict = Depends(get_admin_user)):
    await db.system_settings.update_one(
        {"key": "killswitch"},
        {"$set": {"active": False}},
        upsert=True
    )
    return {"message": "Killswitch deactivated"}

@api_router.get("/admin/killswitch/status")
async def get_killswitch_status(admin: dict = Depends(get_admin_user)):
    killswitch = await db.system_settings.find_one({"key": "killswitch"}, {"_id": 0})
    return {"active": killswitch.get("active", False) if killswitch else False}

# ============== SETUP ROUTES ==============

@api_router.post("/setup/init-admin")
async def initialize_admin_key():
    """Create initial admin invite key if none exists"""
    existing = await db.invite_keys.find_one({"key": {"$regex": "^ADMIN-"}})
    if existing:
        return {"message": "Admin key already exists", "key": existing["key"]}
    
    # Generate admin key
    chars = string.ascii_uppercase + string.digits
    part1 = ''.join(secrets.choice(chars) for _ in range(4))
    part2 = ''.join(secrets.choice(chars) for _ in range(4))
    admin_key = f"ADMIN-{part1}-{part2}"
    
    doc = {
        "id": str(uuid.uuid4()),
        "key": admin_key,
        "created_by": "system",
        "used": False,
        "used_by": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.invite_keys.insert_one(doc)
    logger.info(f"Admin key created: {admin_key}")
    
    return {"message": "Admin key created", "key": admin_key}

# ============== DNS CONFIG ENDPOINT ==============
# Serves encrypted compact config for DNS TXT queries
# Format: OK|ESP|SOUND|HEAD|SNAP|RCS|RCS_STR|TRIG|TRIG_DLY|TRIG_KEY|...

import base64
import hashlib

@api_router.get("/dns-config")
async def get_dns_config(hwid: str = ""):
    """Serve encrypted compact config by HWID for DNS TXT tunnel queries"""
    if not hwid or len(hwid) < 8:
        return {"error": "ERR_NO_HWID"}
    
    # Find user by HWID hash (first 16 chars match)
    # In production, users table should have a hwid field
    # For now, try to match by searching configs
    users = await db.users.find({}, {"_id": 0}).to_list(100)
    
    matched_user = None
    for user in users:
        # Generate HWID hash from user ID for matching
        user_hwid_hash = hashlib.sha256(user["id"].encode()).hexdigest()[:16]
        if hwid.startswith(user_hwid_hash):
            matched_user = user
            break
    
    if not matched_user:
        return {"encrypted": base64.b64encode(b"ERR_AUTH").decode()}
    
    # Check subscription
    if matched_user.get("is_banned", False):
        return {"encrypted": base64.b64encode(b"ERR_BANNED").decode()}
    
    # Get user config
    config = await db.user_configs.find_one(
        {"user_id": matched_user["id"]}, {"_id": 0}
    )
    if not config:
        config = {}
    
    # Build compact config string (matches fetch_config.php format)
    parts = [
        "OK",
        "1" if config.get("esp_enabled", False) else "0",
        "1" if config.get("esp_sound", False) else "0",
        "1" if config.get("esp_head_circle", False) else "0",
        "1" if config.get("esp_snap_line", False) else "0",
        "1" if config.get("rcs_enabled", False) else "0",
        str(config.get("rcs_strength", 50)),
        "1" if config.get("triggerbot_enabled", False) else "0",
        str(config.get("triggerbot_delay", 100)),
        config.get("triggerbot_key", "MOUSE4"),
        "1" if config.get("radar_enabled", False) else "0",
        "1" if config.get("grenade_prediction_enabled", False) else "0",
        "1" if config.get("bomb_timer_enabled", False) else "0",
        "1" if config.get("spectator_list_enabled", False) else "0",
    ]
    compact_config = "|".join(parts)
    
    # Return as plain text (encryption handled by DNS tunnel layer)
    return {"config": compact_config, "format": "compact"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
