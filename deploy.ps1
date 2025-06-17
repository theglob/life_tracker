# Build the frontend
Write-Host "Building frontend..." -ForegroundColor Green
npm run build

# Deploy to GitHub Pages
Write-Host "Deploying to GitHub Pages..." -ForegroundColor Green
npm run deploy

# Deploy backend to Fly.io
Write-Host "Deploying backend to Fly.io..." -ForegroundColor Green
flyctl deploy

Write-Host "Deployment complete!" -ForegroundColor Green 