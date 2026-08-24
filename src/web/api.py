import cv2
import base64
import numpy as np
import socketio
import uvicorn
import asyncio
import os
import sys
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

# Add the src directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.detector import HandSignDetector
from core.models import HandPoint
from core.database import init_db, create_user, authenticate_user, get_user_status, update_subscription, cancel_subscription, simulate_expiry

app = FastAPI()

# Enable CORS (Universal Access with regex matching and credential support)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.middleware("http")
async def cors_handler_middleware(request, call_next):
    origin = request.headers.get("origin", "*")
    if request.method == "OPTIONS":
        from fastapi.responses import Response
        response = Response(status_code=200)
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
    
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


@app.get("/")
async def root():
    return {"message": "SignVision AI API is Online"}

# Initialize Detector
detector = HandSignDetector()

# Socket.IO Server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def landmarks_data(sid, data):
    """Handle incoming landmarks from the browser."""
    try:
        landmarks = data.get("landmarks", [])
        handedness = data.get("handedness", "Unknown")
        
        if not landmarks:
            # Clear result if no hand detected
            detector.process_no_hand()
            await sio.emit('recognition_result', {
                "letter": "?",
                "sentence": detector.current_sentence,
                "confidence": 0,
                "fps": int(detector.fps),
                "landmarks": []
            }, to=sid)
            return

        # Convert simple list of dicts to HandPoint objects
        from core.models import HandPoint
        hp_landmarks = [HandPoint(lm['x'], lm['y'], lm['z']) for lm in landmarks]

        # Process landmarks
        result = detector.process_landmarks(hp_landmarks, handedness)
        
        if result and result.letter != "?":
            print(f"Recognized: {result.letter} ({result.confidence:.2f})")

        # Build response data
        response = {
            "letter": result.letter if result else "?",
            "sentence": detector.current_sentence,
            "confidence": result.confidence if result else 0,
            "fps": int(detector.fps),
            "landmarks": landmarks
        }
        
        # Send response back to client
        await sio.emit('recognition_result', response, to=sid)

    except Exception as e:
        print(f"Error processing landmarks: {e}")
        import traceback
        traceback.print_exc()

@app.post("/train/")
@app.post("/train")
async def train_sign(data: dict):
    """Learn a new sign pattern."""
    label = data.get("label")
    landmarks = data.get("landmarks")
    handedness = data.get("handedness", "Right")
    
    if not label or not landmarks:
        return {"status": "error", "message": "Missing label or landmarks"}
        
    success = detector.learn_sign(label, landmarks, handedness)
    return {"status": "success" if success else "error"}

@app.get("/status")
async def get_status():
    return {"status": "ok", "detector_ready": detector.hand_landmarker is not None}

@app.get("/signs")
async def get_signs():
    """Get all signs (system + custom)."""
    return {"signs": detector.get_all_signs()}

@app.delete("/signs/{label}")
async def delete_sign(label: str):
    """Delete a custom sign."""
    success = detector.remove_sign(label)
    return {"status": "success" if success else "error"}

@app.post("/signs/rename")
async def rename_sign(data: dict):
    """Rename a custom sign."""
    old_label = data.get("old_label")
    new_label = data.get("new_label")
    if not old_label or not new_label:
        return {"status": "error", "message": "Missing old_label or new_label"}
    success = detector.rename_sign(old_label, new_label)
    return {"status": "success" if success else "error"}

@app.post("/clear")
async def clear_sentence():
    detector.current_sentence = ""
    # Broadcast update to all clients
    await sio.emit('recognition_result', {
        "letter": "?",
        "sentence": "",
        "confidence": 0,
        "fps": int(detector.fps),
        "landmarks": []
    })
    return {"status": "cleared"}

@app.post("/backspace")
async def backspace_sentence():
    sentence = detector.backspace()
    # Broadcast update to all clients
    await sio.emit('recognition_result', {
        "letter": "?",
        "sentence": sentence,
        "confidence": 0,
        "fps": int(detector.fps),
        "landmarks": []
    })
    return {"status": "backspaced", "sentence": sentence}

@app.post("/space")
async def add_space():
    if detector.current_sentence and detector.current_sentence[-1] != " ":
        detector.current_sentence += " "
    # Broadcast update to all clients
    await sio.emit('recognition_result', {
        "letter": "?",
        "sentence": detector.current_sentence,
        "confidence": 0,
        "fps": int(detector.fps),
        "landmarks": []
    })
    return {"status": "space_added", "sentence": detector.current_sentence}

@app.on_event("startup")
def startup_event():
    init_db()

@app.post("/api/auth/register/")
@app.post("/api/auth/register")
async def register(data: dict):
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    
    if not username or not email or not password:
        return {"status": "error", "message": "Missing credentials"}
        
    success = create_user(username, email, password)
    if success:
        status = get_user_status(username)
        return {"status": "success", "username": username, "token": username, "isAdmin": False, "userStatus": status}
    else:
        return {"status": "error", "message": "Username already exists"}

@app.post("/api/auth/login/")
@app.post("/api/auth/login")
async def login(data: dict):
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return {"status": "error", "message": "Missing credentials"}
        
    # Check Admin
    if username == "DEX" and password == "0...DeX...9":
        return {"status": "success", "username": "DEX", "token": "admin_token", "isAdmin": True}
        
    success = authenticate_user(username, password)
    if success:
        status = get_user_status(username)
        return {"status": "success", "username": username, "token": username, "isAdmin": False, "userStatus": status}
    else:
        return {"status": "error", "message": "Invalid username or password"}

@app.post("/api/user/status/")
@app.post("/api/user/status")
async def user_status(data: dict):
    username = data.get("token")
    if not username:
        return {"status": "error", "message": "Missing token"}
        
    status = get_user_status(username)
    if status:
        return {"status": "success", "userStatus": status}
    return {"status": "error", "message": "User not found"}

@app.post("/api/user/checkout/")
@app.post("/api/user/checkout")
async def checkout(data: dict):
    username = data.get("token")
    plan = data.get("plan")
    
    if not username or not plan:
        return {"status": "error", "message": "Missing required fields"}
        
    durations = {"monthly": 30, "6month": 180, "yearly": 365}
    if plan not in durations:
        return {"status": "error", "message": "Invalid plan type"}
        
    success = update_subscription(username, plan, durations[plan])
    if success:
        status = get_user_status(username)
        return {"status": "success", "message": "Subscription activated successfully!", "userStatus": status}
    return {"status": "error", "message": "Failed to process checkout"}

@app.post("/api/user/cancel/")
@app.post("/api/user/cancel")
async def cancel_sub(data: dict):
    username = data.get("token")
    if not username:
        return {"status": "error", "message": "Missing token"}
        
    success = cancel_subscription(username)
    if success:
        status = get_user_status(username)
        return {"status": "success", "message": "Subscription cancelled.", "userStatus": status}
    return {"status": "error", "message": "Failed to cancel subscription"}

@app.post("/api/user/simulate-expiry/")
@app.post("/api/user/simulate-expiry")
async def expire_sub(data: dict):
    username = data.get("token")
    if not username:
        return {"status": "error", "message": "Missing token"}
        
    success = simulate_expiry(username)
    if success:
        status = get_user_status(username)
        return {"status": "success", "message": "Expiry simulated.", "userStatus": status}
    return {"status": "error", "message": "Failed to simulate expiry"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(socket_app, host="0.0.0.0", port=port)
