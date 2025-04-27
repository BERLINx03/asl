import os
import argparse
from asl_recognition.train_specialized_model import train_specialized_model
from asl_recognition.models.classifier import ASLClassifier

def main():
    parser = argparse.ArgumentParser(description='Run specialized ASL recognition model')
    parser.add_argument('--start_letter', type=str, default='A',
                        help='First letter in range (inclusive)')
    parser.add_argument('--end_letter', type=str, default='F',
                        help='Last letter in range (inclusive)')
    parser.add_argument('--model_dir', type=str, default='asl_recognition/data/specialized',
                        help='Directory to save/load specialized model')
    parser.add_argument('--train', action='store_true',
                        help='Train the model if it does not exist')
    args = parser.parse_args()
    
    # Check if model exists or needs to be trained
    model_name = f"asl_model_{args.start_letter}_to_{args.end_letter}.pkl"
    model_path = os.path.join(args.model_dir, model_name)
    
    if not os.path.exists(model_path):
        if args.train:
            print(f"Model {model_name} not found. Training now...")
            train_specialized_model(
                start_letter=args.start_letter,
                end_letter=args.end_letter,
                output_dir=args.model_dir
            )
        else:
            print(f"Model {model_name} not found. Please train it first with --train flag.")
            return
    
    # Load the model
    classifier = ASLClassifier()
    classifier.load(model_path)
    print(f"Loaded specialized model for letters {args.start_letter} to {args.end_letter}")
    
    # Now you can use the classifier for prediction
    # When using with API or demo, pass this classifier instance instead of the general one
    print("Model ready for use with the API.")
    
    # Example of how to integrate with your API:
    #
    # from asl_recognition.api import app
    # app.config['SPECIALIZED_MODEL'] = classifier
    # app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == "__main__":
    main() 