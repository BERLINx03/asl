@echo off
echo Starting ASL Recognition API with A to F specialized model...

:: Check if model exists, train if not
if not exist asl_recognition\data\specialized\A_to_F\asl_model_A_to_F.pkl (
    echo Model not found, training now...
    python -m asl_recognition.train_specialized_model --start_letter A --end_letter F --output_dir asl_recognition\data\specialized\A_to_F
)

echo.
echo Starting the specialized API server...
echo API will be available at http://localhost:8000
echo.
echo Use the endpoint with model=A_to_F parameter:
echo - POST /predict?model=A_to_F
echo - POST /predict/base64 with JSON {"image": "base64string", "model": "A_to_F"}
echo.
echo Press Ctrl+C to stop the server
echo.

:: Run the specialized API
python -m asl_recognition.specialized_api 