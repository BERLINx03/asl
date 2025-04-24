import cv2
import numpy as np
import mediapipe as mp
import os
from tqdm import tqdm

# Initialize MediaPipe Hand module
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

def extract_landmarks(image_path, hands=None):
    """
    Extract hand landmarks from an image.
    
    Args:
        image_path: Path to the image file
        hands: MediaPipe Hands object (optional)
    
    Returns:
        landmarks: numpy array of shape (21, 3) containing landmarks or None if no hand detected
        processed_img: image with landmarks drawn
    """
    # Initialize Hands if not provided
    if hands is None:
        hands = mp_hands.Hands(
            static_image_mode=True,
            max_num_hands=1,
            min_detection_confidence=0.5)
    
    # Read image
    image = cv2.imread(image_path)
    if image is None:
        print(f"Could not read image: {image_path}")
        return None, None
    
    # Convert to RGB (MediaPipe requires RGB input)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Process the image
    results = hands.process(image_rgb)
    
    # Prepare output image
    processed_img = image.copy()
    
    # Check if hand landmarks are detected
    if results.multi_hand_landmarks:
        # Draw landmarks on the image
        for hand_landmarks in results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(
                processed_img,
                hand_landmarks,
                mp_hands.HAND_CONNECTIONS,
                mp_drawing_styles.get_default_hand_landmarks_style(),
                mp_drawing_styles.get_default_hand_connections_style())
        
        # Extract the first detected hand's landmarks
        landmarks = results.multi_hand_landmarks[0]
        
        # Convert landmarks to numpy array
        landmarks_array = np.zeros((21, 3))
        for i, landmark in enumerate(landmarks.landmark):
            landmarks_array[i] = [landmark.x, landmark.y, landmark.z]
        
        return landmarks_array, processed_img
    
    # No hand detected
    return None, processed_img

def normalize_landmarks(landmarks):
    """
    Normalize landmarks to make them translation and scale invariant.
    
    Args:
        landmarks: numpy array of shape (21, 3) containing landmarks
    
    Returns:
        normalized_landmarks: flattened and normalized landmarks 
    """
    if landmarks is None:
        return None
    
    # Get wrist position (landmark 0)
    wrist = landmarks[0]
    
    # Center landmarks on wrist
    centered = landmarks - wrist
    
    # Compute distance between wrist and middle finger MCP (landmark 9) for scaling
    scale = np.linalg.norm(centered[9])
    
    # Normalize by this scale
    if scale > 0:
        normalized = centered / scale
    else:
        normalized = centered
    
    # Flatten the array from (21, 3) to (63,)
    return normalized.flatten()

def create_landmark_dataset(data_dir, output_path, label_mapping=None):
    """
    Create a dataset of hand landmarks from a directory of images.
    
    Args:
        data_dir: Directory containing subdirectories of images, where
                 each subdirectory name is the label
        output_path: Path to save the dataset
        label_mapping: Dictionary mapping directory names to label indices
    
    Returns:
        X: numpy array of landmarks
        y: numpy array of labels
        failed_images: list of images where landmark extraction failed
    """
    # Get subdirectories (classes)
    subdirs = [d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))]
    
    # Create label mapping if not provided
    if label_mapping is None:
        label_mapping = {label: i for i, label in enumerate(sorted(subdirs))}
    
    print(f"Found {len(subdirs)} classes: {', '.join(subdirs)}")
    
    # Initialize MediaPipe Hands
    hands = mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=1,
        min_detection_confidence=0.5)
    
    # Lists to store landmarks and labels
    landmarks_list = []
    labels_list = []
    failed_images = []
    
    # Process each subdirectory
    for subdir in subdirs:
        subdir_path = os.path.join(data_dir, subdir)
        if not os.path.isdir(subdir_path):
            continue
        
        # Get image files in subdirectory
        image_files = [f for f in os.listdir(subdir_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        
        print(f"Processing {len(image_files)} images in class {subdir}...")
        
        # Process each image
        for image_file in tqdm(image_files):
            image_path = os.path.join(subdir_path, image_file)
            
            # Extract landmarks
            landmarks, _ = extract_landmarks(image_path, hands)
            
            if landmarks is not None:
                # Normalize landmarks
                normalized_landmarks = normalize_landmarks(landmarks)
                
                # Add to lists
                landmarks_list.append(normalized_landmarks)
                labels_list.append(label_mapping[subdir])
            else:
                failed_images.append(image_path)
    
    # Convert lists to numpy arrays
    X = np.array(landmarks_list)
    y = np.array(labels_list)
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Save the dataset with allow_pickle=True
    np.savez(output_path, X=X, y=y, label_mapping=label_mapping)
    
    print(f"Dataset created with {len(X)} samples.")
    print(f"Failed to extract landmarks from {len(failed_images)} images.")
    
    return X, y, failed_images

def visualize_landmarks(landmarks, image=None, size=(400, 400)):
    """
    Visualize landmarks on a blank image or an existing image.
    
    Args:
        landmarks: numpy array of shape (21, 3) containing landmarks
        image: Optional background image
        size: Size of the output image if no image is provided
    
    Returns:
        image with landmarks visualized
    """
    if landmarks is None:
        return None
    
    # Reshape if flattened
    if landmarks.shape == (63,):
        landmarks = landmarks.reshape(21, 3)
    
    # Create blank image if none provided
    if image is None:
        image = np.ones((size[1], size[0], 3), dtype=np.uint8) * 255
    
    # Create landmark proto for drawing
    landmark_proto = mp_hands.HandLandmark()
    landmarks_proto = mp.framework.formats.landmark_pb2.NormalizedLandmarkList()
    
    # Fill in proto
    for i, landmark in enumerate(landmarks):
        landmark_proto = landmarks_proto.landmark.add()
        landmark_proto.x = landmark[0]
        landmark_proto.y = landmark[1]
        landmark_proto.z = landmark[2]
    
    # Draw landmarks
    mp_drawing.draw_landmarks(
        image,
        landmarks_proto,
        mp_hands.HAND_CONNECTIONS,
        mp_drawing_styles.get_default_hand_landmarks_style(),
        mp_drawing_styles.get_default_hand_connections_style())
    
    return image 