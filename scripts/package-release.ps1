$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseRoot = Join-Path $projectRoot 'release'
$distRoot = Join-Path $projectRoot 'dist'
$apkPath = Join-Path $projectRoot 'apps/android/app/build/outputs/apk/debug/app-debug.apk'
$metadataPath = Join-Path $projectRoot 'apps/android/app/build/outputs/apk/debug/output-metadata.json'
$version = (Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version
$manifest = Get-Content -LiteralPath (Join-Path $distRoot 'manifest.json') -Raw | ConvertFrom-Json
$metadata = Get-Content -LiteralPath $metadataPath -Raw | ConvertFrom-Json
if ($manifest.version -ne $version -or $metadata.elements[0].versionName -ne $version) { throw 'Version mismatch. Rebuild both clients before packaging.' }
if (!(Test-Path -LiteralPath $apkPath)) { throw 'Build the Android debug APK first.' }
# Refuse to package a stale APK: compare its embedded page with the current build.
Add-Type -AssemblyName System.IO.Compression.FileSystem
$apkZip = [System.IO.Compression.ZipFile]::OpenRead($apkPath)
try {
    $entry = $apkZip.GetEntry('assets/public/index.html')
    if (!$entry) { throw 'APK does not contain the TermsWatch web build.' }
    if (!$apkZip.GetEntry('assets/public/ocr/lang/eng.traineddata')) { throw 'APK is missing the uncompressed Android OCR language asset.' }
    if (!$apkZip.GetEntry('assets/public/ocr/worker.min.js')) { throw 'APK is missing the OCR worker.' }
    $reader = [System.IO.StreamReader]::new($entry.Open())
    try { $apkIndex = $reader.ReadToEnd() } finally { $reader.Dispose() }
    if ($apkIndex -cne [System.IO.File]::ReadAllText((Join-Path $distRoot 'index.html'))) { throw 'APK web assets are stale. Run android:sync and assembleDebug.' }
} finally { $apkZip.Dispose() }
New-Item -ItemType Directory -Force -Path $releaseRoot | Out-Null
$extensionZip = Join-Path $releaseRoot "TermsWatch-v$version-extension.zip"
$websiteZip = Join-Path $releaseRoot "TermsWatch-v$version-website.zip"
$releaseApk = Join-Path $releaseRoot "TermsWatch-v$version-debug.apk"
$sourceZip = Join-Path $releaseRoot "TermsWatch-v$version-source.zip"
& node (Join-Path $PSScriptRoot 'package-web.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Website/extension packaging failed.' }
& node (Join-Path $PSScriptRoot 'package-source.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Source packaging failed.' }
Copy-Item -LiteralPath $apkPath -Destination $releaseApk -Force
$hashes = @($extensionZip, $websiteZip, $releaseApk, $sourceZip) | ForEach-Object {
    $hash = Get-FileHash -LiteralPath $_ -Algorithm SHA256
    "$($hash.Hash.ToLowerInvariant())  $([System.IO.Path]::GetFileName($_))"
}
[System.IO.File]::WriteAllLines((Join-Path $releaseRoot 'SHA256SUMS.txt'), $hashes)
Get-Item -LiteralPath $extensionZip, $websiteZip, $releaseApk, $sourceZip | Select-Object Name, Length
