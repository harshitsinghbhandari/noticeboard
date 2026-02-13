# 🛡️ Sentinel's Journal

## 2025-05-14 - Initial Security Assessment
**Gap Identified:** Lack of standard security documentation and foundational security headers.
**Risk:** Contributors and users have no clear guidance on how to report vulnerabilities, and the application is exposed to common web attacks (e.g., Clickjacking, Sniffing) that could be mitigated by standard security headers.
**Resolution:** Initialized `SECURITY.md` and documented the project's security posture and expectations.

**Gap Identified:** Reliance on `localStorage` for JWT storage in the frontend.
**Risk:** Vulnerability to Cross-Site Scripting (XSS) attacks where an attacker could steal the user's authentication tokens.
**Resolution:** Documented this as a known limitation in `SECURITY.md` and recommended transitioning to `httpOnly` cookies in the best practices section.

**Gap Identified:** Inconsistent input validation across API routes.
**Risk:** Potential for unexpected behavior or crashes if malformed data is sent to routes that lack `express-validator` middleware.
**Resolution:** Documented the requirement for universal input validation in the contributor best practices section of `SECURITY.md`.

## 2025-05-14 - Pre-existing Test Failure and Architectural Inconsistency
**Gap Identified:** A failing test (`POST /bodies should return 404`) indicates a mismatch between the codebase and intended architectural state.
**Risk:** The route `POST /bodies` exists despite documentation stating body creation is restricted to manual database entries. While protected by a `is_system_admin` check, its existence contradicts the "no public API" policy and could be a vector for unauthorized body creation if the admin check is compromised.
**Resolution:** Documented the strict requirement for RBAC and mentioned this inconsistency in the known limitations/assumptions for future review.
