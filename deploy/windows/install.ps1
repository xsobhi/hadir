# Installs or updates Hadir on the Windows server from C:\hadir\release.tgz. Run as Administrator over ssh.
# Layout: C:\hadir\{app (replaced each deploy), .venv, data (SQLite, kept), hadir.env (secrets, kept), hadir-svc.*}
$ErrorActionPreference = "Stop"
$root = "C:\hadir"
$svc = Join-Path $root "hadir-svc.exe"
New-Item -ItemType Directory -Force -Path "$root\data" | Out-Null

if (Test-Path $svc) { & $svc stop 2>&1 | Out-Null; Start-Sleep -Seconds 2 }
if (Test-Path "$root\app") { Remove-Item -Recurse -Force "$root\app" }
New-Item -ItemType Directory -Force -Path "$root\app" | Out-Null
tar -xzf "$root\release.tgz" -C "$root\app"
if ($LASTEXITCODE -ne 0) { throw "extract failed" }

if (-not (Test-Path "$root\.venv\Scripts\python.exe")) { & C:\Python311\python.exe -m venv "$root\.venv" }
& "$root\.venv\Scripts\python.exe" -m pip install --disable-pip-version-check -q -r "$root\app\backend\requirements.txt"
if ($LASTEXITCODE -ne 0) { throw "pip install failed" }

# The service wrapper is WinSW, the same binary the Caddy service already uses.
Copy-Item -Force "$root\app\deploy\windows\hadir-svc.xml" "$root\hadir-svc.xml"
if (-not (Test-Path $svc)) {
  Copy-Item C:\Caddy\caddy-svc.exe $svc
  & $svc install
}
& $svc start
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 http://127.0.0.1:3070/api/health; if ($r.StatusCode -eq 200) { "health ok"; exit 0 } } catch {}
}
"health check failed"; exit 1
