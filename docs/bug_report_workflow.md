# Bug Report Workflow

If a user uncovers a bug during their 5-Minute Validation Test, follow this triage flow:

1. **Check System Logs:**
   Go to `/monitoring` on the dashboard. Check for `ERROR` or `FATAL` logs correlated with the user's timestamp.
   
2. **Identify the Layer:**
   - **Frontend:** Did a React state freeze? Check the Javascript console in the browser.
   - **Backend:** Did an API route return 500? Check Vercel Logs.
   - **Blockchain:** Did `require_auth` fail? Check the Soroban RPC response for `HostError`.

3. **Log the Bug:**
   The user's feedback form will automatically categorize their input under "What was confusing?" or "What would you change?" Record this in a GitHub Issue.
