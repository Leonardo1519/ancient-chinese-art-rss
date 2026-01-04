# Simple Firefox Plugin Package Builder

Write-Host "Creating Firefox plugin package..." -ForegroundColor Cyan

# Clean up
if (Test-Path "ancient-chinese-art-rss-firefox.zip") {
    Remove-Item "ancient-chinese-art-rss-firefox.zip" -Force
}

# Create temporary directory
$tempDir = "temp_firefox_build"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "Copying files..." -ForegroundColor Gray

# Copy manifest
Copy-Item "manifest.json" -Destination $tempDir

# Copy icons (only the required ones)
New-Item -ItemType Directory -Path "$tempDir/icons" | Out-Null
Copy-Item "icons/icon16.png" -Destination "$tempDir/icons/"
Copy-Item "icons/icon48.png" -Destination "$tempDir/icons/"
Copy-Item "icons/icon128.png" -Destination "$tempDir/icons/"

# Copy src files
New-Item -ItemType Directory -Path "$tempDir/src" | Out-Null
Copy-Item "src/background-firefox.js" -Destination "$tempDir/src/"
Copy-Item "src/browser-polyfill-mini.js" -Destination "$tempDir/src/"
Copy-Item "src/popup.html" -Destination "$tempDir/src/"
Copy-Item "src/popup.js" -Destination "$tempDir/src/"
Copy-Item "src/popup.css" -Destination "$tempDir/src/"
Copy-Item "src/newtab.html" -Destination "$tempDir/src/"
Copy-Item "src/newtab.js" -Destination "$tempDir/src/"
Copy-Item "src/styles.css" -Destination "$tempDir/src/"

Write-Host "Creating ZIP archive..." -ForegroundColor Gray

# Create zip from temp directory
$source = Get-Item $tempDir
$destination = Join-Path $PWD "ancient-chinese-art-rss-firefox.zip"

# Use Compress-Archive on the contents
Get-ChildItem $tempDir | Compress-Archive -DestinationPath $destination -CompressionLevel Optimal

# Clean up temp directory
Remove-Item $tempDir -Recurse -Force

if (Test-Path $destination) {
    $fileInfo = Get-Item $destination
    $sizeKB = [math]::Round($fileInfo.Length / 1KB, 2)
    
    Write-Host ""
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Package created: ancient-chinese-art-rss-firefox.zip" -ForegroundColor Cyan
    Write-Host "Size: $sizeKB KB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "IMPORTANT: This package should work, but if you still get path errors," -ForegroundColor Yellow
    Write-Host "you may need to manually create the ZIP using 7-Zip or WinRAR." -ForegroundColor Yellow
} else {
    Write-Host "ERROR: Failed to create package" -ForegroundColor Red
    exit 1
}
