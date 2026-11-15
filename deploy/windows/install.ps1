# Installs or updates Hadir on the Windows server from C:\hadir\release.tgz. Run as Administrator over ssh.
# Layout: C:\hadir\{app (replaced each deploy), .venv, data (SQLite, kept), hadir.env (secrets, kept), *-svc.*}
# Two services: "Hadir" (Python API, 127.0.0.1:3070) and "HadirWeb" (Node SSR, 127.0.0.1:3071). Both are WinSW,
# the same wrapper binary the Caddy service already uses.
$ErrorActionPreference = "Stop"
$root = "C:\hadir"
$services = @(@{ exe = "$root\hadir-svc.exe"; xml = "hadir-svc.xml"; url = "http://127.0.0.1:3070/api/health" },
              @{ exe = "$root\hadir-web-svc.exe"; xml = "hadir-web-svc.xml"; url = "http://127.0.0.1:3071/about" })
New-Item -ItemType Directory -Force -Path "$root\data" | Out-Null

foreach ($s in $services) { if (Test-Path $s.exe) { & $s.exe stop 2>&1 | Out-Null } }
Start-Sleep -Seconds 2
if (Test-Path "$root\app") { Remove-Item -Recurse -Force "$root\app" }
New-Item -ItemType Directory -Force -Path "$root\app" | Out-Null
tar -xzf "$root\release.tgz" -C "$root\app"
if ($LASTEXITCODE -ne 0) { throw "extract failed" }

if (-not (Test-Path "$root\.venv\Scripts\python.exe")) { & C:\Python311\python.exe -m venv "$root\.venv" }
& "$root\.venv\Scripts\python.exe" -m pip install --disable-pip-version-check -q -r "$root\app\backend\requirements.txt"
if ($LASTEXITCODE -ne 0) { throw "pip install failed" }

foreach ($s in $services) {
  Copy-Item -Force "$root\app\deploy\windows\$($s.xml)" ($s.exe -replace "\.exe$", ".xml")
  if (-not (Test-Path $s.exe)) {
    Copy-Item C:\Caddy\caddy-svc.exe $s.exe
    & $s.exe install
  }
  & $s.exe start
}
foreach ($s in $services) {
  $ok = $false
  for ($i = 0; $i -lt 30 -and -not $ok; $i++) {
    Start-Sleep -Seconds 1
    try { $ok = (Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 $s.url).StatusCode -eq 200 } catch {}
  }
  if ($ok) { "health ok: $($s.url)" } else { "health check failed: $($s.url)"; exit 1 }
}
