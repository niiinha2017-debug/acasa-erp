import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import os from 'os';

function isRunningOnWsl() {
  return process.platform === 'linux' && os.release().toLowerCase().includes('microsoft');
}

function resolveWindowsHostForWsl() {
  try {
    const resolvConf = readFileSync('/etc/resolv.conf', 'utf8');
    const nameserverLine = resolvConf
      .split(/\r?\n/)
      .find((line) => line.startsWith('nameserver '));

    return nameserverLine?.replace('nameserver ', '').trim();
  } catch {
    return undefined;
  }
}

function resolvePrismaDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || !isRunningOnWsl()) {
    return databaseUrl;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    return databaseUrl;
  }

  if (!['127.0.0.1', 'localhost'].includes(parsedUrl.hostname)) {
    return databaseUrl;
  }

  const windowsHost = resolveWindowsHostForWsl();

  if (!windowsHost) {
    return databaseUrl;
  }

  parsedUrl.hostname = windowsHost;
  process.env.DB_HOST = windowsHost;
  process.env.DATABASE_URL = parsedUrl.toString();

  return process.env.DATABASE_URL;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const databaseUrl = resolvePrismaDatabaseUrl();

    super(
      databaseUrl
        ? {
            datasources: {
              db: {
                url: databaseUrl,
              },
            },
          }
        : undefined,
    );
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
