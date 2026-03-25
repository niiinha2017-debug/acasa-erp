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

/** Erros típicos quando MySQL/Podman ainda não subiu (boot ou `podman compose up`). */
function isRetryableDbInitError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  if (e.code === 'P1001') return true;
  const m = String(e.message || '');
  if (m.includes("Can't reach database server")) return true;
  if (m.includes('ECONNREFUSED')) return true;
  if (m.includes('ETIMEDOUT')) return true;
  return false;
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
    const maxAttempts = Math.max(
      1,
      parseInt(process.env.PRISMA_CONNECT_RETRIES || '40', 10) || 40,
    );
    const delayMs = Math.max(
      500,
      parseInt(process.env.PRISMA_CONNECT_RETRY_MS || '2500', 10) || 2500,
    );

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        if (attempt > 1) {
          console.log(
            `Prisma: conexão com o banco estabelecida (tentativa ${attempt}/${maxAttempts}).`,
          );
        }
        return;
      } catch (err) {
        const retry = isRetryableDbInitError(err) && attempt < maxAttempts;
        if (!retry) {
          throw err;
        }
        console.warn(
          `Prisma: banco indisponível — nova tentativa em ${delayMs / 1000}s (${attempt}/${maxAttempts}).`,
        );
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
