# Generate HTML railroad diagrams for all ABNF files in the examples directory

param(
    [string]$ExamplesPath = "examples",
    [switch]$Verbose
)

# Colors for output
$SuccessColor = "Green"
$ErrorColor = "Red"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

Write-Host "🚂 Railroad Diagram Generator - Examples Processor" -ForegroundColor $InfoColor
Write-Host ("=" * 60) -ForegroundColor $InfoColor

# Check if examples directory exists
if (!(Test-Path $ExamplesPath)) {
    Write-Host "Examples directory '$ExamplesPath' not found" -ForegroundColor $ErrorColor
    exit 1
}

# Find all ABNF files recursively
$abnfFiles = Get-ChildItem -Path $ExamplesPath -Filter "*.abnf" -Recurse

if ($abnfFiles.Count -eq 0) {
    Write-Host "No ABNF files found in '$ExamplesPath' directory" -ForegroundColor $WarningColor
    exit 0
}

Write-Host "Found $($abnfFiles.Count) ABNF files to process`n" -ForegroundColor $InfoColor

$successCount = 0
$failureCount = 0

# Process each ABNF file
foreach ($abnfFile in $abnfFiles) {
    $inputPath = $abnfFile.FullName
    $outputPath = $inputPath -replace '\.abnf$', '.html'
    $relativePath = Resolve-Path -Path $inputPath -Relative
    
    Write-Host "Processing: $relativePath" -ForegroundColor $InfoColor
    
    try {
        # Extract filename for title
        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($abnfFile.Name)
        
        # Run the CLI tool
        $titleArg = "Railroad Diagrams: $baseName"
        
        if ($Verbose) {
            Write-Host "  Running: node bin/cli.js `"$inputPath`" `"$outputPath`" --title `"$titleArg`"" -ForegroundColor "Gray"
        }
        
        $result = & node "bin/cli.js" $inputPath $outputPath "--title" $titleArg 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $relativeOutput = Resolve-Path -Path $outputPath -Relative
            
            # Try to extract rule count from output (safely handle null result)
            if ($result -and ($result -join " ") -match "(\d+) rules") {
                $ruleCount = $matches[1]
                Write-Host "  ✅ Generated: $relativeOutput ($ruleCount rules)" -ForegroundColor $SuccessColor
            } else {
                Write-Host "  ✅ Generated: $relativeOutput" -ForegroundColor $SuccessColor
            }
            
            $successCount++
        } else {
            Write-Host "  ❌ Failed to generate HTML" -ForegroundColor $ErrorColor
            if ($Verbose -and $result) {
                $resultStr = if ($result -is [array]) { $result -join " " } else { $result.ToString() }
                Write-Host "  Error output: $resultStr" -ForegroundColor "Gray"
            }
            $failureCount++
        }
    }
    catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor $ErrorColor
        $failureCount++
    }
    
    Write-Host "" # Empty line for spacing
}

# Summary
Write-Host ("=" * 60) -ForegroundColor $InfoColor
Write-Host "📊 Summary:" -ForegroundColor $InfoColor
Write-Host "  ✅ Successful: $successCount" -ForegroundColor $SuccessColor
Write-Host "  ❌ Failed: $failureCount" -ForegroundColor $(if ($failureCount -gt 0) { $ErrorColor } else { $InfoColor })
Write-Host "  📁 Total: $($abnfFiles.Count)" -ForegroundColor $InfoColor

if ($failureCount -gt 0) {
    Write-Host "`nSome files failed to process. Use -Verbose for more details." -ForegroundColor $WarningColor
    exit 1
} else {
    Write-Host "`n🎉 All files processed successfully!" -ForegroundColor $SuccessColor
}