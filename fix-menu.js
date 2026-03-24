const fs = require('fs'); let code = fs.readFileSync('acasa-erp/frontend/src/layouts/Menu.vue', 'utf8'); if (!code.includes('Fila Operacional')) { code = code.replace('<MenuLink label=\
Clientes\ to=\/clientes\ icon=\pi
pi-users\ />', '<MenuLink label=\Fila
Operacional\ to=\/agendamentos/kanban\ icon=\pi
pi-clone\ />\\n        <MenuLink label=\Clientes\ to=\/clientes\ icon=\pi
pi-users\ />'); fs.writeFileSync('acasa-erp/frontend/src/layouts/Menu.vue', code, 'utf8'); }
