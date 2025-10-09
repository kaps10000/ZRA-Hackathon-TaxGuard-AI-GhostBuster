# Test 1: Complex report data
Write-Host "Testing complex report..." -ForegroundColor Yellow
$body1 = @{
    category = "fraud"
    title = "Complex Financial Irregularities"
    description = "Multiple issues found including discrepancies in tax calculations and suspicious transactions"
    priority = "high"
    reporter_info = @{
        anonymous = $false
        contact_preference = "email"
        email = "reporter@example.com"
    }
    metadata = @{
        amount = 50000
        currency = "ZMW"
        tax_period = "2024-Q3"
    }
} | ConvertTo-Json -Depth 10

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:4000/api/reports" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body1
    Write-Host "✅ Complex report test passed!" -ForegroundColor Green
    Write-Host "Report ID: $($response1.reportId)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Complex report test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Simple report data
Write-Host "`nTesting simple report..." -ForegroundColor Yellow
$body2 = @{
    category = "compliance"
    title = "Basic Tax Issue"
    description = "Simple compliance matter"
    priority = "low"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:4000/api/reports" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body2
    Write-Host "✅ Simple report test passed!" -ForegroundColor Green
    Write-Host "Report ID: $($response2.reportId)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Simple report test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 All tests completed!" -ForegroundColor Green