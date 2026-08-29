# FlowPay Production Monitoring

FlowPay maintains a real-time operations dashboard to monitor system health, detect blockchain failures, and debug API issues.

### Architecture
We utilize a unified logging utility (`src/lib/logger.ts`) that writes standard logs asynchronously to the central SQLite database (for MVP) or external logging services in production (e.g. Datadog). 

### What We Monitor
- **Frontend**: JavaScript exceptions, unhandled promises, transaction UX drops.
- **Backend**: Next.js API route 500s, DB latency, missing fields.
- **Blockchain**: Contract invocation failures (`HostError`), RPC simulation rejections, indexing timeouts.

### PII & Secrets Policy
The `logger.ts` utility runs a recursive redaction algorithm *before* any payload leaves the execution context.
- **NEVER LOGGED**: Private keys, network passphrases, wallet seed phrases, user emails.
- If a payload key contains `secret`, `private`, `key`, or `seed`, its value is automatically replaced with `[REDACTED]`.

### Dashboard Verification
To verify the monitoring system is capturing client-side errors:
1. Navigate to `/monitoring`
2. Click the "Trigger Test Error" button
3. The dashboard will instantly update, showcasing a real-time `error` log from the `frontend` context.
