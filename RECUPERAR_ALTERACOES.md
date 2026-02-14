# Recuperar alterações do backup (stash)

Foi encontrado um **stash** no Git com o nome:
`backup antes de voltar para 3d2a519`
Esse stash pode conter as alterações de layout que não estão aparecendo.

## Passos para recuperar

Abra o terminal na pasta do projeto (acasa-erp) e execute:

### 1. Ver o que tem no backup
```
git stash show stash@{0} --name-only
```

### 2. Aplicar o backup
```
git stash apply stash@{0}
```
Se der conflito, o Git avisa em quais arquivos. Resolva com cuidado.

### 3. Salvar de vez (commit)
```
git add .
git commit -m "recuperar: layout padronizado do backup"
```

## Rodar o Tauri para ver as alterações

Sempre a partir da pasta frontend:
```
cd frontend
npm run tauri:dev
```
Ou na raiz do acasa-erp: `npm run tauri:dev` (o script já faz cd frontend).

Em modo dev o Tauri usa localhost:5173, não o dist antigo.
