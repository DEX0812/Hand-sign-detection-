import cv2
import os
import urllib.request
import time
from collections import deque, Counter
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from typing import List, Dict, Tuple, Optional

from .config import Config
from .models import HandPoint, RecognitionResult

# ============================================================================
# FEATURE EXTRACTOR
# ============================================================================

class FeatureExtractor:
    """Extracts features from hand landmarks."""
    
    # Landmark indices
    THUMB_TIP = 4
    THUMB_IP = 3
    THUMB_MCP = 2
    INDEX_TIP = 8
    INDEX_PIP = 6
    INDEX_MCP = 5
    MIDDLE_TIP = 12
    MIDDLE_PIP = 10
    MIDDLE_MCP = 9
    RING_TIP = 16
    RING_PIP = 14
    RING_MCP = 13
    PINKY_TIP = 20
    PINKY_PIP = 18
    PINKY_MCP = 17
    WRIST = 0
    
    def get_finger_states(self, landmarks: List[HandPoint], handedness: str) -> List[int]:
        """Determine which fingers are extended."""
        states = [0, 0, 0, 0, 0]
        is_right = (handedness == "Right")
        
        # Thumb
        thumb_tip = landmarks[self.THUMB_TIP]
        thumb_ip = landmarks[self.THUMB_IP]
        
        if is_right:
            states[0] = 1 if thumb_tip.x < thumb_ip.x else 0
        else:
            states[0] = 1 if thumb_tip.x > thumb_ip.x else 0
        
        # Other fingers
        finger_tips = [self.INDEX_TIP, self.MIDDLE_TIP, self.RING_TIP, self.PINKY_TIP]
        finger_pips = [self.INDEX_PIP, self.MIDDLE_PIP, self.RING_PIP, self.PINKY_PIP]
        
        for i, (tip_idx, pip_idx) in enumerate(zip(finger_tips, finger_pips)):
            states[i + 1] = 1 if landmarks[tip_idx].y < landmarks[pip_idx].y else 0
        
        return states
    
    def get_distances(self, landmarks: List[HandPoint]) -> Dict[str, float]:
        """Calculate key distances."""
        return {
            'thumb_index': landmarks[self.THUMB_TIP].distance_to(landmarks[self.INDEX_TIP]),
            'thumb_middle': landmarks[self.THUMB_TIP].distance_to(landmarks[self.MIDDLE_TIP]),
            'thumb_ring': landmarks[self.THUMB_TIP].distance_to(landmarks[self.RING_TIP]),
            'thumb_pinky': landmarks[self.THUMB_TIP].distance_to(landmarks[self.PINKY_TIP]),
            'index_middle': landmarks[self.INDEX_TIP].distance_to(landmarks[self.MIDDLE_TIP]),
            'middle_ring': landmarks[self.MIDDLE_TIP].distance_to(landmarks[self.RING_TIP]),
            'ring_pinky': landmarks[self.RING_TIP].distance_to(landmarks[self.PINKY_TIP]),
        }

# ============================================================================
# RULE-BASED RECOGNIZER
# ============================================================================

