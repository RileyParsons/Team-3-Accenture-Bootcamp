# Test the chat endpoint
$apiUrl = "https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod"
$endpoint = "$apiUrl/chat"

Write-Host "Testing chat endpoint: $endpoint" -ForegroundColor Cyan
Write-Host ""

$body = @{
    userId = "demo-sarah-123"
    message = "How can I save money on groceries?"
} | ConvertTo-Json

Write-Host "Request body:" -ForegroundColor Yellow
Write-Host $body
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $endpoint -Method Post -Body $body -ContentType "application/json"

    Write-Host "✓ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "✗ Error!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red

    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}
