# ASL Recognition Specialized Models

This extension to the ASL Recognition system provides specialized models trained on subsets of ASL letters. By focusing on smaller groups of letters, these models can achieve higher accuracy for specific exercises.

## Available Models

The system includes the following specialized models:

1. **A to F**: Letters A, B, C, D, E, F
2. **G to K**: Letters G, H, I, J, K
3. **L to P**: Letters L, M, N, O, P
4. **Q to U**: Letters Q, R, S, T, U
5. **V to Z**: Letters V, W, X, Y, Z

Each model is stored in its own directory under `asl_recognition/data/specialized/`.

## Training

To train all the specialized models:

```
train_specialized_models.bat
```

This will train each specialized model with optimized hyperparameters and save them in their respective directories.

## Running the Models

You can run the API with specific letter range models:

- For A-F letters: `run_A_to_F_model.bat`
- For G-K letters: `run_G_to_K_model.bat`
- For L-P letters: `run_L_to_P_model.bat`
- For Q-U letters: `run_Q_to_U_model.bat`
- For V-Z letters: `run_V_to_Z_model.bat`

Or run the API with all models loaded:

```
run_all_models.bat
```

## API Usage

The specialized API is identical to the regular API but allows you to specify which model to use for prediction:

### Endpoints

- `GET /health` - Check API health and available models
- `GET /models` - List all available models
- `POST /predict?model=MODEL_NAME` - Predict from an uploaded image using a specific model
- `POST /predict/base64` - Predict from a base64 encoded image

### Specifying a Model

To use a specific model, add the `model` parameter to your request:

For file uploads:

```
POST /predict?model=A_to_F
```

For base64 encoded images:

```json
{
  "image": "base64_encoded_image_data",
  "model": "A_to_F"
}
```

Available model values:

- `general` - The general model trained on all letters (default)
- `A_to_F` - Specialized model for letters A through F
- `G_to_K` - Specialized model for letters G through K
- `L_to_P` - Specialized model for letters L through P
- `Q_to_U` - Specialized model for letters Q through U
- `V_to_Z` - Specialized model for letters V through Z

## Response

The API response includes a `model_used` field to indicate which model was used for prediction:

```json
{
  "sign": "A",
  "confidence": 0.95,
  "landmarks": [...],
  "has_hand": true,
  "model_used": "A_to_F"
}
```