class RuleBasedRecognizer:
    """Rule-based ASL letter recognition."""
    
    def __init__(self):
        self.feature_extractor = FeatureExtractor()
    
    def recognize(self, landmarks: List[HandPoint], handedness: str, config: dict = None) -> RecognitionResult:
        """Recognize letter using rules with optional config for renames/disabling."""
        config = config or {}
        result = self._recognize_raw(landmarks, handedness)
        
        # Post-process based on system config
        if result.letter != "?":
            label_config = config.get(result.letter, {})
            if label_config.get("disabled"):
                return RecognitionResult("?", 0.0, finger_states=result.finger_states)
            result.letter = label_config.get("rename", result.letter)
            
        return result

    def _recognize_raw(self, landmarks: List[HandPoint], handedness: str) -> RecognitionResult:
        """Original recognition rules."""
        finger_states = self.feature_extractor.get_finger_states(landmarks, handedness)
        distances = self.feature_extractor.get_distances(landmarks)
        
        finger_count = sum(finger_states)
        
        # ===== 5 FINGERS =====
        if finger_count == 5:
            if distances['thumb_index'] > Config.THUMB_INDEX_FAR:
                return RecognitionResult("C", 0.85, finger_states=finger_states)
            elif distances['thumb_index'] < Config.THUMB_INDEX_CLOSE:
                return RecognitionResult("O", 0.90, finger_states=finger_states)
        
        # ===== 0 FINGERS (FIST) =====
        if finger_count == 0:
            thumb_tip = landmarks[self.feature_extractor.THUMB_TIP]
            thumb_mcp = landmarks[self.feature_extractor.THUMB_MCP]
            index_mcp = landmarks[self.feature_extractor.INDEX_MCP]
            
            if thumb_tip.x > thumb_mcp.x:
                return RecognitionResult("S", 0.80, finger_states=finger_states)
            elif thumb_tip.x < index_mcp.x:
                if thumb_tip.y < landmarks[self.feature_extractor.THUMB_MCP].y:
                    return RecognitionResult("M", 0.75, finger_states=finger_states)
                else:
                    return RecognitionResult("N", 0.75, finger_states=finger_states)
            else:
                return RecognitionResult("A", 0.85, finger_states=finger_states)
        
        # ===== 1 FINGER =====
        if finger_count == 1:
            if finger_states[0] == 1:  # Thumb
                return RecognitionResult("L", 0.80, finger_states=finger_states)
            elif finger_states[1] == 1:  # Index
                return RecognitionResult("D", 0.85, finger_states=finger_states)
            elif finger_states[4] == 1:  # Pinky
                return RecognitionResult("I", 0.90, finger_states=finger_states)
        
        # ===== 2 FINGERS =====
        if finger_count == 2:
            if finger_states[1] == 1 and finger_states[2] == 1:  # Index and Middle
                if distances['index_middle'] < Config.FINGERS_TOGETHER:
                    return RecognitionResult("U", 0.85, finger_states=finger_states)
                elif distances['index_middle'] > Config.FINGERS_APART:
                    return RecognitionResult("V", 0.90, finger_states=finger_states)
            elif finger_states[0] == 1 and finger_states[1] == 1:  # Thumb and Index
                if distances['thumb_index'] > Config.THUMB_INDEX_FAR:
                    return RecognitionResult("L", 0.85, finger_states=finger_states)
                else:
                    return RecognitionResult("G", 0.80, finger_states=finger_states)
        
        # ===== 3 FINGERS =====
        if finger_count == 3:
            if finger_states[1] == 1 and finger_states[2] == 1 and finger_states[3] == 1:
                return RecognitionResult("W", 0.85, finger_states=finger_states)
            elif finger_states[0] == 1 and finger_states[1] == 1 and finger_states[2] == 1:
                return RecognitionResult("K", 0.80, finger_states=finger_states)
        
        # ===== 4 FINGERS =====
        if finger_count == 4:
            if finger_states[0] == 0:  # Thumb tucked
                return RecognitionResult("B", 0.90, finger_states=finger_states)
            elif finger_states[1] == 0:  # Index tucked
                if distances['thumb_index'] < Config.THUMB_INDEX_CLOSE:
                    return RecognitionResult("F", 0.85, finger_states=finger_states)
        
        # ===== SPECIAL =====
        if finger_states == [1, 0, 0, 0, 1]:
            return RecognitionResult("Y", 0.90, finger_states=finger_states)
        
        if finger_states == [0, 1, 1, 0, 0] and distances['index_middle'] < Config.CROSSED_THRESHOLD:
            return RecognitionResult("R", 0.85, finger_states=finger_states)
        
        return RecognitionResult("?", 0.0, finger_states=finger_states)

# ============================================================================
# TEMPORAL SMOOTHER
# ============================================================================

class TemporalSmoother:
    """Smooths recognition results over time."""
    
    def __init__(self, history_size: int = 10):
        self.history = deque(maxlen=history_size)
        self.confidence_history = deque(maxlen=history_size)
    
    def smooth(self, result: RecognitionResult) -> RecognitionResult:
        """Apply temporal smoothing."""
        self.history.append(result.letter)
        self.confidence_history.append(result.confidence)
        
        if len(self.history) < 3:
            return result
        
        # Get most common letter
        counter = Counter(self.history)
        most_common = counter.most_common(1)[0]
        smoothed_letter = most_common[0]
        vote_confidence = most_common[1] / len(self.history)
        
        # Average confidence
        avg_confidence = sum(self.confidence_history) / len(self.confidence_history)
        
        # Combined confidence
        confidence = 0.7 * vote_confidence + 0.3 * avg_confidence
        
        return RecognitionResult(
            smoothed_letter,
            confidence,
            finger_states=result.finger_states
        )

