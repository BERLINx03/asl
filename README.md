# ASL Recognition System

A system for recognizing American Sign Language (ASL) gestures using hand landmark detection.

## Overview

This project uses MediaPipe's hand landmark detection to extract key points from hand images, then classifies them into ASL letters and symbols. The approach is more robust than direct image-based classification because it's invariant to backgrounds, lighting conditions, and skin tones.

## Features

- Hand landmark extraction from images using MediaPipe
- Training a Random Forest classifier on landmark data
- Real-time ASL recognition from webcam input
- Support for all 26 letters of the alphabet plus "space" and "nothing" gestures

## Installation

1. Clone this repository:

```
git clone https://github.com/yourusername/asl-recognition.git
cd asl-recognition
```

2. Install the required dependencies:

```
pip install -r requirements.txt
```

## Usage

### Preparing the Dataset

The system expects ASL images to be organized in the following directory structure:

```
asl_alphabet_train/
├── A/
│   ├── A1.jpg
│   ├── A2.jpg
│   └── ...
├── B/
│   ├── B1.jpg
│   ├── B2.jpg
│   └── ...
└── ...
```

### Training the Model

To extract landmarks and train the model:

```
python -m asl_recognition.train_model --extract_landmarks
```

Options:

- `--train_dir`: Directory containing training images (default: 'asl_alphabet_train/asl_alphabet_train')
- `--output_dir`: Directory to save model and dataset (default: 'asl_recognition/data')
- `--extract_landmarks`: Extract landmarks from images (if not already extracted)
- `--tune_hyperparams`: Tune model hyperparameters (takes longer)

### Running the Demo

To run the real-time ASL recognition demo using your webcam:

```
python -m asl_recognition.demo
```

Options:

- `--model_path`: Path to the trained model (default: 'asl_recognition/data/asl_model.pkl')
- `--camera`: Camera index (default: 0, usually the built-in webcam)

Press 'q' to quit the demo.

## How It Works

1. **Hand Landmark Detection**: MediaPipe detects 21 key points on the hand.
2. **Landmark Normalization**: The landmarks are normalized to be invariant to translation, rotation, and scale.
3. **Classification**: A Random Forest classifier predicts the ASL letter/symbol from the normalized landmarks.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The ASL Alphabet dataset
- MediaPipe for the hand tracking technology
- scikit-learn for the machine learning tools
