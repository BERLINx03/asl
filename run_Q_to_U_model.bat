@echo off
echo Starting ASL Recognition API with Q to U specialized model...

:: Check if model exists, train if not
if not exist asl_recognition\data\specialized\Q_to_U\asl_model_Q_to_U.pkl (
    echo Model not found, training now...
    python -m asl_recognition.train_specialized_model --start_letter Q --end_letter U --output_dir asl_recognition\data\specialized\Q_to_U
)

echo.
echo Starting the specialized API server...
echo API will be available at http://localhost:8000
echo.
echo Use the endpoint with model=Q_to_U parameter:
echo - POST /predict?model=Q_to_U
echo - POST /predict/base64 with JSON {"image": "base64string", "model": "Q_to_U"}
echo.
echo Press Ctrl+C to stop the server
echo.

:: Run the specialized API
python -m asl_recognition.specialized_api 