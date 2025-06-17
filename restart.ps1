param(
    [switch]$Clean
)

# Function to kill process using a specific port
function Kill-ProcessOnPort {
    param($port)
    $processId = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($processId) {
        Write-Host "Killing process using port $port (PID: $processId)"
        Stop-Process -Id $processId -Force
    }
}

if ($Clean) {
    # Kill any existing Node.js processes
    Write-Host "Stopping existing Node.js processes..."
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force

    # Kill process using port 3000 (backend)
    Kill-ProcessOnPort 3000

    # Wait a moment to ensure processes are fully stopped
    Start-Sleep -Seconds 2

    # Clear npm cache and reinstall dependencies
    Write-Host "Cleaning npm cache and reinstalling dependencies..."
    npm cache clean --force
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    npm install
} else {
    # Even without -Clean, we should kill the process on port 3000
    Kill-ProcessOnPort 3000
    Start-Sleep -Seconds 2
}

# Start the application
Write-Host "Starting the application..."
$env:NODE_OPTIONS="--no-deprecation"

# Start backend server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run server"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "Starting frontend server..."
npm run dev 