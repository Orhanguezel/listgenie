module.exports = {
  apps: [
    {
      name: "listsgenie-api",
      script: "./src/index.js",
      cwd: "/var/www/listsgenie",
      instances: "max",              // ya da sabit bir sayı
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "600M",
      kill_timeout: 10000,
      listen_timeout: 10000,
      autorestart: true,
      env: {
        NODE_ENV: "production"
      },
      env_production: {
        NODE_ENV: "production"
      },
      out_file: "/var/log/pm2/listsgenie-out.log",
      error_file: "/var/log/pm2/listsgenie-err.log",
      merge_logs: true,
      time: true
    }
  ],
  deploy: {
    // (opsiyonel) pm2 deploy kullanacaksan burayı sonra doldururuz
  }
};
