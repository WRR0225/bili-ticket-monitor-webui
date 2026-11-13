import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const releaseDir = path.join(root, 'release');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

// 产物名前缀沿用 GitHub 上已有 release 的命名
const ARTIFACT = 'bili-ticket-monitor-webui';
const zipName = `${ARTIFACT}-v${pkg.version}.zip`;
const zipPath = path.join(root, zipName);

function run(cmd, cwd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

// Node 24 的 fs.cpSync(recursive) 在部分 Windows 环境会直接让进程退出，改用逐文件拷贝
function copyTree(from, to) {
  if (fs.statSync(from).isFile()) {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    return;
  }
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    copyTree(path.join(from, entry.name), path.join(to, entry.name));
  }
}

function copy(from, to, label) {
  if (!fs.existsSync(from)) throw new Error(`缺少 ${label}: ${from}`);
  copyTree(from, to);
  console.log(`  copied ${path.relative(root, to)}`);
}

function sizeBytes(p) {
  const st = fs.statSync(p);
  if (!st.isDirectory()) return st.size;
  let total = 0;
  for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
    total += sizeBytes(path.join(p, entry.name));
  }
  return total;
}

const mb = (p) => (sizeBytes(p) / 1048576).toFixed(1);

console.log(`\n[1/5] 构建前端产物`);
run('npm run build', root);

console.log(`\n[2/5] 重建 release 目录`);
fs.rmSync(releaseDir, { recursive: true, force: true });
fs.mkdirSync(path.join(releaseDir, 'runtime'), { recursive: true });
copy(path.join(root, 'dist'), path.join(releaseDir, 'dist'), '前端产物 dist');
copy(path.join(root, 'server'), path.join(releaseDir, 'server'), '后端 server');
copy(path.join(root, 'package.json'), path.join(releaseDir, 'package.json'), 'package.json');
copy(path.join(root, 'package-lock.json'), path.join(releaseDir, 'package-lock.json'), 'package-lock.json');
copy(path.join(root, '启动余票监控_Windows.bat'), path.join(releaseDir, '启动余票监控_Windows.bat'), 'Windows 启动脚本');

console.log(`\n[3/5] 安装生产依赖（需要联网）`);
run('npm ci --omit=dev', releaseDir);

console.log(`\n[4/5] 内置 Node.js 运行时`);
const nodeExe = process.execPath;
copy(nodeExe, path.join(releaseDir, 'runtime', 'node.exe'), '当前 Node.js 可执行文件');

console.log(`\n[5/5] 压缩产物`);
fs.rmSync(zipPath, { force: true });
const psCmd =
  `Compress-Archive -Path '${releaseDir}\\*' -DestinationPath '${zipPath}' -CompressionLevel Optimal -Force`;
run(`powershell -NoProfile -NonInteractive -Command "${psCmd}"`, root);

console.log(`\n完成`);
console.log(`  release 目录 : ${mb(releaseDir)} MB`);
console.log(`  压缩包       : ${mb(zipPath)} MB  ->  ${zipName}`);
