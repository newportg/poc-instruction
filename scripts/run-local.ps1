param(
    [ValidateRange(1, 65535)]
    [int]$ClientPort = 5176
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$clientSource = Join-Path $repoRoot "src"
$staticServer = Join-Path $PSScriptRoot "serve-client.js"
$staticProcess = $null
$temporaryDirectory = Join-Path ([System.IO.Path]::GetTempPath()) "poc-instruction-local-$([guid]::NewGuid().ToString('N'))"

try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw "Node.js was not found. Install Node.js to serve the browser client locally."
    }

    if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
        if (Get-NetTCPConnection -LocalPort $ClientPort -State Listen -ErrorAction SilentlyContinue) {
            throw "Client port $ClientPort is already in use. Choose another port with -ClientPort."
        }
    }

    New-Item -ItemType Directory -Path $temporaryDirectory | Out-Null
    $clientDirectory = Join-Path $temporaryDirectory "client"
    Copy-Item -Path $clientSource -Destination $clientDirectory -Recurse

    $stdoutLog = Join-Path $temporaryDirectory "client-server.out.log"
    $stderrLog = Join-Path $temporaryDirectory "client-server.err.log"
    $staticProcess = Start-Process -FilePath "node" `
        -ArgumentList @("`"$staticServer`"", "`"$clientDirectory`"", "$ClientPort") `
        -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog `
        -PassThru -WindowStyle Hidden

    $clientUrl = "http://127.0.0.1:$ClientPort/"
    $clientReady = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        try {
            if ($staticProcess.HasExited) {
                break
            }
            $clientResponse = Invoke-WebRequest -Uri $clientUrl -TimeoutSec 2 -UseBasicParsing
            if ($clientResponse.Content -match "Instruction Explorer") {
                $clientReady = $true
                break
            }
        } catch {
            Start-Sleep -Milliseconds 250
        }
    }
    if (-not $clientReady) {
        if (Test-Path $stderrLog) {
            Get-Content -LiteralPath $stderrLog
        }
        throw "The POC Instruction client did not start correctly at $clientUrl."
    }

    Write-Host "POC Instruction client: $clientUrl"
    Write-Host "Press Enter to stop the local client."
    Start-Process $clientUrl
    Read-Host | Out-Null
} catch {
    Write-Error $_
    exit 1
} finally {
    if ($staticProcess -and -not $staticProcess.HasExited) {
        Stop-Process -Id $staticProcess.Id -Force
    }
    if (Test-Path $temporaryDirectory) {
        Remove-Item -LiteralPath $temporaryDirectory -Recurse -Force
    }
}
