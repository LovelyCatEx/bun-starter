import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

import { config } from '../config';

/**
 * The only way a log line leaves this server: tagged, to stdout (stderr for `error`), and
 * appended best-effort to a per-tag file under `LOG_DIR`. See `.claude/rules/backend.md`「日志」.
 */

/** The log levels, in the order they narrow to. Mirrors the method names. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * The tag of a line about the process rather than a feature: startup, a fatal handler,
 * configuration no request has touched yet. A named sentinel rather than an optional
 * parameter — an optional tag is what would let a feature's line pose as a global one.
 */
export const SYSTEM_TAG = 'system';

/**
 * The tag turned into a file name: lower-cased, every run of characters that is not a letter
 * or a digit collapsed into one `-`. Tags come from call sites, so they are not trusted with
 * a path — `auth/token` or `..` must not name a directory or escape `LOG_DIR`.
 */
function fileNameOf(tag: string): string {
  const slug = tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug === '' ? SYSTEM_TAG : slug;
}

/** One tag's file. Kept out of the database directory so logs are removable alone. */
function logFile(tag: string): string {
  return path.join(config.logDir, `${fileNameOf(tag)}.log`);
}

/**
 * Whether the file copy has already been given up on. The directory is normally made once by
 * `LogService.init()`; if that failed, retrying per line would turn one failed write into
 * thousands, so this latches off — the stdout copy still lands.
 */
let fileLogging = false;

/** A value rendered as one line: an Error as its stack, anything else as JSON. */
function render(value: unknown): string {
  if (value instanceof Error) {
    return value.stack ?? `${value.name}: ${value.message}`;
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    // `JSON.stringify` returns undefined for values with no JSON form (a
    // function, a symbol) and throws on a circular one — both fall back.
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/** The parts of one line, joined by spaces, with no tag repeated in the body. */
function messageOf(parts: unknown[]): string {
  return parts.map(render).join(' ');
}

function emit(level: LogLevel, tag: string, parts: unknown[]): void {
  const line = `${new Date().toISOString()} ${level.toUpperCase()} [${tag}] ${messageOf(parts)}\n`;

  if (level === 'error') {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }

  if (!fileLogging) {
    return;
  }

  try {
    appendFileSync(logFile(tag), line);
  } catch {
    // Best-effort: the stdout copy above is the line of record. Giving up for
    // good here rather than retrying per line, for the reason on `fileLogging`.
    fileLogging = false;
  }
}

export class LogService {
  /** Creates `LOG_DIR`. Best-effort, and called once at startup, before the first line. */
  static init(): void {
    try {
      mkdirSync(config.logDir, { recursive: true });
      fileLogging = true;
    } catch (error) {
      process.stderr.write(
        `[log] file logging disabled, cannot create ${config.logDir}: ${String(error)}\n`,
      );
    }
  }

  static debug(tag: string, ...parts: unknown[]): void {
    emit('debug', tag, parts);
  }

  static info(tag: string, ...parts: unknown[]): void {
    emit('info', tag, parts);
  }

  static warn(tag: string, ...parts: unknown[]): void {
    emit('warn', tag, parts);
  }

  static error(tag: string, ...parts: unknown[]): void {
    emit('error', tag, parts);
  }
}
