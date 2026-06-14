import mediapipe as mp
import cv2
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# ==========================================
# MODULE 1: THE SIGN DETECTOR
# ==========================================
class SignDetector:
    def __init__(self, model_path="gesture_recognizer.task"):
        # Initialize the MediaPipe Gesture Recognizer
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.GestureRecognizerOptions(
            base_options=base_options, 
            num_hands=1, # Increase this if detecting two-handed sign language
            min_hand_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.recognizer = vision.GestureRecognizer.create_from_options(options)

    def detect_sign(self, img):
        """Processes the image and returns the detected gesture and landmarks."""
        h, w, _ = img.shape
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)
        
        # Get gesture recognition results
        results = self.recognizer.recognize(mp_image)

        gesture_name = "None"
        landmarks = None

        # Check if any hand gestures are detected
        if results.gestures and results.gestures[0]:
            gesture = results.gestures[0][0]
            # Filter out low-confidence predictions
            if gesture.score > 0.5:
                gesture_name = gesture.category_name
                
        # Grab the hand landmarks for visualization
        if results.hand_landmarks:
            landmarks = results.hand_landmarks[0]

        return gesture_name, landmarks

# ==========================================
# MAIN CONTROLLER
# ==========================================
def main():
    cap = cv2.VideoCapture(0)
    cap.set(3, 1280)
    cap.set(4, 720)

    # Instantiate our detector
    detector = SignDetector()

    while True:
        success, img = cap.read()
        if not success:
            break

        # Flip the image horizontally for a mirror effect
        img = cv2.flip(img, 1)
        h, w, _ = img.shape

        # 1. Detect the sign
        gesture_name, landmarks = detector.detect_sign(img)

        # 2. Visualize the results
        if landmarks:
            # Draw the landmarks on the hand
            for mark in landmarks:
                x = int(mark.x * w)
                y = int(mark.y * h)
                cv2.circle(img, (x, y), 5, (255, 0, 0), -1)
            
            # Display the detected sign on the screen
            # Ignore "None" to keep the screen clean when transitioning hands
            if gesture_name != "None":
                cv2.putText(img, f"Sign: {gesture_name}", (50, 100), 
                            cv2.FONT_HERSHEY_SIMPLEX, 3, (0, 255, 0), 5)

        cv2.imshow("Sign Language Detector", img) 

        # Controls
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()