# ============================================================================
# MAIN DETECTOR CLASS
# ============================================================================

class HandSignDetector:
    """Main detector class."""
    
    def __init__(self, model_path=Config.MODEL_FILENAME):
        print("--- Initializing Enhanced Hand Detector (90%+ Accuracy Target)...")
        
        # Download model if needed
        if not os.path.exists(model_path):
            self._download_model(model_path)
        
        # Initialize MediaPipe
        self.hand_landmarker = self._init_mediapipe(model_path)
        if not self.hand_landmarker:
            return
        
        # Initialize components
        self.recognizer = RuleBasedRecognizer()
        self.smoother = TemporalSmoother(Config.HISTORY_SIZE)
        self.feature_extractor = FeatureExtractor()
        
        # Sentence building
        self.current_sentence = ""
        self.last_letter = ""
        self.letter_stable_counter = 0
        self.stable_threshold = Config.STABLE_FRAMES
        self.space_counter = 0
        
        # Performance tracking
        self.fps = 0
        self.last_time = time.time()
        self.frame_times = deque(maxlen=30)
        
        # Connection points
        self.hand_connections = self._get_hand_connections()
        
        self.last_result = None
        self.last_landmarks = []
        
        # Custom Signs
        self.custom_signs_path = os.path.join(os.path.dirname(__file__), "custom_signs.json")
        self.custom_signs = self._load_custom_signs()
        
        # System Signs (Rule-based)
        self.system_signs_config = {}
        self.DEFAULT_LABELS = ["C", "O", "S", "M", "N", "A", "L", "D", "I", "U", "V", "G", "K", "W", "B", "F", "Y", "R"]
        self._load_system_signs_config()
        
        print(f"OK: Enhanced Detector Ready! (Loaded {len(self.custom_signs)} custom + {len(self.DEFAULT_LABELS)} system signs)")
    
    def _load_custom_signs(self):
        """Load custom signs from disk."""
        import json
        if os.path.exists(self.custom_signs_path):
            try:
                with open(self.custom_signs_path, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}

    def _save_custom_signs(self):
        """Save custom signs to disk."""
        import json
        try:
            with open(self.custom_signs_path, 'w') as f:
                json.dump(self.custom_signs, f, indent=4)
            return True
        except:
            return False
    
    def _download_model(self, model_path):
        """Download the hand landmarker model."""
        print(f"Downloading model...")
        try:
            urllib.request.urlretrieve(Config.MODEL_URL, model_path)
            print("OK: Model downloaded")
        except Exception as e:
            print(f"FAILED: Download failed: {e}")
    
    def _init_mediapipe(self, model_path):
        """Initialize MediaPipe hand landmarker."""
        try:
            base_options = python.BaseOptions(model_asset_path=model_path)
            options = vision.HandLandmarkerOptions(
                base_options=base_options,
                num_hands=Config.NUM_HANDS,
                min_hand_detection_confidence=0.5,
                min_hand_presence_confidence=0.5,
                min_tracking_confidence=0.5
            )
            return vision.HandLandmarker.create_from_options(options)
        except Exception as e:
            print(f"ERROR: MediaPipe error: {e}")
            return None
    
    def _get_hand_connections(self):
        """Get hand connections for drawing."""
        return list(set([
            (0, 1), (1, 2), (2, 3), (3, 4),
            (0, 5), (5, 6), (6, 7), (7, 8),
            (0, 9), (9, 10), (10, 11), (11, 12),
            (0, 13), (13, 14), (14, 15), (15, 16),
            (0, 17), (17, 18), (18, 19), (19, 20),
            (0, 5), (5, 9), (9, 13), (13, 17)
        ]))
    
    def _update_fps(self):
        """Update FPS calculation."""
        current_time = time.time()
        self.frame_times.append(current_time - self.last_time)
        self.last_time = current_time
        if self.frame_times:
            self.fps = 1.0 / (sum(self.frame_times) / len(self.frame_times))
    
    def put_text_with_bg(self, frame, text, pos, scale, color, alpha=0.3):
        """Draw text with semi-transparent background."""
        x, y = pos
        font = cv2.FONT_HERSHEY_SIMPLEX
        thickness = 2
        
        # Get text size
        (w, h), _ = cv2.getTextSize(text, font, scale, thickness)
        
        # Draw background
        padding = 5
        overlay = frame.copy()
        cv2.rectangle(overlay, 
                     (x - padding, y - h - padding),
                     (x + w + padding, y + padding),
                     Config.COLORS["BLACK"], -1)
        cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
        
        # Draw text
        cv2.putText(frame, text, (x, y), font, scale, color, thickness)
    
    def build_sentence(self, current_letter):
        """Build sentence with stability and cooldown support."""
        # Handle negative cooldown
        if self.letter_stable_counter < 0:
            self.letter_stable_counter += 1
            return

        if current_letter == "_":
            self.space_counter += 1
            if self.space_counter > self.stable_threshold / 2:
                if self.current_sentence and self.current_sentence[-1] != " ":
                    self.current_sentence += " "
                self.space_counter = 0
            return
        
        if current_letter == "⌫":
            if self.current_sentence:
                self.current_sentence = self.current_sentence[:-1]
            return
        
        if current_letter != "?":
            if current_letter != self.last_letter:
                self.letter_stable_counter = 1
                self.last_letter = current_letter
            else:
                self.letter_stable_counter += 1
                if self.letter_stable_counter == self.stable_threshold:
                    if not self.current_sentence or self.current_sentence[-1] != current_letter:
                        self.current_sentence += current_letter
                        print(f"Added: {current_letter}")
                    self.letter_stable_counter = 0
    
    def backspace(self):
        """Safely remove the last character and prevent immediate re-detection."""
        if self.current_sentence:
            self.current_sentence = self.current_sentence[:-1]
        
        # Reset counters and add a short "blind" period (cooldown)
        self.letter_stable_counter = -15  # Ignore next 15 frames (~500ms at 30fps)
        self.last_letter = ""
        self.space_counter = 0
        return self.current_sentence
    
    def process_frame(self, frame):
        """Process a single frame."""
        self._update_fps()
        
        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        # Detect hands
        detection_result = self.hand_landmarker.detect(mp_image)
        
        if detection_result.hand_landmarks:
            for idx, hand_landmarks in enumerate(detection_result.hand_landmarks):
                # Get handedness
                handedness = "Unknown"
                if detection_result.handedness:
                    handedness = detection_result.handedness[idx][0].category_name
                
                # Convert to HandPoint objects
                landmarks = [HandPoint(lm.x, lm.y, lm.z) for lm in hand_landmarks]
                
                # Recognize letter
                result = self.recognizer.recognize(landmarks, handedness, config=self.system_signs_config)
                smoothed = self.smoother.smooth(result)
                
                # Build sentence if confident
                if smoothed.confidence >= Config.MIN_CONFIDENCE:
                    self.build_sentence(smoothed.letter)
                
                # Draw hand conditionally
                if Config.DRAW_SERVER_SIDE:
                    self._draw_hand(frame, landmarks, handedness, smoothed)
                
                # Store the last result for API access
                self.last_result = smoothed
                self.last_landmarks = landmarks
        else:
            self.last_result = None
            self.last_landmarks = []
        
        # Draw UI conditionally
        if Config.DRAW_SERVER_SIDE:
            self._draw_ui(frame)
        
        return frame, self.last_result

    def process_landmarks(self, landmarks: List[HandPoint], handedness: str):
        """Process landmarks directly from the client."""
        self._update_fps()
        
        # Recognize letter using rules first
        result = self.recognizer.recognize(landmarks, handedness, config=self.system_signs_config)
        
        # Check custom signs if rule-based recognition is weak
        if result.letter == "?" or result.confidence < 0.7:
            custom_result = self._recognize_custom(landmarks, handedness)
            if custom_result and custom_result.confidence > result.confidence:
                result = custom_result

        smoothed = self.smoother.smooth(result)
        
        # Build sentence if confident
        if smoothed.confidence >= Config.MIN_CONFIDENCE:
            self.build_sentence(smoothed.letter)
        
        # Store for internal tracking
        self.last_result = smoothed
        self.last_landmarks = landmarks
        
        return smoothed

    def learn_sign(self, label, landmarks_data, handedness):
        """Save a new sign pattern."""
        try:
            # landmarks_data is list of dicts from client
            landmarks = [HandPoint(lm['x'], lm['y'], lm['z']) for lm in landmarks_data]
            
            # Extract features (finger states and key distances)
            finger_states = self.feature_extractor.get_finger_states(landmarks, handedness)
            distances = self.feature_extractor.get_distances(landmarks)
            
            # Normalize distances (relative to palm size)
            palm_size = landmarks[0].distance_to(landmarks[9]) # Wrist to middle MCP
            if palm_size < 0.01: palm_size = 0.1
            
            normalized_distances = {k: v / palm_size for k, v in distances.items()}
            
            # Store sign pattern
            self.custom_signs[label] = {
                "finger_states": finger_states,
                "distances": normalized_distances,
                "handedness": handedness
            }
            
            return self._save_custom_signs()
        except Exception as e:
            print(f"Error learning sign: {e}")
            return False

    def get_all_signs(self):
        """Get all signs (system + custom) with metadata."""
        all_signs = []
        
        # Default/System signs
        for label in self.DEFAULT_LABELS:
            config = self.system_signs_config.get(label, {})
            current_label = config.get("rename", label)
            disabled = config.get("disabled", False)
            if not disabled:
                all_signs.append({"id": label, "current": current_label, "type": "system"})
        
        # Custom signs
        for label in self.custom_signs.keys():
            all_signs.append({"id": label, "current": label, "type": "custom"})
            
        return all_signs

    def remove_sign(self, identifier):
        """Remove a custom sign or disable a system sign."""
        # Check custom signs first
        if identifier in self.custom_signs:
            del self.custom_signs[identifier]
            return self._save_custom_signs()
            
        # Check system signs
        if identifier in self.DEFAULT_LABELS:
            if identifier not in self.system_signs_config:
                self.system_signs_config[identifier] = {}
            self.system_signs_config[identifier]["disabled"] = True
            return self._save_system_signs_config()
            
        return False

    def rename_sign(self, identifier, new_label):
        """Rename a custom sign or a system sign."""
        if not new_label: return False
        
        # Custom sign renaming
        if identifier in self.custom_signs:
            # Check if new label already exists (optional safety)
            self.custom_signs[new_label] = self.custom_signs.pop(identifier)
            return self._save_custom_signs()
            
        # System sign renaming
        if identifier in self.DEFAULT_LABELS:
            if identifier not in self.system_signs_config:
                self.system_signs_config[identifier] = {}
            self.system_signs_config[identifier]["rename"] = new_label
            return self._save_system_signs_config()
            
        return False

    def _load_system_signs_config(self):
        """Load system signs configuration."""
        import json
        path = os.path.join(os.path.dirname(__file__), "system_signs_config.json")
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    self.system_signs_config = json.load(f)
            except: pass

    def _save_system_signs_config(self):
        """Save system signs configuration."""
        import json
        path = os.path.join(os.path.dirname(__file__), "system_signs_config.json")
        try:
            with open(path, "w") as f:
                json.dump(self.system_signs_config, f, indent=4)
            return True
        except: return False

    def _recognize_custom(self, landmarks, handedness) -> Optional[RecognitionResult]:
        """Compare current landmarks against custom signs."""
        if not self.custom_signs:
            return None
            
        finger_states = self.feature_extractor.get_finger_states(landmarks, handedness)
        distances = self.feature_extractor.get_distances(landmarks)
        
        palm_size = landmarks[0].distance_to(landmarks[9])
        if palm_size < 0.01: palm_size = 0.1
        normalized_distances = {k: v / palm_size for k, v in distances.items()}
        
        best_match = None
        highest_score = 0
        
        for label, pattern in self.custom_signs.items():
            # Check finger states (must match mostly)
            state_match = sum(1 for s1, s2 in zip(finger_states, pattern["finger_states"]) if s1 == s2)
            if state_match < 4: continue # Too different
            
            # Calculate distance similarity
            dist_score = 0
            for k, v in normalized_distances.items():
                ref_v = pattern["distances"].get(k, 0)
                # 1.0 is perfect match, subtract error
                diff = abs(v - ref_v)
                dist_score += max(0, 1.0 - (diff * 2)) 
            
            avg_dist_score = dist_score / len(normalized_distances)
            
            # Overall confidence
            confidence = (state_match / 5.0) * 0.4 + avg_dist_score * 0.6
            
            if confidence > highest_score:
                highest_score = confidence
                best_match = label
        
        if highest_score > 0.75:
            return RecognitionResult(best_match, highest_score, finger_states=finger_states)
        
        return None
    
    def _draw_hand(self, frame, landmarks, handedness, result):
        """Draw hand landmarks and info."""
        h, w = frame.shape[:2]
        
        # Choose color
        if handedness == "Right":
            color = Config.COLORS["BLUE"]
        else:
            color = Config.COLORS["RED"]
        
        # Draw connections
        for start_idx, end_idx in self.hand_connections:
            if start_idx < len(landmarks) and end_idx < len(landmarks):
                p1 = landmarks[start_idx].to_pixel(w, h)
                p2 = landmarks[end_idx].to_pixel(w, h)
                cv2.line(frame, p1, p2, color, 2)
        
        # Draw landmarks
        for landmark in landmarks:
            x, y = landmark.to_pixel(w, h)
            cv2.circle(frame, (x, y), 3, Config.COLORS["GREEN"], -1)
        
        # Get wrist position for text
        x, y = landmarks[0].to_pixel(w, h)
        
        # Choose text color based on confidence
        if result.confidence >= 0.8:
            text_color = Config.COLORS["GREEN"]
        elif result.confidence >= 0.5:
            text_color = Config.COLORS["YELLOW"]
        else:
            text_color = Config.COLORS["RED"]
        
        # Display info
        self.put_text_with_bg(frame, f"{handedness} Hand", (x, y-100), 0.6, color)
        
        letter_display = result.letter if result.letter != "_" else "SPACE"
        self.put_text_with_bg(frame, f"{letter_display} ({result.confidence:.2f})", 
                             (x, y-70), 0.7, text_color)
        
        # Show stability
        progress = int((self.letter_stable_counter / self.stable_threshold) * 100)
        self.put_text_with_bg(frame, f"Stability: {progress}%", (x, y-40), 0.5, Config.COLORS["WHITE"], 0.2)
        
        # Show finger states
        self.put_text_with_bg(frame, f"Fingers: {result.finger_states}", 
                             (x, y+25), 0.4, Config.COLORS["CYAN"], 0.2)
    
    def _draw_ui(self, frame):
        """Draw UI elements."""
        h, w = frame.shape[:2]
        
        # Top panel
        overlay = frame.copy()
        cv2.rectangle(overlay, (5, 5), (w-5, 90), Config.COLORS["BLACK"], -1)
        cv2.addWeighted(overlay, 0.2, frame, 0.8, 0, frame)
        
        # Sentence
        cv2.putText(frame, "Sentence:", (15, 35), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, Config.COLORS["YELLOW"], 2)
        
        # Word wrap for long sentences
        sentence = self.current_sentence if self.current_sentence else " "
        words = sentence.split()
        lines = []
        current_line = ""
        
        for word in words:
            if len(current_line + " " + word) < 25:
                current_line += " " + word if current_line else word
            else:
                lines.append(current_line)
                current_line = word
        if current_line:
            lines.append(current_line)
        
        for i, line in enumerate(lines[:2]):
            cv2.putText(frame, line, (15, 65 + i*25), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, Config.COLORS["WHITE"], 2)
        
        if len(lines) > 2:
            cv2.putText(frame, "...", (15, 115), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, Config.COLORS["WHITE"], 2)
        
        # FPS
        self.put_text_with_bg(frame, f"FPS: {int(self.fps)}", (w-120, 30), 
                             0.5, Config.COLORS["GREEN"], 0.2)
        
        # Instructions
        self.put_text_with_bg(frame, "Hold steady to add | Q:Quit C:Clear", 
                             (10, h-20), 0.4, Config.COLORS["WHITE"], 0.2)
