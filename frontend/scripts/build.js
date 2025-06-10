#!/usr/bin/env node
const os = require('os');
const readline = require('readline');
const { spawn } = require('child_process');

const nets = os.networkInterfaces();
const ips = [];
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    if (net.family === 'IPv4' && !net.internal) {
      ips.push(net.address);
    }
  }
}
if (ips.length) {
  console.log('Detected local IP addresses:');
  ips.forEach(ip => console.log(' - ' + ip));
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (q) => new Promise(res => rl.question(q, res));

(async () => {
  let ip = process.env.HOST_IP;
  if (!ip) {
    ip = (await ask('Enter backend host IP (default 127.0.0.1): ')).trim();
  }
  rl.close();
  if (!ip) ip = '127.0.0.1';
  const url = `http://${ip}:8000`;
  console.log(`Using backend URL: ${url}`);
  const child = spawn('npm', ['run', 'build:actual'], {
    env: { ...process.env, VITE_BACKEND_URL: url },
    stdio: 'inherit',
    shell: true
  });
  child.on('exit', code => process.exit(code ?? 0));
})();
