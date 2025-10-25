# ZRA TaxGuard AI - Desktop Shortcuts Creator
# Creates convenient desktop shortcuts for system management

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     ZRA TAXGUARD AI - DESKTOP SHORTCUTS CREATOR" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$desktopPath = [Environment]::GetFolderPath("Desktop")
$projectPath = "E:\ZRA PROJECT"

# Function to create shortcut
function Create-Shortcut {
    param(
        [string]$ShortcutPath,
        [string]$TargetPath,
        [string]$Description,
        [string]$IconPath = $null
    )
    
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = $TargetPath
    $Shortcut.Description = $Description
    $Shortcut.WorkingDirectory = $projectPath
    if ($IconPath) {
        $Shortcut.IconLocation = $IconPath
    }
    $Shortcut.Save()
}

Write-Host "Creating desktop shortcuts..." -ForegroundColor Green
Write-Host ""

try {
    # System Manager Shortcut
    Create-Shortcut -ShortcutPath "$desktopPath\ZRA TaxGuard - System Manager.lnk" `
                   -TargetPath "$projectPath\SYSTEM-MANAGER.bat" `
                   -Description "ZRA TaxGuard AI System Manager - Start, Stop, and Monitor Services"
    Write-Host "✓ Created: ZRA TaxGuard - System Manager" -ForegroundColor Green

    # Quick Start Shortcut
    Create-Shortcut -ShortcutPath "$desktopPath\ZRA TaxGuard - Quick Start.lnk" `
                   -TargetPath "$projectPath\START-SYSTEM.bat" `
                   -Description "ZRA TaxGuard AI Quick Start - Start Core Services"
    Write-Host "✓ Created: ZRA TaxGuard - Quick Start" -ForegroundColor Green

    # Status Check Shortcut
    Create-Shortcut -ShortcutPath "$desktopPath\ZRA TaxGuard - Status Check.lnk" `
                   -TargetPath "$projectPath\CHECK-STATUS.bat" `
                   -Description "ZRA TaxGuard AI Status Check - View Running Services"
    Write-Host "✓ Created: ZRA TaxGuard - Status Check" -ForegroundColor Green

    # Dashboard Shortcut (URL)
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$desktopPath\ZRA TaxGuard - Dashboard.url")
    $Shortcut.TargetPath = "http://localhost:3000"
    $Shortcut.Save()
    Write-Host "✓ Created: ZRA TaxGuard - Dashboard" -ForegroundColor Green

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "Desktop shortcuts created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now use these shortcuts from your desktop:" -ForegroundColor White
    Write-Host "  • ZRA TaxGuard - System Manager (Full control)" -ForegroundColor Cyan
    Write-Host "  • ZRA TaxGuard - Quick Start (One-click startup)" -ForegroundColor Cyan
    Write-Host "  • ZRA TaxGuard - Status Check (View status)" -ForegroundColor Cyan
    Write-Host "  • ZRA TaxGuard - Dashboard (Open web interface)" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan

} catch {
    Write-Host "Error creating shortcuts: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
