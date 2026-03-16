import { spawnSync } from 'node:child_process'

const portArg = process.argv[2]
const port = Number(portArg)

if (!Number.isInteger(port) || port <= 0) {
  console.error('Invalid port provided')
  process.exit(1)
}

const isWsl = Boolean(process.env.WSL_DISTRO_NAME)
const shellCandidates = process.platform === 'win32' || isWsl
  ? ['powershell.exe', 'powershell']
  : ['pwsh', 'powershell']

const powerShellScript = [
  `$pids = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`,
  'if ($pids) {',
  '  foreach ($procId in $pids) {',
  '    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue',
  '  }',
  `  Write-Output 'Freed port ${port}'`,
  '} else {',
  `  Write-Output 'Port ${port} already free'`,
  '}',
].join('; ')

let lastError = null

for (const shell of shellCandidates) {
  const result = spawnSync(shell, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', powerShellScript], {
    stdio: 'inherit',
  })

  if (!result.error) {
    process.exit(result.status ?? 0)
  }

  lastError = result.error
}

if (lastError) {
  console.error(`Unable to run a PowerShell command to free port ${port}: ${lastError.message}`)
}

process.exit(1)