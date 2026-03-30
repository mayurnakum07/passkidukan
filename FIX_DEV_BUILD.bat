@echo off
echo ========================================
echo FIXING DEVELOPMENT BUILD
echo ========================================
echo.

echo [Step 1/5] Killing old processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo Done!
echo.

echo [Step 2/5] Setting up ADB reverse port forwarding...
adb -s 192.168.29.38:42377 reverse --remove-all >nul 2>&1
adb -s 192.168.29.38:42377 reverse tcp:8081 tcp:8081
if %errorlevel% neq 0 (
    echo Trying with default device...
    adb reverse tcp:8081 tcp:8081
)
echo ADB reverse setup complete!
echo.

echo [Step 3/5] Starting Metro Bundler in new window...
set EXPO_NO_METRO_LAZY=1
set WATCHMAN_DISABLE_FILE_WATCHING=1
start "Metro Bundler - DO NOT CLOSE" cmd /k "set EXPO_NO_METRO_LAZY=1 && set WATCHMAN_DISABLE_FILE_WATCHING=1 && npx expo start --dev-client --port 8081 --lan --clear"
timeout /t 10 /nobreak >nul
echo Metro Bundler started!
echo.

echo [Step 4/5] Verifying Metro Bundler...
netstat -ano | findstr ":8081" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo Metro Bundler is RUNNING on port 8081
) else (
    echo WARNING: Metro Bundler might not be running. Check the Metro window.
)
echo.

echo [Step 5/5] Installing/Updating app on device...
npx expo run:android --device 192.168.29.38:42377
echo.

echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo Metro Bundler URL: http://192.168.29.73:8081
echo Device can connect via: http://localhost:8081 (ADB reverse)
echo.
echo IMPORTANT:
echo 1. Keep Metro Bundler window OPEN
echo 2. Open app on device
echo 3. If connection error, manually add: http://192.168.29.73:8081
echo.
echo Press any key to exit...
pause >nul


