# Erro "A project with the name android already exists"

O workspace tem dois projetos Android (`frontend/android` e `frontend-ponto/android`). Cada um já tem um nome único no `settings.gradle`:

- **frontend/android** → `rootProject.name = 'acasa-erp-android'`
- **frontend-ponto/android** → `rootProject.name = 'acasa-ponto-android'`

Se o IDE ainda mostrar "Duplicate root element android", é cache antigo. Faça:

## 1. Limpar cache do Java/Gradle no Cursor

1. **Ctrl+Shift+P** (paleta de comandos)
2. Digite: **Java: Clean Java Language Server Workspace**
3. Confirme **Restart and delete** (reinicia e apaga o cache)
4. Depois: **Developer: Reload Window**

## 2. (Opcional) Apagar pastas `.idea` dos Android

Se o erro continuar, feche o Cursor e apague as pastas `.idea` dos dois projetos Android. Na próxima abertura o IDE recria com os nomes corretos.

No PowerShell (na raiz do projeto):

```powershell
Remove-Item -Recurse -Force "acasa-erp\frontend\android\.idea" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "acasa-erp\frontend-ponto\android\.idea" -ErrorAction SilentlyContinue
```

Depois abra de novo o Cursor e deixe o Gradle reimportar.

## 3. Conferir pelo terminal

Para confirmar que o build está ok (sem depender do IDE):

```bash
cd "d:\Sistema ERP\acasa-erp\frontend\android"
./gradlew assembleRelease

cd "d:\Sistema ERP\acasa-erp\frontend-ponto\android"
./gradlew assembleRelease
```

Se os dois rodarem sem erro, o problema é só de exibição/cache do IDE.
