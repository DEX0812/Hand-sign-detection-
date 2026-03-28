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

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(socket_app, host="0.0.0.0", port=port)
