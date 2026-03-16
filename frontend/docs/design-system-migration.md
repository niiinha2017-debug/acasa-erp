# Design System Migration

## Estado atual

- O frontend ainda depende fortemente de classes utilitarias Tailwind espalhadas nas views.
- Remover Tailwind do build agora quebraria layouts, espacos, cores e responsividade em centenas de pontos.

## Estrategia segura

1. Criar tokens globais em CSS puro.
2. Criar classes semanticas globais para layout, superficies, formularios e acoes.
3. Migrar telas de maior valor para essas classes semanticas.
4. Reduzir o uso de utilitarias novas a zero.
5. So depois retirar Tailwind do pipeline de build.

## Camadas

- `tailwind.css`: camada de compatibilidade legada.
- `design-system.css`: nova base oficial do sistema.

## Regra pratica

- Novas telas e refactors relevantes devem preferir classes `ds-*` e CSS local semantico.
- Utilitarias Tailwind ficam apenas para manter compatibilidade durante a migracao.

## Proximos candidatos para migracao

1. Cadastro de fornecedor
2. Cadastro de produtos
3. Cabecalhos de listagem
4. Formularios comuns