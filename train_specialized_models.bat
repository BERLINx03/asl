@echo off
echo Training specialized ASL recognition models for different letter ranges...

:: Create structured directories
mkdir asl_recognition\data\specialized 2>nul
mkdir asl_recognition\data\specialized\A_to_F 2>nul
mkdir asl_recognition\data\specialized\G_to_K 2>nul
mkdir asl_recognition\data\specialized\L_to_P 2>nul
mkdir asl_recognition\data\specialized\Q_to_U 2>nul
mkdir asl_recognition\data\specialized\V_to_Z 2>nul

echo.
echo Training A to F model...
python -m asl_recognition.train_specialized_model --start_letter A --end_letter F --output_dir asl_recognition\data\specialized\A_to_F --tune_hyperparams

echo.
echo Training G to K model...
python -m asl_recognition.train_specialized_model --start_letter G --end_letter K --output_dir asl_recognition\data\specialized\G_to_K --tune_hyperparams

echo.
echo Training L to P model...
python -m asl_recognition.train_specialized_model --start_letter L --end_letter P --output_dir asl_recognition\data\specialized\L_to_P --tune_hyperparams

echo.
echo Training Q to U model...
python -m asl_recognition.train_specialized_model --start_letter Q --end_letter U --output_dir asl_recognition\data\specialized\Q_to_U --tune_hyperparams

echo.
echo Training V to Z model...
python -m asl_recognition.train_specialized_model --start_letter V --end_letter Z --output_dir asl_recognition\data\specialized\V_to_Z --tune_hyperparams

echo.
echo All specialized models have been trained successfully!
echo Models are saved in asl_recognition\data\specialized\[letter_range] directories 