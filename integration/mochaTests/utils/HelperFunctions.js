#!/usr/bin/env node
const { spawnSync, spawn } = require('child_process');

const green = '\x1b[32m%s\x1b[0m';
const red = '\x1b[31m%s\x1b[0m';

// Run the command asynchronously without blocking the Node.js event loop.
function runAsync(command, args, options) {
  options = {
    ...options,
    shell: true
  };
  const child = spawn(command, args, options);

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (data) => {
    console.log(data);
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (error) => {
    console.log(red, error);
  });

  child.on('close', (code) => {
    console.log(red, `Command ${command} exited with ${code}`);
  });

  return child.pid;
}

// Run the command synchronously with blocking the Node.js event loop
// until the spawned process either exits or is terminated.
function runSync(command, args, options, printOutput = true) {
  options = {
    ...options,
    shell: true
  };
  const child = spawnSync(command, args, options);

  const output = child.stdout.toString();
  if (printOutput) {
    console.log(output);
  }

  if (child.error) {
    console.log(red, `Command ${command} failed with ${child.error.code}`);
  }

  if (child.status !== 0) {
    console.log(red, `Command ${command} failed with exit code ${child.status} and signal ${child.signal}`);
    console.log(red, child.stderr.toString());
  }

  return output;
}

module.exports = {
  runAsync,
  runSync
}