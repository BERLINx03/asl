@echo off
echo Starting ASL Recognition API with all specialized models...

:: Check if models are trained
set all_trained=true

if not exist asl_recognition\data\specialized\A_to_F\asl_model_A_to_F.pkl set all_trained=false
if not exist asl_recognition\data\specialized\G_to_K\asl_model_G_to_K.pkl set all_trained=false
if not exist asl_recognition\data\specialized\L_to_P\asl_model_L_to_P.pkl set all_trained=false
if not exist asl_recognition\data\specialized\Q_to_U\asl_model_Q_to_U.pkl set all_trained=false
if not exist asl_recognition\data\specialized\V_to_Z\asl_model_V_to_Z.pkl set all_trained=false

if "%all_trained%"=="false" (
    echo Some models are not trained yet. Training all models...
    call train_specialized_models.bat
)

echo.
echo Starting the specialized API server with all models...
echo API will be available at http://localhost:8000
echo.
echo Available models:
echo - general (all letters)
echo - A_to_F (letters A to F)
echo - G_to_K (letters G to K)
echo - L_to_P (letters L to P)
echo - Q_to_U (letters Q to U)
echo - V_to_Z (letters V to Z)
echo.
echo Use endpoints:
echo - GET /health - Check API health and available models
echo - GET /models - List available models
echo - POST /predict?model=MODEL_NAME - Upload an image file with model parameter
echo - POST /predict/base64 with JSON {"image": "base64string", "model": "MODEL_NAME"}
echo.
echo Press Ctrl+C to stop the server
echo.

:: Run the specialized API
python -m asl_recognition.specialized_api 