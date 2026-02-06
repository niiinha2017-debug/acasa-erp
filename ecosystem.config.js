module.exports = {
  apps: [
    {
      name: 'acasa-backend',
      cwd: '/home/ec2-user/acasa-erp/backend',
      // Ajustado para o caminho padrão do NestJS
      script: 'dist/main.js', 
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
      // Logs ajudam a ver por que quebrou sem precisar dar tail manual
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};