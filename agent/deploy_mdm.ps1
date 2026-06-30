# Install PyInstaller if not present
Write-Host "1. Installing packaging tools..."
pip install pyinstaller

# Compile the Python script into a silent executable
Write-Host "2. Compiling agent to a silent Windows Executable..."
pyinstaller --onefile --noconsole agent.py

# Create a Startup Shortcut for persistence (Simulating MDM deployment)
Write-Host "3. Configuring Windows Startup persistence..."
$StartupFolder = [Environment]::GetFolderPath("Startup")
$ShortcutFile = "$StartupFolder\HRIP_Agent.lnk"
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutFile)
$Shortcut.TargetPath = "$PWD\dist\agent.exe"
$Shortcut.WorkingDirectory = "$PWD"
$Shortcut.Description = "HRIP Native Telemetry Agent"
$Shortcut.Save()

Write-Host "------------------------------------------------------"
Write-Host "✅ DEPLOYMENT COMPLETE"
Write-Host "The Native Agent has been compiled to a silent .exe and installed to your Windows Startup folder."
Write-Host "It will now start automatically and invisibly every time you boot your computer."

# Start it immediately so we don't have to reboot
Write-Host "Starting the background service now..."
Start-Process -FilePath "$PWD\dist\agent.exe" -WorkingDirectory "$PWD" -WindowStyle Hidden
