const fs = require('fs'); let data = fs.readFileSync('frontend/src/services/navigation.js', 'utf8'); data = data.replace(/name: 'Agenda'[\\s\\S]*?]/, \
ame: 'Fluxo Logístico', href: '/agendamentos/kanban'\); fs.writeFileSync('frontend/src/services/navigation.js', data);
