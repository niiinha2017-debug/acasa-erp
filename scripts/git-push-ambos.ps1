# Envia a branch atual para GitLab (origin) e GitHub.
# Uso no PowerShell: .\scripts\git-push-ambos.ps1
$branch = git branch --show-current
Write-Host "Enviando branch '$branch' para GitLab e GitHub..."
git push origin $branch
git push github $branch
Write-Host "Concluído: GitLab e GitHub atualizados."
