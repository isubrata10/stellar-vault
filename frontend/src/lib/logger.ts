export type LogLevel = 'info' | 'warn' | 'error' | 'fatal';
export type LogContext = 'frontend' | 'backend' | 'blockchain';

// Redact sensitive keys
const redact = (data: any): any => {
  if (!data) return data;
  if (typeof data !== 'object') return data;
  const clone = { ...data };
  const sensitiveKeys = ['secret', 'private', 'password', 'token', 'key', 'seed'];
  for (const k of Object.keys(clone)) {
    if (sensitiveKeys.some(sk => k.toLowerCase().includes(sk))) {
      clone[k] = '[REDACTED]';
    } else if (typeof clone[k] === 'object') {
      clone[k] = redact(clone[k]);
    }
  }
  return clone;
};

export const logEvent = async (level: LogLevel, context: LogContext, message: string, metadata?: any) => {
  const redactedMetadata = redact(metadata);
  
  if (typeof window === 'undefined') {
    // Server-side logging
    const { prisma } = require('./prisma');
    try {
      await prisma.systemLog.create({
        data: {
          level,
          context,
          message,
          metadata: redactedMetadata ? JSON.stringify(redactedMetadata) : null,
        }
      });
      console.log(`[${level.toUpperCase()}] [${context}] ${message}`);
    } catch (e) {
      console.error('CRITICAL: Failed to write to SystemLog', e);
    }
  } else {
    // Client-side logging sends to API
    try {
      fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, context, message, metadata: redactedMetadata })
      }).catch(() => {});
    } catch (e) {
      console.error('Client logger failed');
    }
  }
};
