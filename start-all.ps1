# start-all.ps1 - Khoi dong toan bo du an Hotel Booking
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$services = @(
    @{ name = "Gateway";              path = "$root\gateway" },
    @{ name = "Auth-Service";         path = "$root\services\auth-service" },
    @{ name = "Booking-Service";      path = "$root\services\booking-service" },
    @{ name = "Hotel-Service";        path = "$root\services\hotel-service" },
    @{ name = "Payment-Service";      path = "$root\services\payment-service" },
    @{ name = "Operations-Service";   path = "$root\services\operations-service" },
    @{ name = "Notification-Service"; path = "$root\services\notification-service" },
    @{ name = "Chat-Service";         path = "$root\services\chat-service" },
    @{ name = "Promo-Service";        path = "$root\services\promo-service" },
    @{ name = "Review-Service";       path = "$root\services\review-service" },
    @{ name = "Client";               path = "$root\client" }
)

Write-Host "Starting Hotel Booking project..." -ForegroundColor Cyan

foreach ($svc in $services) {
    Write-Host ">> $($svc.name)" -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$($svc.path)'; npm run dev" -WindowStyle Normal
    Start-Sleep -Milliseconds 600
}

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host "Frontend : http://localhost:5173" -ForegroundColor Green
Write-Host "Gateway  : http://localhost:3000" -ForegroundColor Green
