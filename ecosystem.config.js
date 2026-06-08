module.exports = {
  apps: [
    {
      name: "bilibili-ordersong-plugin",
      script: "app.js",
      // 运行环境
      env: {
        NODE_ENV: "production",
      },
      // 自动重启
      autorestart: true,
      // 监听文件变化（开发时可启用，生产环境建议关闭）
      watch: false,
      // 最大内存限制，超过则重启
      max_memory_restart: "256M",
      // 错误日志路径
      error_file: "logs/error.log",
      // 输出日志路径
      out_file: "logs/out.log",
      // 合并日志
      merge_logs: true,
      // 日志时间格式
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      // 实例数量（单实例即可）
      instances: 1,
      // 是否以集群模式运行
      exec_mode: "fork",
    },
  ],
};
