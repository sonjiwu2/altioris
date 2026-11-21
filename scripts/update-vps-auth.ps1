param(
    [Parameter(Mandatory)][string]$VpsIp,
    [ValidateRange(1, 65535)][int]$Port = 22,
    [string]$KeyPath = "$env:USERPROFILE\.ssh\altioris_vps"
)

$ErrorActionPreference = 'Stop'
$parsedIp = $null
if ($VpsIp -notmatch '^(?:\d{1,3}\.){3}\d{1,3}$' -or
    -not [System.Net.IPAddress]::TryParse($VpsIp, [ref]$parsedIp)) {
    throw 'Enter the public IPv4 address of the VPS.'
}

$root = Split-Path -Parent $PSScriptRoot
$upload = @(
    (Join-Path $root 'server\index.mjs'),
    (Join-Path $root 'server\store.mjs'),
    (Join-Path $PSScriptRoot 'update-vps-auth.sh')
)
foreach ($file in @($KeyPath) + $upload) {
    if (!(Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing file: $file" }
}

$stage = '/root/altioris-auth-update-' + [guid]::NewGuid().ToString('N')
$target = "root@$($parsedIp.IPAddressToString)"
& ssh -p $Port -i $KeyPath -o IdentitiesOnly=yes $target "install -d -m 0700 '$stage'"
if ($LASTEXITCODE -ne 0) { throw 'SSH connection failed. Check the VPS address and SSH key.' }

& scp -P $Port -i $KeyPath -o IdentitiesOnly=yes @upload "${target}:$stage/"
if ($LASTEXITCODE -ne 0) { throw "Upload failed. VPS staging directory: $stage" }

& ssh -p $Port -i $KeyPath -o IdentitiesOnly=yes $target "sed -i 's/\r`$//' '$stage/update-vps-auth.sh' && bash '$stage/update-vps-auth.sh' && rm -f -- '$stage/index.mjs' '$stage/store.mjs' '$stage/update-vps-auth.sh' && rmdir -- '$stage'"
if ($LASTEXITCODE -ne 0) { throw "Update failed. VPS staging directory: $stage" }
