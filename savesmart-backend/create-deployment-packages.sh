#!/bin/bash
# SaveSmart Backend - Create Lambda Deployment Packages
# This script creates deployment packages for Auth and Users Lambda functions

echo "🚀 Creating Lambda Deployment Packages"
echo "======================================="
echo ""

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found. Please run 'npx tsc' first."
    exit 1
fi

# Function to create deployment package
create_deployment_package() {
    local function_name=$1
    local source_dir=$2
    local output_zip=$3

    echo "📦 Creating $function_name deployment package..."

    # Check if source directory exists
    if [ ! -d "$source_dir" ]; then
        echo "❌ Error: $source_dir not found"
        return 1
    fi

    # Navigate to source directory
    cd "$source_dir" || return 1

    # Initialize package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        echo "   Initializing package.json..."
        npm init -y > /dev/null 2>&1

        # Set type to commonjs using node
        node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json'));pkg.type='commonjs';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2));"
    fi

    # Install dependencies
    echo "   Installing dependencies..."
    npm install @aws-sdk/client-dynamodb @aws-sdk/client-ssm jsonwebtoken bcryptjs uuid --silent > /dev/null 2>&1

    if [ $? -ne 0 ]; then
        echo "❌ Error: npm install failed"
        cd - > /dev/null
        return 1
    fi

    # Create zip file using PowerShell (available in Git Bash on Windows)
    echo "   Creating zip archive..."

    # Remove old zip if exists
    [ -f "../../$output_zip" ] && rm "../../$output_zip"

    # Use PowerShell's Compress-Archive from Git Bash
    powershell.exe -Command "Compress-Archive -Path * -DestinationPath ../../$output_zip -Force" > /dev/null 2>&1

    cd - > /dev/null

    if [ -f "$output_zip" ]; then
        local zip_size=$(du -h "$output_zip" | cut -f1)
        echo "✅ $function_name package created: $output_zip ($zip_size)"
        return 0
    else
        echo "❌ Error: Failed to create $output_zip"
        return 1
    fi
}

# Create Auth Lambda package
create_deployment_package "Auth Lambda" "dist/auth" "auth.zip"
auth_success=$?

echo ""

# Create Users Lambda package
create_deployment_package "Users Lambda" "dist/users" "users.zip"
users_success=$?

echo ""
echo "======================================="

if [ $auth_success -eq 0 ] && [ $users_success -eq 0 ]; then
    echo "✅ All deployment packages created successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Upload auth.zip to AWS Lambda (savesmart-auth-lambda)"
    echo "   2. Upload users.zip to AWS Lambda (savesmart-users-lambda)"
    echo "   3. Configure environment variables (see AUTH_DEPLOYMENT.md)"
    echo "   4. Test the endpoints"
    exit 0
else
    echo "❌ Some packages failed to create. Please check the errors above."
    exit 1
fi
