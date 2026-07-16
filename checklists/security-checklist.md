# Security Checklist

Source: `SYSTEM_PROMPT.md` §45, `claude/SECURITY.md`.

- ☐ Input validation on every external input
- ☐ Output encoding
- ☐ Authentication enforced
- ☐ Authorization enforced (least privilege)
- ☐ Rate limiting where applicable
- ☐ Audit logging for sensitive actions
- ☐ Secure defaults
- ☐ Secrets never hardcoded or committed
- ☐ Dependencies scanned for known vulnerabilities
- ☐ Encryption in transit
- ☐ Encryption at rest where required
- ☐ No sensitive data leaked in logs or error messages
- ☐ Client input never trusted
