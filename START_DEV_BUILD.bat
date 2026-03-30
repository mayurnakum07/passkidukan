@echo off
echo ========================================
echo Starting Development Build Setup
echo ========================================
echo.

echo [1/3] Setting up ADB reverse port forwarding...
adb -s 192.168.29.38:42377 reverse tcp:8081 tcp:8081
if %errorlevel% neq 0 (
    echo WARNING: ADB reverse failed. Trying with default device...
    adb reverse tcp:8081 tcp:8081
)
echo ADB reverse setup complete!
echo.

echo [2/3] Starting Metro Bundler...
set EXPO_NO_METRO_LAZY=1
set WATCHMAN_DISABLE_FILE_WATCHING=1
start "Metro Bundler" cmd /k "npx expo start --dev-client --port 8081 --lan --clear"
timeout /t 8 /nobreak >nul
echo Metro Bundler started!
echo.

echo [3/3] Building and installing app...
npx expo run:android
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Metro Bundler: http://192.168.29.73:8081
echo Device can connect via: http://localhost:8081 (ADB reverse)
echo.
echo If app shows connection error:
echo 1. Open app on device
echo 2. Go to Development Servers
echo 3. Add: http://192.168.29.73:8081
echo    OR: http://localhost:8081
echo.
pause

