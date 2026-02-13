# Security Policy

## 🛡️ Sentinel’s Commitment
We are committed to the security of the Noticeboard application. This document outlines our security posture, reporting processes, and the defensive standards we expect from all contributors.

---

## 🚀 Supported Versions

The following versions are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

We support the latest minor version of the current major release.

---

## 📞 Reporting a Vulnerability

If you discover a potential security vulnerability in this project, please report it responsibly.

**Do NOT open a public issue for security vulnerabilities.**

### Reporting Channel
Please email your findings to: **security@example.com**

### Expected Process
1. **Initial Response:** You can expect an acknowledgment within 48 hours.
2. **Analysis:** We will investigate the report and provide a status update within 7 days.
3. **Disclosure:** Once a fix is verified, we will coordinate a disclosure date with you.

### Safe Harbor
We promise not to pursue legal action against researchers who:
- Report vulnerabilities through the above process.
- Provide a reasonable amount of time to resolve the issue before making it public.
- Do not attempt to access or modify data that does not belong to them.

---

## 🛠️ Security Best Practices for Contributors

### 1. Input Validation & Sanitization
- All user-supplied data must be validated.
- Use `express-validator` middleware for all backend routes.
- Ensure UUID parameters are validated as UUIDs.
- **Principle:** Trust nothing, verify everything.

### 2. Authentication & Authorization
- Use the provided `authMiddleware` for all protected routes.
- Enforce Role-Based Access Control (RBAC) using `requireRole` and the centralized `checkBodyPermission` function.
- Never bypass authorization checks for "convenience".

### 3. Secret Management
- Never commit secrets (API keys, passwords, database credentials) to version control.
- Use environment variables (`.env`) for all configuration.
- Add new required variables to `.env.example` (if available) without including real values.

### 4. Database Safety
- Always use parameterized queries (via the `pg` pool) to prevent SQL injection.
- Never concatenate user input directly into SQL strings.

### 5. Error Handling & Logging
- Do not return stack traces or detailed system information to the client in production.
- Use the `requestLogger` middleware, but ensure it does not log sensitive information like passwords or JWTs.

---

## 📦 Dependency & Supply Chain Security

- **Lockfiles:** `package-lock.json` must be committed and kept up-to-date.
- **Updates:** Regularly run `npm audit` to identify and resolve vulnerable dependencies.
- **Minimalism:** Only add dependencies that are strictly necessary and well-maintained.

---

## 🧠 Secure Development Principles

- **Defense in Depth:** Multiple layers of security (e.g., auth middleware + fine-grained permission checks).
- **Least Privilege:** Users and services should only have the permissions necessary to perform their tasks.
- **Fail Securely:** If an error occurs during an authentication or authorization check, the default state must be "Access Denied".

---

## ⚠️ Known Security Limitations

The following items are identified as areas for improvement and should be considered during development:

1. **Token Storage:** JWTs are currently stored in `localStorage` in the frontend, which is susceptible to XSS. Transitioning to `httpOnly` cookies is a recommended future hardening step.
2. **Security Headers:** The application does not currently use `helmet` or similar middleware to set standard security headers (e.g., CSP, HSTS).
3. **CORS Configuration:** CORS origins are currently restricted in `server.ts` but should be fully externalized to environment variables for production environments.
