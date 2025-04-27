import os
import numpy as np
import argparse
from asl_recognition.models.classifier import ASLClassifier

def train_specialized_model(start_letter='A', end_letter='F', output_dir='asl_recognition/data/specialized', tune_hyperparams=True):
    """
    Train a specialized model for a subset of ASL letters.
    
    Args:
        start_letter: First letter in range (inclusive)
        end_letter: Last letter in range (inclusive)
        output_dir: Directory to save the specialized model
        tune_hyperparams: Whether to tune hyperparameters
        
    Returns:
        Path to the saved model
    """
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Load the full dataset
    train_data_path = 'asl_recognition/data/train_landmarks.npz'
    data = np.load(train_data_path, allow_pickle=True)
    X_all = data['X']
    y_all = data['y']
    label_mapping = data['label_mapping'].item()
    
    # Create reverse mapping (index to letter)
    reverse_mapping = {v: k for k, v in label_mapping.items()}
    
    # Print available labels
    print("Available labels in dataset:")
    for label, idx in label_mapping.items():
        print(f"  {label} -> {idx}")
    
    # Filter for just the target letters
    start_idx = ord(start_letter) - ord('A')
    end_idx = ord(end_letter) - ord('A')
    
    # Get the indices in the original dataset that correspond to our target letters
    target_indices = []
    for i in range(len(y_all)):
        label_idx = y_all[i]
        # Get letter for this label
        label = reverse_mapping.get(label_idx, None)
        
        # Skip if label is None or not a single character
        if not label or len(label) != 1:
            continue
            
        # Check if it's in our letter range
        if ord(label) >= ord(start_letter) and ord(label) <= ord(end_letter):
            target_indices.append(i)
    
    # Create filtered dataset
    X_filtered = X_all[target_indices]
    y_filtered = y_all[target_indices]
    
    # Create filtered label mapping (preserve letter to index mapping)
    filtered_mapping = {}
    for k, v in label_mapping.items():
        # Only include single characters in our range
        if len(k) == 1 and ord(k) >= ord(start_letter) and ord(k) <= ord(end_letter):
            filtered_mapping[k] = v
    
    print(f"Training specialized model for letters {start_letter} to {end_letter}")
    print(f"Original dataset: {len(X_all)} samples")
    print(f"Filtered dataset: {len(X_filtered)} samples")
    print(f"Classes included: {sorted(filtered_mapping.keys())}")
    
    if len(filtered_mapping) == 0:
        raise ValueError(f"No classes found in the range {start_letter} to {end_letter}. Check your dataset labels.")
    
    # Train specialized model
    classifier = ASLClassifier()
    classifier.train(X_filtered, y_filtered, label_mapping=filtered_mapping, tune_hyperparams=tune_hyperparams)
    
    # Save the specialized model
    model_name = f"asl_model_{start_letter}_to_{end_letter}.pkl"
    model_path = os.path.join(output_dir, model_name)
    classifier.save(model_path)
    
    print(f"Specialized model trained and saved to {model_path}")
    return model_path

def main():
    parser = argparse.ArgumentParser(description='Train specialized ASL recognition model')
    parser.add_argument('--start_letter', type=str, default='A',
                        help='First letter in range (inclusive)')
    parser.add_argument('--end_letter', type=str, default='F',
                        help='Last letter in range (inclusive)')
    parser.add_argument('--output_dir', type=str, default='asl_recognition/data/specialized',
                        help='Directory to save specialized model')
    parser.add_argument('--tune_hyperparams', action='store_true',
                        help='Tune hyperparameters')
    args = parser.parse_args()
    
    train_specialized_model(
        start_letter=args.start_letter,
        end_letter=args.end_letter,
        output_dir=args.output_dir,
        tune_hyperparams=args.tune_hyperparams
    )

if __name__ == "__main__":
    main() 