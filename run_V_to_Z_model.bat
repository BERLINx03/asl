@echo off
echo Starting ASL Recognition API with V to Z specialized model...

:: Check if model exists, train if not
if not exist asl_recognition\data\specialized\V_to_Z\asl_model_V_to_Z.pkl (
    echo Model not found, training now...
    python -m asl_recognition.train_specialized_model --start_letter V --end_letter Z --output_dir asl_recognition\data\specialized\V_to_Z
)

echo.
echo Starting the specialized API server...
echo API will be available at http://localhost:8000
echo.
echo Use the endpoint with model=V_to_Z parameter:
echo - POST /predict?model=V_to_Z
echo - POST /predict/base64 with JSON {"image": "base64string", "model": "V_to_Z"}
echo.
echo Press Ctrl+C to stop the server
echo.

:: Run the specialized API
python -m asl_recognition.specialized_api 