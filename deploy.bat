@echo off
echo ========================================
echo   Deploying to Vercel Production
echo ========================================
echo.

cd "D:\Hamza\Marketing Department\marketing-system"

echo Step 1: Vercel Login (if not already logged in)
call npx vercel login

echo.
echo Step 2: Deploy to Production
call npx vercel --prod

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Your app should now be live on Vercel.
echo Check the URL shown above.
echo.
pause
