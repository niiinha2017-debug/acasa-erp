# Limpa containers, redes e (opcional) volumes/imagens para liberar portas no Windows.
# Uso: .\scripts\docker-limpar.ps1
# Para limpeza agressiva (remove também imagens e volumes não usados): .\scripts\docker-limpar.ps1 -Agressivo

param([switch]$Agressivo)

Set-Location $PSScriptRoot\..

Write-Host "Parando e removendo containers/redes do projeto..." -ForegroundColor Cyan
docker compose down -v

Write-Host "Removendo containers parados e redes nao utilizadas..." -ForegroundColor Cyan
docker container prune -f
docker network prune -f

if ($Agressivo) {
    Write-Host "Removendo volumes e imagens nao utilizados (pode demorar)..." -ForegroundColor Yellow
    docker volume prune -f
    docker image prune -a -f
}

Write-Host "Limpeza concluida. Portas 3000, 3307, 5173, 5174, 8080 devem estar livres." -ForegroundColor Green
