@echo off
echo ========================================
echo MediRoute - Git Push to GitHub
echo ========================================
echo.

echo Step 1: Checking Git status...
git status
echo.

echo Step 2: Adding all files...
git add .
echo.

echo Step 3: Committing changes...
git commit -m "feat: complete MediRoute v3.0.0 - all phases implemented - Phase 1: Audit logging, email notifications, password reset, validation, rate limiting, search - Phase 2: Medical records, billing, analytics, PDF generation, doctor scheduling - Phase 3: Real-time messaging, notifications, 2FA, error handling, API documentation - Total: 95+ endpoints, 23 database tables, 50+ features"
echo.

echo Step 4: Setting branch to main...
git branch -M main
echo.

echo Step 5: Adding remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/tFardaus/mediroute.git
echo.

echo Step 6: Pushing to GitHub...
git push -u origin main
echo.

echo ========================================
echo Push Complete!
echo ========================================
echo.
echo Visit: https://github.com/tFardaus/mediroute
echo.

pause
