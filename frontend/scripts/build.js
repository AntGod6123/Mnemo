#!/usr/bin/env node
const os = require('os');
const dns = require('dns');
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

const fs = require('fs');
const { spawnSync } = require('child_process');

const getGatewayIp = () => {
  try {
    const lines = fs.readFileSync('/proc/net/route', 'utf8').trim().split('\n');
    for (const line of lines.slice(1)) {
      const parts = line.trim().split(/\s+/);
      if (parts[1] === '00000000') {
        const hex = parts[2];
        const ip = [3, 2, 1, 0]
          .map(i => parseInt(hex.substring(i * 2, i * 2 + 2), 16))
          .join('.');
        return ip;
      }
    }
  } catch (_) {}
  return null;
};

const getHostnameIp = () => {
  try {
    const { stdout, status } = spawnSync('sh', ['-c', "hostname -I | awk '{print $1}'"], { encoding: 'utf8' });
    if (status === 0) {
      const ip = stdout.trim().split(/\s+/)[0];
      if (ip) return ip;
    }
  } catch (_) {}
  return null;
};

const gatewayIp = getGatewayIp();
if (gatewayIp && !ips.includes(gatewayIp)) {
  console.log('Possible host IP: ' + gatewayIp);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (q) => new Promise(res => rl.question(q, res));

const lookupHostIp = () => new Promise(resolve => {
  dns.lookup('host.docker.internal', (err, address) => {
    if (!err && address) resolve(address);
    else resolve(null);
  });
});

(async () => {
  let ip = process.env.HOST_IP;
  if (!ip) {
    ip = await lookupHostIp();
  }
  if (!ip) {
    ip = getHostnameIp();
  }
  if (!ip) {
    ip = gatewayIp;
  }
  if (!ip && process.stdin.isTTY) {
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
