/**
 * PM2 Ecosystem Configuration for Production deployment
 * This file manages the lifecycle of both the Rexion platform backend and the Apply Flow microservice.
 * Run using: npx pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: 'rexion-backend',
      script: 'server.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: './backend/logs/err.log',
      out_file: './backend/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'apply-flow-agent',
      script: 'server.js',
      cwd: './agents/apply-flow-agent',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './agents/apply-flow-agent/logs/err.log',
      out_file: './agents/apply-flow-agent/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'rexeditzz-insta-agent',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'src/index.ts',
      cwd: './agents/rexeditzz-insta-agent',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'development',
        PORT: 3004
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3004
      },
      error_file: './agents/rexeditzz-insta-agent/logs/err.log',
      out_file: './agents/rexeditzz-insta-agent/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
