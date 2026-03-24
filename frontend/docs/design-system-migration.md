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

## Responsabilidade de cada camada

- `design-system.css` e a base oficial para tokens e padroes reutilizaveis do produto.
- Componentes e paginas continuam tendo CSS proprio para estrutura, contexto e variacoes locais.
- A decisao nao e "design-system ou componente", e sim "o que merece virar padrao global e o que deve permanecer local".

## O que sobe para o design system

- Tokens globais: cor, espaco, radius, sombra, tipografia, alturas de controles.
- Blocos reutilizaveis: `ds-btn`, `ds-card`, `ds-input`, `ds-badge`, `ds-header`.
- Variacoes previsiveis de um mesmo padrao: `--primary`, `--secondary`, `--danger`, `--sm`, `--lg`.
- Estados visuais compartilhados entre varias telas: hover, active, disabled, loading, selected.

## O que fica no componente ou pagina

- Layout especifico de fluxo: grid, agrupamentos, regioes e alinhamentos de uma tela.
- Classes semanticas de contexto, como cabecalho de modulo, sidebar de tela ou secoes exclusivas.
- Ajustes que aparecem em um unico fluxo e ainda nao provaram reutilizacao.
- Composicao final das classes globais com detalhes locais.

## Convencao de nomenclatura

- `ds-*`: classe global e reutilizavel do design system.
- `ds-<bloco>--<variacao>`: variacao previsivel do bloco global.
- `<componente>-*` ou `<pagina>-*`: classe local semantica de componente ou pagina.
- Evitar nomes puramente visuais em classes locais quando houver contexto de negocio melhor.

## Matriz de decisao rapida

- Se repete em varias telas, sobe para `design-system.css`.
- Se representa um elemento de interface reutilizavel, sobe para `design-system.css`.
- Se resolve apenas um layout de pagina ou fluxo, fica local no componente.
- Se a duvida existir, manter local primeiro e promover depois que a repeticao ficar clara.

## Uso de utilitarios durante a migracao

- Utilitarios podem continuar em pontos legados para evitar regressao.
- Em codigo novo, usar utilitarios apenas para layout simples e descartavel, como `flex`, `grid`, `gap` e `w-full`.
- Cores, estados, superficies, botoes, inputs e badges devem preferir classes semanticas.

## Proximos candidatos para migracao

1. Cadastro de fornecedor
2. Cadastro de produtos
3. Cabecalhos de listagem
4. Formularios comuns
