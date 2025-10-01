const { exec } = require('child_process');

console.log('启动网易云音乐 API 服务...');

// 执行 npx 命令
const child = exec('npx NeteaseCloudMusicApi@latest', {
  cwd: process.cwd()
});

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

child.on('close', (code) => {
  console.log(`服务退出，代码: ${code}`);
});