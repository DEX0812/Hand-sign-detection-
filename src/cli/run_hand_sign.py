import cv2
import sys
import os

# Add the src directory to sys.path for absolute imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.detector import HandSignDetector

def main():
    """Main entry point."""
    print("\n" + "="*70)
    print("     ASL RECOGNITION SYSTEM - MODULAR VERSION")
    print("="*70)
    
    # Initialize detector
    detector = HandSignDetector()
    if not detector.hand_landmarker:
        print("\nFAILED: Failed to initialize detector")
        input("Press Enter to exit...")
        return
    
    # Open camera
    print("\nLooking for camera...")
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("FAILED: Could not open camera")
        return
    
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    print("\nOK: Recognition started! Press 'q' to quit, 'c' to clear")
    print("="*70)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("FAILED: Frame capture failed")
            break
        
        frame = cv2.flip(frame, 1)
        
        try:
            processed_frame, _ = detector.process_frame(frame)
        except Exception as e:
            print(f"ERROR: {e}")
            continue
        
        cv2.imshow('ASL Recognition (Modular)', processed_frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('c'):
            detector.current_sentence = ""
            print("Sentence cleared")
    
    # Show final sentence
    print("\n" + "="*70)
    print("FINAL SENTENCE:")
    print(f"Sentence: {detector.current_sentence}")
    print("="*70)
    
    cap.release()
    cv2.destroyAllWindows()
    print("\nOK: Program ended")

if __name__ == "__main__":
    main()
