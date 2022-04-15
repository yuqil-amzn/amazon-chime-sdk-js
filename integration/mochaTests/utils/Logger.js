#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const CONSOLE_COLORS = {
  blue: '\x1b[34m%s\x1b[0m',
  green: '\x1b[32m%s\x1b[0m',
  red: '\x1b[31m%s\x1b[0m',
  white: '\x1b[37m%s\x1b[0m',
  yellow: '\x1b[33m%s\x1b[0m'
};

class Log {
  constructor(msg, logLevel)  {
    this.msg = msg;
    if(!logLevel) {
      this.logLevel = 'INFO';
    }
    this.logLevel = logLevel;
  }
}

class Logger {
  constructor(name, level = 'WARN') {
    this.logs = [];
    this.name = name;
    this.level = level;
  }

  async printLogs() {
    for(var i = 0; i < this.logs.length; i++) {
      this.log(this.logs[i].msg, this.logs[i].logLevel);
    }
  }

  pushLogs(log) {
    this.logs.push(log);
  }

  setLogLevel(level)  {
    this.level = level;
  }

  getLogLevel() {
    return this.level;
  }

  log(msg, logLevel) {
    if(!logLevel) {
      logLevel = this.level;
    }
    const timestamp = new Date();
    const logMessage = `${timestamp} [${logLevel}] ${this.name} - ${msg}`;

    switch (logLevel) {
      case 'ERROR':
        console.log(CONSOLE_COLORS.red, logMessage);
        break;
      case 'WARN':
        console.log(CONSOLE_COLORS.yellow, logMessage);
        break;
      case 'INFO':
        console.log(CONSOLE_COLORS.blue, logMessage);
        break;
    }
  }
}

module.exports = {
  Logger,
  CONSOLE_COLORS,
  Log
};