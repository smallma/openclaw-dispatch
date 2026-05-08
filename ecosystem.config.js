require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'openclaw-dashboard',
      script: 'npm',
      args: 'start',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // 從 .env 讀入必要變數
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        WORKER_SECRET: process.env.WORKER_SECRET,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      }
    },
    {
      name: 'openclaw-worker',
      script: 'worker/index.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        WORKER_SECRET: process.env.WORKER_SECRET,
        OPENCLAW_PATH: process.env.OPENCLAW_PATH || 'openclaw',
      }
    }
  ]
};
