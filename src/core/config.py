import os

class Config:
    """Centralized configuration."""
    MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
    # Adjusted path to look for models folder relative to this file
    MODEL_FILENAME = os.path.join(os.path.dirname(__file__), "..", "..", "models", "hand_landmarker.task")
    
    # Recognition thresholds
    STABLE_FRAMES = 8
    HISTORY_SIZE = 10
    MIN_CONFIDENCE = 0.65
    
    # Distance thresholds
    THUMB_INDEX_CLOSE = 0.05
    THUMB_INDEX_FAR = 0.1
    FINGERS_TOGETHER = 0.03
    FINGERS_APART = 0.05
    CROSSED_THRESHOLD = 0.02
    
    # Performance settings
    NUM_HANDS = 1
    RESIZE_WIDTH = 320
    RESIZE_HEIGHT = 240
    DRAW_SERVER_SIDE = False
    
    # Colors (BGR format)
    COLORS = {
        "GREEN": (0, 255, 0),
        "BLUE": (255, 0, 0),
        "RED": (0, 0, 255),
        "YELLOW": (0, 255, 255),
        "CYAN": (255, 255, 0),
        "WHITE": (255, 255, 255),
        "BLACK": (0, 0, 0),
        "PURPLE": (255, 0, 255)
    }
