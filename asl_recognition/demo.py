import cv2
import numpy as np
import mediapipe as mp
import argparse
import os
from asl_recognition.utils.landmark_extraction import extract_landmarks, normalize_landmarks
from asl_recognition.models.classifier import ASLClassifier

def main():
    parser = argparse.ArgumentParser(description='ASL Recognition Demo')
    parser.add_argument('--model_path', type=str, default='asl_recognition/data/asl_model.pkl',
                        help='Path to the trained model')
    parser.add_argument('--camera', type=int, default=0,
                        help='Camera index (usually 0 for built-in webcam)')
    args = parser.parse_args()
    
    # Check if model exists
    if not os.path.exists(args.model_path):
        print(f"Model not found at {args.model_path}. Please train the model first.")
        return
    
    # Load the model
    classifier = ASLClassifier()
    classifier.load(args.model_path)
    
    # Initialize MediaPipe Hands
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    mp_drawing_styles = mp.solutions.drawing_styles
    
    hands = mp_hands.Hands(
        static_image_mode=False,  # Video mode
        max_num_hands=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5)
    
    # Initialize webcam
    cap = cv2.VideoCapture(args.camera)
    
    # Check if camera opened successfully
    if not cap.isOpened():
        print("Error: Could not open camera.")
        return
    
    # Set window name
    window_name = 'ASL Recognition Demo'
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    
    print("Starting ASL recognition demo...")
    print("Press 'q' to quit")
    
    # For FPS calculation
    prev_frame_time = 0
    
    while cap.isOpened():
        success, image = cap.read()
        if not success:
            print("Failed to read frame from camera.")
            break
        
        # Flip the image horizontally for a more intuitive selfie-view display
        image = cv2.flip(image, 1)
        
        # Convert the image to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process the image
        results = hands.process(image_rgb)
        
        # Draw landmarks and make prediction
        if results.multi_hand_landmarks:
            # Draw hand landmarks
            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    image,
                    hand_landmarks,
                    mp_hands.HAND_CONNECTIONS,
                    mp_drawing_styles.get_default_hand_landmarks_style(),
                    mp_drawing_styles.get_default_hand_connections_style())
            
            # Extract landmarks
            landmarks_array = np.zeros((21, 3))
            for i, landmark in enumerate(results.multi_hand_landmarks[0].landmark):
                landmarks_array[i] = [landmark.x, landmark.y, landmark.z]
            
            # Normalize landmarks
            normalized_landmarks = normalize_landmarks(landmarks_array)
            
            # Make prediction
            label, confidence = classifier.predict(normalized_landmarks)
            
            # Display prediction
            text = f"{label}: {confidence:.2f}"
            cv2.putText(image, text, (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 
                        1, (0, 255, 0), 2, cv2.LINE_AA)
        
        # Calculate and display FPS
        curr_frame_time = cv2.getTickCount()
        fps = cv2.getTickFrequency() / (curr_frame_time - prev_frame_time)
        prev_frame_time = curr_frame_time
        
        cv2.putText(image, f"FPS: {fps:.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 
                    1, (0, 255, 0), 2, cv2.LINE_AA)
        
        # Display the result
        cv2.imshow(window_name, image)
        
        # Check for quit command
        if cv2.waitKey(5) & 0xFF == ord('q'):
            break
    
    # Release resources
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main() 