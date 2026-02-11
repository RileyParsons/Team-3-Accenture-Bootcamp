# SaveSmart Backend - Create Lambda Deployment Packages
# This script creates deployment packages for Auth and Users Lambda functions

Write-Host "🚀 Creating Lambda Deployment Packages" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if dist directory exists
if (-not (Test-Path "dist")) {
    Write-Host "❌ Error: dist directory not found. Please run 'npx tsc' first." -ForegroundColor Red
    exit 1
}

# Function to create deployment package
function Create-DeploymentPackage {
    param (
        [string]$FunctionName,
        [string]$SourceDir,
        [string]$OutputZip
    )

    Write-Host "📦 Creating $FunctionName deployment package..." -ForegroundColor Yellow

    # Check if source directory exists
    if (-not (Test-Path $SourceDir)) {
        Write-Host "❌ Error: $SourceDir not found" -ForegroundColor Red
        return $false
    }

    # Navigate to source directory
    Push-Location $SourceDir

    # Initialize package.json if it doesn't exist
    if (-not (Test-Path "package.json")) {
        Write-Host "   Initializing package.json..." -ForegroundColor Gray
        npm init -y | Out-Null

        # Set type to commonjs
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        $packageJson | Add-Member -NotePropertyName "type" -NotePropertyValue "commonjs" -Force
        $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
    }

    # Install dependencies
    Write-Host "   Installing dependencies..." -ForegroundColor Gray
    npm install @aws-sdk/client-dynamodb @aws-sdk/client-ssm jsonwebtoken bcryptjs uuid --silent 2>&1 | Out-Null

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: npm install failed" -ForegroundColor Red
        Pop-Location
        return $false
    }

    # Create zip file
    Write-Host "   Creating zip archive..." -ForegroundColor Gray

    # Remove old zip if exists
    if (Test-Path $OutputZip) {
        Remove-Item $OutputZip -Force
    }

    # Create zip with all files
    Compress-Archive -Path * -DestinationPath $OutputZip -Force

    Pop-Location

    if (Test-Path $OutputZip) {
        $zipSize = (Get-Item $OutputZip).Length / 1MB
        Write-Host "✅ $FunctionName package created: $OutputZip ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Error: Failed to create $OutputZip" -ForegroundColor Red
        return $false
    }
}

# Create Auth Lambda package
$authSuccess = Create-DeploymentPackage -FunctionName "Auth Lambda" -SourceDir "dist/auth" -OutputZip "auth.zip"

Write-Host ""

# Create Users Lambda package
$usersSuccess = Create-DeploymentPackage -FunctionName "Users Lambda" -SourceDir "dist/users" -OutputZip "users.zip"

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan

if ($authSuccess -and $usersSuccess) {
    Write-Host "✅ All deployment packages created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Upload auth.zip to AWS Lambda (savesmart-auth-lambda)" -ForegroundColor White
    Write-Host "   2. Upload users.zip to AWS Lambda (savesmart-users-lambda)" -ForegroundColor White
    Write-Host "   3. Configure environment variables (see AUTH_DEPLOYMENT.md)" -ForegroundColor White
    Write-Host "   4. Test the endpoints" -ForegroundColor White
    exit 0
} else {
    Write-Host "❌ Some packages failed to create. Please check the errors above." -ForegroundColor Red
    exit 1
}
