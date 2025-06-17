param(
    [switch]$Clean
)

if ($Clean) {
    # Kill any existing Node.js processes
    Write-Host "Stopping existing Node.js processes..."
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force

    # Wait a moment to ensure processes are fully stopped
    Start-Sleep -Seconds 2

    # Clear npm cache and reinstall dependencies
    Write-Host "Cleaning npm cache and reinstalling dependencies..."
    npm cache clean --force
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    npm install
}

# Start the application
Write-Host "Starting the application..."
$env:NODE_OPTIONS="--no-deprecation"
npm run dev:all 