@echo off
echo ===================================
echo   Lyrical Toolkit Sync Utility
echo ===================================
echo.
echo Choose sync direction:
echo.
echo 1. Sync ALL shared files (Website → Mobile)
echo 2. Sync ALL shared files (Mobile → Website)
echo 3. Sync services only (Website → Mobile)
echo 4. Sync services only (Mobile → Website)
echo 5. Sync hooks only (Website → Mobile)
echo 6. Sync hooks only (Mobile → Website)
echo 7. Sync specific file
echo 8. Exit
echo.
set /p choice="Enter choice (1-8): "

if "%choice%"=="1" goto sync_all_to_mobile
if "%choice%"=="2" goto sync_all_to_website
if "%choice%"=="3" goto sync_services_to_mobile
if "%choice%"=="4" goto sync_services_to_website
if "%choice%"=="5" goto sync_hooks_to_mobile
if "%choice%"=="6" goto sync_hooks_to_website
if "%choice%"=="7" goto sync_specific
if "%choice%"=="8" exit

:sync_all_to_mobile
echo.
echo Syncing ALL shared files: Website → Mobile...
echo.
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\services\*" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\services\"
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useAuth.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useAuth.js"
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useFileUpload.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useFileUpload.js"
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useLocalStorage.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useLocalStorage.js"
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useSearch.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useSearch.js"
xcopy /Y /S "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\components\Audio\*" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\components\Audio\"
xcopy /Y /S "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\components\Shared\*" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\components\Shared\"
xcopy /Y /S "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\components\Analysis\*" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\components\Analysis\"
echo.
echo ✅ All shared files synced to Mobile!
echo ⚠️  Remember to test the mobile app!
pause
exit

:sync_all_to_website
echo.
echo Syncing ALL shared files: Mobile → Website...
echo.
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\services\*" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\services\"
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useAuth.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useAuth.js"
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useFileUpload.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useFileUpload.js"
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useLocalStorage.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useLocalStorage.js"
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useSearch.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useSearch.js"
xcopy /Y /S "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\components\Audio\*" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\components\Audio\"
xcopy /Y /S "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\components\Shared\*" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\components\Shared\"
xcopy /Y /S "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\components\Analysis\*" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\components\Analysis\"
echo.
echo ✅ All shared files synced to Website!
echo ⚠️  Remember to test the website!
pause
exit

:sync_services_to_mobile
echo.
echo Syncing services: Website → Mobile...
echo.
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\services\*" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\services\"
echo.
echo ✅ Services synced to Mobile!
pause
exit

:sync_services_to_website
echo.
echo Syncing services: Mobile → Website...
echo.
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\services\*" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\services\"
echo.
echo ✅ Services synced to Website!
pause
exit

:sync_hooks_to_mobile
echo.
echo Syncing hooks: Website → Mobile...
echo.
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useAuth.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useAuth.js"
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useFileUpload.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useFileUpload.js"
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useLocalStorage.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useLocalStorage.js"
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useSearch.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useSearch.js"
echo.
echo ✅ Hooks synced to Mobile!
pause
exit

:sync_hooks_to_website
echo.
echo Syncing hooks: Mobile → Website...
echo.
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useAuth.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useAuth.js"
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useFileUpload.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useFileUpload.js"
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useLocalStorage.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useLocalStorage.js"
xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\src\hooks\useSearch.js" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\src\hooks\useSearch.js"
echo.
echo ✅ Hooks synced to Website!
pause
exit

:sync_specific
echo.
set /p filepath="Enter file path (e.g., src\hooks\useAuth.js): "
echo.
echo Choose direction:
echo 1. Website → Mobile
echo 2. Mobile → Website
set /p direction="Enter choice (1-2): "
echo.
if "%direction%"=="1" (
  xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\%filepath%" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\%filepath%"
  echo ✅ File synced: Website → Mobile
) else (
  xcopy /Y "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit mobile\%filepath%" "C:\Users\J\Desktop\WEBSITES\lyrical-toolkit\%filepath%"
  echo ✅ File synced: Mobile → Website
)
echo.
pause
exit
