param(
    [string]$Email = "employee@company.com",
    [string]$ApiUrl = "http://localhost:3000/api/agent",
    [string]$PollUrl = "http://localhost:3000/api/log-requests/poll",
    [string]$UpdateUrl = "http://localhost:3000/api/log-requests"
)

# Administrator Check
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[!] CRITICAL: This Background Agent MUST be 'Run as Administrator'." -ForegroundColor Red
    exit
}

Write-Host "Initializing HRIP Background Agent for $Email..." -ForegroundColor Cyan
Write-Host "[*] Verifying & Enabling Windows Security Audit Policies..." -ForegroundColor Yellow
try {
    auditpol /set /subcategory:"Process Creation" /success:enable | Out-Null
    auditpol /set /subcategory:"Logon" /success:enable | Out-Null
    Write-Host "    -> Auditing successfully enforced." -ForegroundColor Green
} catch {}

$noisyProcs = @(
    "svchost.exe", "conhost.exe", "RuntimeBroker.exe", "SearchIndexer.exe",
    "backgroundTaskHost.exe", "taskhostw.exe", "WmiPrvSE.exe", "sppsvc.exe",
    "ctfmon.exe", "dllhost.exe", "SearchHost.exe", "StartMenuExperienceHost.exe",
    "SearchProtocolHost.exe", "SearchFilterHost.exe", "audiodg.exe", "spoolsv.exe",
    "MoUsoCoreWorker.exe", "ApplicationFrameHost.exe", "smartscreen.exe", "wmiprvse.exe",
    "compattelrunner.exe", "msmpeng.exe", "csrss.exe", "winlogon.exe", "lsass.exe",
    "services.exe", "smss.exe", "explorer.exe", "fontdrvhost.exe"
)

Write-Host "[*] Entering Background Polling Mode (Interval: 5s)..." -ForegroundColor Magenta
Write-Host "    Waiting for authorization from employee portal..." -ForegroundColor Gray

while ($true) {
    Start-Sleep -Seconds 5
    
    try {
        $pollEndpoint = "$PollUrl`?email=$Email"
        $pollRes = Invoke-RestMethod -Uri $pollEndpoint -Method Get -ErrorAction Stop
        
        $req = $pollRes.request
        if ($null -eq $req) {
            continue
        }
        
        $reqId = $req.id
        $startTimeStr = $req.startTime
        $endTimeStr = $req.endTime
        
        $startTime = [datetime]::Parse($startTimeStr)
        $endTime = [datetime]::Parse($endTimeStr)
        
        Write-Host "`n[!] AUTHORIZATION RECEIVED!" -ForegroundColor Green
        Write-Host "    Performing targeted forensic audit from $startTime to $endTime..." -ForegroundColor Yellow
        
        $logs = @()
        
        # 1. Query Logons in timeframe
        $logons = $null
        try {
            $logons = Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624; StartTime=$startTime; EndTime=$endTime} -ErrorAction Stop |
                      Where-Object { $_.Properties[8].Value -in @(2, 11) -and $_.Properties[5].Value -notmatch "^DWM-|^UMFD-|^$" }
        } catch {}
                  
        if ($logons -ne $null) {
            foreach ($logon in $logons) {
                $username = $logon.Properties[5].Value
                $time = $logon.TimeCreated.ToString("yyyy-MM-dd HH:mm:ss")
                $logs += @{ type = "history"; message = "[HIST] [$time] Interactive Logon by '$username'"; timestamp = $logon.TimeCreated.ToString("o") }
                
                # Get Processes following this logon within the allowed timeframe (max 15 mins after logon)
                $procEndTime = $logon.TimeCreated.AddMinutes(15)
                if ($procEndTime -gt $endTime) { $procEndTime = $endTime }
                
                $procs = $null
                try {
                    $procs = Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688; StartTime=$logon.TimeCreated; EndTime=$procEndTime} -ErrorAction Stop
                } catch {}
                $appSet = @{}
                
                if ($procs -ne $null) {
                    foreach ($proc in $procs) {
                        $procPath = $proc.Properties[5].Value
                        if ([string]::IsNullOrWhiteSpace($procPath)) { continue }
                        
                        $procName = Split-Path $procPath -Leaf
                        if (($procName -notin $noisyProcs) -and ($procPath -match "\\Program Files|\\AppData\\Local|\\WindowsPowerShell")) {
                            if (-not $appSet.ContainsKey($procName)) {
                                $appSet[$procName] = $true
                                $logs += @{ type = "history"; message = "  ↳ Launched application: $procName"; timestamp = $proc.TimeCreated.ToString("o") }
                            }
                        }
                    }
                }
            }
        }
        
        # Transmit logs
        Write-Host "[+] Extracted $($logs.Count) targeted records. Transmitting..." -ForegroundColor Green
        if ($logs.Count -eq 0) {
            $logs += @{ type = "history"; message = "[HIST] No user activity found in this timeframe." }
        }
        
        $payload = @{ email = $Email; logs = $logs } | ConvertTo-Json -Depth 5
        Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $payload -ContentType "application/json" -ErrorAction Stop | Out-Null
        
        # Mark as completed
        Write-Host "[*] Marking request as completed..." -ForegroundColor Yellow
        $updatePayload = @{ status = "COMPLETED" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$UpdateUrl/$reqId" -Method Patch -Body $updatePayload -ContentType "application/json" -ErrorAction Stop | Out-Null
        
        Write-Host "[+] Audit complete! Returning to sleep..." -ForegroundColor Gray
        
    } catch {
        Write-Host "[-] Agent Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.CategoryInfo.Reason -eq 'ObjectNotFound' -or $_.Exception.Message -match "No events were found") {
            # This is just Get-WinEvent finding nothing. We shouldn't crash the whole loop.
            Write-Host "    (No events found. Continuing to mark request as completed...)" -ForegroundColor DarkYellow
            
            # Still mark as completed so we don't infinitely loop
            try {
                $updatePayload = @{ status = "COMPLETED" } | ConvertTo-Json
                Invoke-RestMethod -Uri "$UpdateUrl/$reqId" -Method Patch -Body $updatePayload -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
            } catch {}
        }
        Start-Sleep -Seconds 2
    }
}
