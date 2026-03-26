from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from databases import Database
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
import base64
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MySQL DB Connection
DB_USER = os.environ.get('DB_USER', 'buba')
DB_PASS = os.environ.get('DB_PASS', 'Jelszo123!')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_NAME = os.environ.get('DB_NAME', 'anely_db')

DATABASE_URL = f"mysql+aiomysql://{DB_USER}:{DB_PASS}@{DB_HOST}:3306/{DB_NAME}"
database = Database(DATABASE_URL)

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
    status: str
    invite_key: Optional[str] = None
    created_at: str

class UserConfigCreate(BaseModel):
    esp_enabled: bool = False
    esp_color: str = "#FF0000"
    esp_sound: bool = False
    esp_sound_color: str = "#FFFF00"
    esp_head_circle: bool = False
    esp_snap_line: bool = False
    rcs_enabled: bool = False
    rcs_strength: int = 50
    triggerbot_enabled: bool = False
    triggerbot_delay: int = 100
    triggerbot_key: str = "MOUSE4"
    radar_enabled: bool = False
    radar_color: str = "#00FF00"
    grenade_prediction_enabled: bool = False
    grenade_prediction_color: "#FF8800"
    bomb_timer_enabled: bool = False
    bomb_timer_color: str = "#FF0000"
    spectator_list_enabled: bool = False
    spectator_list_color: str = "#FFFFFF"

class UserConfigResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    esp_enabled: bool
    esp_color: str = "#FF0000"
    esp_sound: bool = False
    esp_sound_color: str = "#FFFF00"
    esp_head_circle: bool = False
    esp_snap_line: bool = False
    rcs_enabled: bool
    rcs_strength: int = 50
    triggerbot_enabled: bool
    triggerbot_delay: int = 100
    triggerbot_key: str = "MOUSE4"
    radar_enabled: bool = False
    radar_color: str = "#00FF00"
    grenade_prediction_enabled: bool = False
    grenade_prediction_color: str = "#FF8800"
    bomb_timer_enabled: bool = False
    bomb_timer_color: str = "#FF0000"
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
    status: str
    created_at: str

# ============== HELPER FUNCTIONS ==============

