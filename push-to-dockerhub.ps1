# ====================================================
# Script: Push all hotel-booking images to Docker Hub
# Username: dhope14102004
# Usage: Run this script from the hotel-booking root
# ====================================================

$DOCKER_USER = "dhope14102004"
$PROJECT = "hotel-booking"

# Define all services with their directories
$services = @(
    @{ Name = "gateway";              Dir = "gateway" }
    @{ Name = "auth-service";         Dir = "services/auth-service" }
    @{ Name = "booking-service";      Dir = "services/booking-service" }
    @{ Name = "chat-service";         Dir = "services/chat-service" }
    @{ Name = "hotel-service";        Dir = "services/hotel-service" }
    @{ Name = "notification-service"; Dir = "services/notification-service" }
    @{ Name = "operations-service";   Dir = "services/operations-service" }
    @{ Name = "payment-service";      Dir = "services/payment-service" }
    @{ Name = "promo-service";        Dir = "services/promo-service" }
    @{ Name = "review-service";       Dir = "services/review-service" }
    @{ Name = "client";               Dir = "client" }
)

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host " Hotel Booking - Docker Hub Push" -ForegroundColor Cyan
Write-Host "=====================================`n" -ForegroundColor Cyan

# Step 1: Check Docker login
Write-Host "[1/3] Checking Docker Hub login..." -ForegroundColor Yellow
$loginCheck = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running! Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Step 2: Build and tag all images
Write-Host "`n[2/3] Building & tagging images..." -ForegroundColor Yellow
$failed = @()

foreach ($svc in $services) {
    $imageName = "$DOCKER_USER/$PROJECT-$($svc.Name):latest"
    $buildPath = Join-Path $PSScriptRoot $svc.Dir
    
    Write-Host "`n  Building: $imageName" -ForegroundColor Green
    
    if ($svc.Name -eq "client") {
        # Client needs VITE_ env vars at build time
        $envFile = Join-Path $buildPath ".env"
        $clerkKey = ""
        $backendUrl = "http://localhost:3000"
        if (Test-Path $envFile) {
            Get-Content $envFile | ForEach-Object {
                if ($_ -match "^VITE_CLERK_PUBLISHABLE_KEY=(.+)$") { $clerkKey = $Matches[1].Trim() }
                if ($_ -match "^VITE_BACKEND_URL=(.+)$") { $backendUrl = $Matches[1].Trim() }
            }
        }
        docker build -t $imageName --build-arg "VITE_CLERK_PUBLISHABLE_KEY=$clerkKey" --build-arg "VITE_BACKEND_URL=$backendUrl" $buildPath
    } else {
        docker build -t $imageName $buildPath
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  FAILED: $($svc.Name)" -ForegroundColor Red
        $failed += $svc.Name
    } else {
        Write-Host "  SUCCESS: $($svc.Name)" -ForegroundColor Green
    }
}

if ($failed.Count -gt 0) {
    Write-Host "`nFailed to build: $($failed -join ', ')" -ForegroundColor Red
    Write-Host "Fix the errors above and re-run this script." -ForegroundColor Red
    exit 1
}

# Step 3: Push all images
Write-Host "`n[3/3] Pushing images to Docker Hub..." -ForegroundColor Yellow

foreach ($svc in $services) {
    $imageName = "$DOCKER_USER/$PROJECT-$($svc.Name):latest"
    
    Write-Host "`n  Pushing: $imageName" -ForegroundColor Cyan
    docker push $imageName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  PUSH FAILED: $($svc.Name)" -ForegroundColor Red
        Write-Host "  Make sure you are logged in: docker login" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "`n=====================================" -ForegroundColor Green
Write-Host " All images pushed successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "`nView your images at:" -ForegroundColor Cyan
Write-Host "  https://hub.docker.com/u/$DOCKER_USER" -ForegroundColor White
Write-Host "`nImage names:" -ForegroundColor Cyan
foreach ($svc in $services) {
    Write-Host "  - $DOCKER_USER/$PROJECT-$($svc.Name):latest" -ForegroundColor White
}
