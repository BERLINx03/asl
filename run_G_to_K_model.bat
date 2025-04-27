@echo off
echo Starting ASL Recognition API with G to K specialized model...

:: Check if model exists, train if not
if not exist asl_recognition\data\specialized\G_to_K\asl_model_G_to_K.pkl (
    echo Model not found, training now...
    python -m asl_recognition.train_specialized_model --start_letter G --end_letter K --output_dir asl_recognition\data\specialized\G_to_K
)

echo.
echo Starting the specialized API server...
echo API will be available at http://localhost:8000
echo.
echo Use the endpoint with model=G_to_K parameter:
echo - POST /predict?model=G_to_K
echo - POST /predict/base64 with JSON {"image": "base64string", "model": "G_to_K"}
echo.
echo Press Ctrl+C to stop the server
echo.

:: Run the specialized API
python -m asl_recognition.specialized_api 