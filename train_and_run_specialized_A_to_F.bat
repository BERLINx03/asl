@echo off
echo Training ASL recognition model for letters A to F...

:: Create specialized models directory if it doesn't exist
mkdir asl_recognition\data\specialized 2>nul

:: Train the specialized model
python -m asl_recognition.train_specialized_model --start_letter A --end_letter F --tune_hyperparams

echo.
echo Starting the specialized API server...
echo API will be available at http://localhost:8000
echo.
echo Use the following endpoints:
echo - GET /health - Check API health and available models
echo - GET /models - List available models
echo - POST /predict - Upload an image file with optional model parameter
echo - POST /predict/base64 - Send a base64 encoded image with optional model parameter
echo.
echo Press Ctrl+C to stop the server
echo.

:: Run the specialized API
python -m asl_recognition.specialized_api 