def generate_invite_key():
    chars = string.ascii_uppercase + string.digits
    part1 = ''.join(secrets.choice(chars) for _ in range(4))
    part2 = ''.join(secrets.choice(chars) for _ in range(4))
    return f"ANELY-{part1}-{part2}"

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(user_id: int, is_admin: bool) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": str(user_id),
        "is_admin": is_admin,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = int(user_id_str)
        user = await database.fetch_one("SELECT * FROM users WHERE id = :id", {"id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if user["is_banned"]:
            raise HTTPException(status_code=403, detail="User is banned")
        
        # Calculate sub days
        sub_days = 0
        if user["subscription_end"] and user["subscription_active"]:
            delta = user["subscription_end"].replace(tzinfo=timezone.utc) - datetime.now(timezone.utc)
            sub_days = max(0, delta.days)

        return {
            "id": str(user["id"]),
            "email": user["email"],
            "is_admin": bool(user["is_admin"]),
            "subscription_days": sub_days,
            "subscription_end": user["subscription_end"].isoformat() if user["subscription_end"] else None,
            "is_banned": bool(user["is_banned"]),
            "created_at": user["created_at"].isoformat() if user["created_at"] else ""
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    existing = await database.fetch_one("SELECT id FROM users WHERE email = :email", {"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    invite = await database.fetch_one("SELECT id, used FROM invite_keys WHERE key_string = :key", {"key": user_data.invite_key})
    if not invite or invite["used"]:
        raise HTTPException(status_code=400, detail="Invalid or already used invite key")
    
    is_admin = 1 if user_data.invite_key.startswith("ADMIN-") else 0
    username = user_data.email.split("@")[0]
    
    # Create user
    query = """
    INSERT INTO users (username, email, password_hash, is_admin, subscription_active, subscription_end)
    VALUES (:username, :email, :password_hash, :is_admin, 1, DATE_ADD(NOW(), INTERVAL 30 DAY))
    """
    values = {
        "username": username,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "is_admin": is_admin
    }
    user_id = await database.execute(query, values)
    
    # Mark invite key used
    await database.execute("UPDATE invite_keys SET used = 1, used_by_user_id = :uid, used_at = NOW() WHERE id = :id", {"uid": user_id, "id": invite["id"]})
    
    # Create default config
    cfg_query = """
    INSERT INTO user_configs (user_id) VALUES (:user_id)
    """
    await database.execute(cfg_query, {"user_id": user_id})
    
    token = create_token(user_id, bool(is_admin))
    return {
        "token": token,
        "user": {
            "id": str(user_id),
            "email": user_data.email,
            "is_admin": bool(is_admin),
            "subscription_days": 30
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(user_data: UserLogin):
    user = await database.fetch_one("SELECT * FROM users WHERE email = :email", {"email": user_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user["is_banned"]:
        raise HTTPException(status_code=403, detail="User is banned")
    
    sub_days = 0
    if user["subscription_end"] and user["subscription_active"]:
        delta = user["subscription_end"].replace(tzinfo=timezone.utc) - datetime.now(timezone.utc)
        sub_days = max(0, delta.days)
    
    token = create_token(user["id"], bool(user["is_admin"]))
    return {
        "token": token,
        "user": {
            "id": str(user["id"]),
            "email": user["email"],
            "is_admin": bool(user["is_admin"]),
            "subscription_days": sub_days
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

# ============== INVITE REQUEST ROUTES ==============

@api_router.post("/invite-requests", response_model=InviteRequestResponse)
async def create_invite_request(request: InviteRequestCreate):
    existing = await database.fetch_one("SELECT id FROM invite_requests WHERE email = :email AND status = 'pending'", {"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending invite request")
    
    existing_user = await database.fetch_one("SELECT id FROM users WHERE email = :email", {"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")
    
    query = "INSERT INTO invite_requests (email, reason, status) VALUES (:email, :reason, 'pending')"
    req_id = await database.execute(query, {"email": request.email, "reason": request.reason})
    
    return InviteRequestResponse(
        id=str(req_id),
        email=request.email,
        reason=request.reason,
        status="pending",
        created_at=datetime.now(timezone.utc).isoformat()
    )

# ============== SUGGESTION ROUTES ==============

@api_router.post("/suggestions", response_model=SuggestionResponse)
async def create_suggestion(suggestion: SuggestionCreate, current_user: dict = Depends(get_current_user)):
    query = "INSERT INTO suggestions (user_id, user_email, message, status) VALUES (:uid, :email, :msg, 'new')"
    sug_id = await database.execute(query, {"uid": int(current_user["id"]), "email": current_user["email"], "msg": suggestion.message})
    
    return SuggestionResponse(
        id=str(sug_id),
        user_id=current_user["id"],
        user_email=current_user["email"],
        message=suggestion.message,
        status="new",
        created_at=datetime.now(timezone.utc).isoformat()
    )

@api_router.get("/admin/suggestions", response_model=dict)
async def get_suggestions(admin: dict = Depends(get_admin_user), skip: int = 0, limit: int = 50):
    limit = min(limit, 100)
    total = await database.fetch_val("SELECT COUNT(*) FROM suggestions")
    rows = await database.fetch_all("SELECT * FROM suggestions ORDER BY created_at DESC LIMIT :limit OFFSET :skip", {"limit": limit, "skip": skip})
    
    suggestions = [{
        "id": str(r["id"]),
        "user_id": str(r["user_id"]),
        "user_email": r["user_email"],
        "message": r["message"],
        "status": r["status"],
        "created_at": r["created_at"].isoformat() if r["created_at"] else ""
    } for r in rows]
    return {"suggestions": suggestions, "total": total, "skip": skip, "limit": limit}

@api_router.post("/admin/suggestions/{suggestion_id}/review")
async def mark_suggestion_reviewed(suggestion_id: str, admin: dict = Depends(get_admin_user)):
    result = await database.execute("UPDATE suggestions SET status = 'reviewed' WHERE id = :id", {"id": int(suggestion_id)})
    if not result:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    return {"message": "Suggestion marked as reviewed"}

@api_router.delete("/admin/suggestions/{suggestion_id}")
async def delete_suggestion(suggestion_id: str, admin: dict = Depends(get_admin_user)):
    result = await database.execute("DELETE FROM suggestions WHERE id = :id", {"id": int(suggestion_id)})
    if not result:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    return {"message": "Suggestion deleted"}

# ============== CONFIG ROUTES ==============

@api_router.get("/config", response_model=UserConfigResponse)
async def get_config(current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["id"])
    config = await database.fetch_one("SELECT * FROM user_configs WHERE user_id = :uid", {"uid": user_id})
    if not config:
        await database.execute("INSERT INTO user_configs (user_id) VALUES (:uid)", {"uid": user_id})
        config = await database.fetch_one("SELECT * FROM user_configs WHERE user_id = :uid", {"uid": user_id})
    
    return UserConfigResponse(
        id=str(config["id"]),
        user_id=str(config["user_id"]),
        esp_enabled=bool(config["esp_enabled"]),
        esp_color=config["esp_color"],
        esp_sound=bool(config["esp_sound"]),
        esp_sound_color=config["esp_sound_color"],
        esp_head_circle=bool(config["esp_head_circle"]),
        esp_snap_line=bool(config["esp_snap_line"]),
        rcs_enabled=bool(config["rcs_enabled"]),
        rcs_strength=config["rcs_strength"],
        triggerbot_enabled=bool(config["triggerbot_enabled"]),
        triggerbot_delay=config["triggerbot_delay"],
        triggerbot_key=config["triggerbot_key"],
        radar_enabled=bool(config["radar_enabled"]),
        radar_color=config["radar_color"],
        grenade_prediction_enabled=bool(config["grenade_prediction_enabled"]),
        grenade_prediction_color=config["grenade_prediction_color"],
        bomb_timer_enabled=bool(config["bomb_timer_enabled"]),
        bomb_timer_color=config["bomb_timer_color"],
        spectator_list_enabled=bool(config["spectator_list_enabled"]),
        spectator_list_color=config["spectator_list_color"],
        updated_at=config["updated_at"].isoformat() if config["updated_at"] else ""
    )

@api_router.put("/config", response_model=UserConfigResponse)
async def update_config(config_data: UserConfigCreate, current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["id"])
    data = config_data.model_dump()
    data["uid"] = user_id
    
    query = """
    UPDATE user_configs SET
        esp_enabled = :esp_enabled, esp_color = :esp_color, esp_sound = :esp_sound, esp_sound_color = :esp_sound_color,
        esp_head_circle = :esp_head_circle, esp_snap_line = :esp_snap_line,
        rcs_enabled = :rcs_enabled, rcs_strength = :rcs_strength,
        triggerbot_enabled = :triggerbot_enabled, triggerbot_delay = :triggerbot_delay, triggerbot_key = :triggerbot_key,
        radar_enabled = :radar_enabled, radar_color = :radar_color,
        grenade_prediction_enabled = :grenade_prediction_enabled, grenade_prediction_color = :grenade_prediction_color,
        bomb_timer_enabled = :bomb_timer_enabled, bomb_timer_color = :bomb_timer_color,
        spectator_list_enabled = :spectator_list_enabled, spectator_list_color = :spectator_list_color
    WHERE user_id = :uid
    """
    await database.execute(query, data)
    return await get_config(current_user)

# ============== DASHBOARD ROUTES ==============

@api_router.get("/dashboard/status", response_model=SystemStatus)
async def get_system_status(current_user: dict = Depends(get_current_user)):
    killswitch = await database.fetch_one("SELECT active FROM system_settings WHERE setting_key = 'killswitch'")
    is_active = bool(killswitch["active"]) if killswitch else False
    status_str = "OFFLINE - KILLSWITCH ACTIVE" if is_active else "Undetected"
    return SystemStatus(driver_status=status_str, killswitch_active=is_active)

@api_router.get("/dashboard/stats", response_model=LiveStats)
async def get_live_stats(current_user: dict = Depends(get_current_user)):
    active_count = await database.fetch_val("SELECT COUNT(*) FROM users WHERE is_banned = 0")
    return LiveStats(active_users=active_count, server_connectivity="Online")

# ============== ADMIN ROUTES ==============

@api_router.get("/admin/users", response_model=dict)
async def get_all_users(admin: dict = Depends(get_admin_user), skip: int = 0, limit: int = 50):
    limit = min(limit, 100)
    total = await database.fetch_val("SELECT COUNT(*) FROM users")
    rows = await database.fetch_all("SELECT * FROM users LIMIT :limit OFFSET :skip", {"limit": limit, "skip": skip})
    
    users = []
    for r in rows:
        sub_days = 0
        if r["subscription_end"] and r["subscription_active"]:
            delta = r["subscription_end"].replace(tzinfo=timezone.utc) - datetime.now(timezone.utc)
            sub_days = max(0, delta.days)
        
        users.append({
            "id": str(r["id"]),
            "email": r["email"],
            "is_admin": bool(r["is_admin"]),
            "subscription_days": sub_days,
            "subscription_end": r["subscription_end"].isoformat() if r["subscription_end"] else None,
            "is_banned": bool(r["is_banned"]),
            "created_at": r["created_at"].isoformat() if r["created_at"] else ""
        })
    return {"users": users, "total": total, "skip": skip, "limit": limit}

@api_router.post("/admin/users/{user_id}/ban")
async def ban_user(user_id: str, admin: dict = Depends(get_admin_user)):
    res = await database.execute("UPDATE users SET is_banned = 1 WHERE id = :id", {"id": int(user_id)})
    if not res: raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User banned successfully"}

@api_router.post("/admin/users/{user_id}/unban")
async def unban_user(user_id: str, admin: dict = Depends(get_admin_user)):
    res = await database.execute("UPDATE users SET is_banned = 0 WHERE id = :id", {"id": int(user_id)})
    if not res: raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User unbanned successfully"}

@api_router.post("/admin/users/{user_id}/extend")
async def extend_subscription(user_id: str, data: ExtendSubscription, admin: dict = Depends(get_admin_user)):
    user = await database.fetch_one("SELECT subscription_end FROM users WHERE id = :id", {"id": int(user_id)})
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    current_end = user["subscription_end"] if user["subscription_end"] else datetime.now(timezone.utc)
    current_end = current_end.replace(tzinfo=timezone.utc)
    if current_end < datetime.now(timezone.utc):
        current_end = datetime.now(timezone.utc)
    
    new_end = current_end + timedelta(days=data.days)
    await database.execute("UPDATE users SET subscription_end = :end, subscription_active = 1 WHERE id = :id", {"end": new_end, "id": int(user_id)})
    return {"message": f"Subscription extended by {data.days} days"}

@api_router.get("/admin/invite-requests", response_model=dict)
async def get_invite_requests(admin: dict = Depends(get_admin_user), skip: int = 0, limit: int = 50):
    limit = min(limit, 100)
    total = await database.fetch_val("SELECT COUNT(*) FROM invite_requests")
    rows = await database.fetch_all("SELECT * FROM invite_requests ORDER BY created_at DESC LIMIT :limit OFFSET :skip", {"limit": limit, "skip": skip})
    
    reqs = [{
        "id": str(r["id"]),
        "email": r["email"],
        "reason": r["reason"],
        "status": r["status"],
        "invite_key": r["invite_key"],
        "created_at": r["created_at"].isoformat() if r["created_at"] else ""
    } for r in rows]
    return {"requests": reqs, "total": total, "skip": skip, "limit": limit}

@api_router.post("/admin/invite-requests/{request_id}/approve")
async def approve_invite_request(request_id: str, admin: dict = Depends(get_admin_user)):
    req = await database.fetch_one("SELECT * FROM invite_requests WHERE id = :id", {"id": int(request_id)})
    if not req: raise HTTPException(status_code=404, detail="Request not found")
    if req["status"] != "pending": raise HTTPException(status_code=400, detail="Request already processed")
    
    invoke_key = generate_invite_key()
    await database.execute("INSERT INTO invite_keys (key_string, created_by) VALUES (:key, :admin_id)", {"key": invoke_key, "admin_id": int(admin["id"])})
    await database.execute("UPDATE invite_requests SET status = 'approved', invite_key = :key WHERE id = :id", {"key": invoke_key, "id": int(request_id)})
    return {"message": "Request approved", "invite_key": invoke_key}

@api_router.post("/admin/invite-requests/{request_id}/reject")
async def reject_invite_request(request_id: str, admin: dict = Depends(get_admin_user)):
    res = await database.execute("UPDATE invite_requests SET status = 'rejected' WHERE id = :id AND status = 'pending'", {"id": int(request_id)})
    if not res: raise HTTPException(status_code=404, detail="Request not found or processed")
    return {"message": "Request rejected"}

@api_router.get("/admin/invite-keys", response_model=dict)
async def get_invite_keys(admin: dict = Depends(get_admin_user), skip: int = 0, limit: int = 50):
    limit = min(limit, 100)
    total = await database.fetch_val("SELECT COUNT(*) FROM invite_keys")
    rows = await database.fetch_all("SELECT * FROM invite_keys ORDER BY created_at DESC LIMIT :limit OFFSET :skip", {"limit": limit, "skip": skip})
    
    keys = [{
        "id": str(r["id"]),
        "key": r["key_string"],
        "created_by": str(r["created_by"]) if r["created_by"] else "system",
        "used": bool(r["used"]),
        "used_by": str(r["used_by_user_id"]) if r["used_by_user_id"] else None,
        "created_at": r["created_at"].isoformat() if r["created_at"] else ""
    } for r in rows]
    return {"keys": keys, "total": total, "skip": skip, "limit": limit}

@api_router.post("/admin/invite-keys/generate", response_model=InviteKeyResponse)
async def generate_new_invite_key(admin: dict = Depends(get_admin_user)):
    invite_key = generate_invite_key()
    key_id = await database.execute("INSERT INTO invite_keys (key_string, created_by) VALUES (:key, :uid)", {"key": invite_key, "uid": int(admin["id"])})
    return InviteKeyResponse(
        id=str(key_id),
        key=invite_key,
        created_by=admin["id"],
        used=False,
        used_by=None,
        created_at=datetime.now(timezone.utc).isoformat()
    )

@api_router.post("/admin/killswitch/activate")
async def activate_killswitch(admin: dict = Depends(get_admin_user)):
    query = """
    INSERT INTO system_settings (setting_key, active, activated_by, activated_at) 
    VALUES ('killswitch', 1, :uid, NOW()) 
    ON DUPLICATE KEY UPDATE active = 1, activated_by = :uid, activated_at = NOW()
    """
    await database.execute(query, {"uid": int(admin["id"])})
    return {"message": "KILLSWITCH ACTIVATED - All drivers stopped"}

@api_router.post("/admin/killswitch/deactivate")
async def deactivate_killswitch(admin: dict = Depends(get_admin_user)):
    query = """
    INSERT INTO system_settings (setting_key, active) 
    VALUES ('killswitch', 0) 
    ON DUPLICATE KEY UPDATE active = 0
    """
    await database.execute(query, {})
    return {"message": "Killswitch deactivated"}

@api_router.get("/setup/init-admin")
async def initialize_admin_key():
    return {"message": "Use automatic admin login setup based on email."}

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

@app.on_event("startup")
async def startup_event():
    await database.connect()
    
    # User's exact admin initialization request
    admin_email = "vvargalevente@gmail.com"
    admin = await database.fetch_one("SELECT id FROM users WHERE email = :email", {"email": admin_email})
    if not admin:
        hashed = pwd_context.hash("b836221B")
        query = """
        INSERT INTO users (username, email, password_hash, is_admin, subscription_active, subscription_end)
        VALUES ('Admin', :email, :password, 1, 1, DATE_ADD(NOW(), INTERVAL 365 DAY))
        """
        await database.execute(query, {"email": admin_email, "password": hashed})
        logger.info(f"Created primary admin user: {admin_email}")

@app.on_event("shutdown")
async def shutdown_event():
    await database.disconnect()
