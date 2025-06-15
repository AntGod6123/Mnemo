#!/usr/bin/env node
const readline = require('readline');
const { spawn } = require('child_process');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

(async () => {
  let ip = process.env.HOST_IP;
  if (process.stdin.isTTY) {
    const prompt = ip ? `Enter backend host IP [${ip}]: ` : 'Enter backend host IP: ';
    const answer = await ask(prompt);
    if (answer.trim()) ip = answer.trim();
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
