try {
    $body = @{
        category = "tax_evasion"
        title = "Test Report ABC"
        description = "This is a simple test report"
        priority = "medium"
        reporter_info = @{
            anonymous = $true
            contact_preference = "none"
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/reports" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    
    Write-Host "Success! Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Cyan
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
}