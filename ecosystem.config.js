module.exports = {
  apps: [
    {
      name: 'acasa-backend',
      cwd: './backend',
      script: 'dist/main.js',

      exec_mode: 'fork',
      instances: 1,

      env: {
        NODE_ENV: 'production',
      },

      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
    },
  ],
}
