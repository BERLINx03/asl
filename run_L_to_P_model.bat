@echo off
echo Starting ASL Recognition API with L to P specialized model...

:: Check if model exists, train if not
if not exist asl_recognition\data\specialized\L_to_P\asl_model_L_to_P.pkl (
    echo Model not found, training now...
    python -m asl_recognition.train_specialized_model --start_letter L --end_letter P --output_dir asl_recognition\data\specialized\L_to_P
)

echo.
echo Starting the specialized API server...
echo API will be available at http://localhost:8000
echo.
echo Use the endpoint with model=L_to_P parameter:
echo - POST /predict?model=L_to_P
echo - POST /predict/base64 with JSON {"image": "base64string", "model": "L_to_P"}
echo.
echo Press Ctrl+C to stop the server
echo.

:: Run the specialized API
python -m asl_recognition.specialized_api 