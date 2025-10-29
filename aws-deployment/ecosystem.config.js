// PM2 Ecosystem Configuration for TaxGuard AI
// This file manages all Node.js services

module.exports = {
  apps: [
    {
      name: 'blockchain',
      cwd: '/var/www/taxguard/blockchain',
      script: 'index.js', // or 'server.js' - check your blockchain entry point
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/www/taxguard/logs/blockchain-error.log',
      out_file: '/var/www/taxguard/logs/blockchain-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'whistlepro',
      cwd: '/var/www/taxguard/whistlepro_backend',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 3005
      },
      error_file: '/var/www/taxguard/logs/whistlepro-error.log',
      out_file: '/var/www/taxguard/logs/whistlepro-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'ocr-backend',
      cwd: '/var/www/taxguard/ocr-backend',
      script: 'server.js', // or 'index.js' - check your OCR backend entry point
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '250M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: '/var/www/taxguard/logs/ocr-backend-error.log',
      out_file: '/var/www/taxguard/logs/ocr-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'api-gateway',
      cwd: '/var/www/taxguard/api-gateway',
      script: 'server.js', // or 'index.js' - check your API gateway entry point
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 4001
      },
      error_file: '/var/www/taxguard/logs/api-gateway-error.log',
      out_file: '/var/www/taxguard/logs/api-gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'ocr-ai-service',
      cwd: '/var/www/taxguard/ai-service',
      script: 'server.js', // or 'index.js' - check your AI service entry point
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/www/taxguard/logs/ocr-ai-error.log',
      out_file: '/var/www/taxguard/logs/ocr-ai-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
