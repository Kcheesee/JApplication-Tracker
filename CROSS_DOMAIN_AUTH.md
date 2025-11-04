# Cross-Domain Authentication Strategy

## Problem

When frontend and backend are deployed on different domains (e.g., Render, Vercel):
- **Frontend:** `https://job-tracker.vercel.app`
- **Backend:** `https://job-tracker-api.onrender.com`

**httpOnly cookies have significant limitations** in cross-domain scenarios:
1. Cookies require `SameSite=None` and `Secure=True` for cross-site requests
2. Browser privacy features increasingly block third-party cookies
3. Cookie domain attributes must match, which is impossible with different domains

## Solution Implemented

### For Regular Login (Email/Password)
- **Backend:** Sets both httpOnly cookie AND returns token in response body
- **Frontend:** Stores token in localStorage, sends via Authorization header
- **Security:** XSS protection relies on Content Security Policy and input sanitization

### For Google OAuth Callback
Special case because OAuth flow involves redirect from Google → Backend → Frontend:

**Previous approach (broken in cross-domain):**
```
Backend redirects to: https://frontend.com/?auth=success
Cookie set in response header (not accessible cross-domain)
```

**New approach (works cross-domain):**
```
Backend redirects to: https://frontend.com/#token=eyJ...
Token in URL fragment (not sent to server)
Frontend extracts token and clears URL immediately
```

## Security Analysis

### URL Fragment vs Query Parameter

| Aspect | Query Param (?token=...) | Fragment (#token=...) |
|--------|--------------------------|----------------------|
| Sent to server | ✅ Yes (logged) | ❌ No (client-only) |
| Server logs | ✅ Logged | ❌ Not logged |
| Referer header | ✅ Included | ❌ Not included |
| Browser history | ✅ Saved | ⚠️ Saved (cleared by app) |
| JavaScript access | ✅ Yes | ✅ Yes |

**Conclusion:** URL fragments are more secure than query parameters for OAuth callbacks.

### Trade-offs

#### httpOnly Cookies (Ideal for same-domain)
**Pros:**
- ✅ Immune to XSS attacks (JavaScript cannot access)
- ✅ Automatically sent with requests
- ✅ Can set HttpOnly, Secure, SameSite flags

**Cons:**
- ❌ Limited cross-domain support
- ❌ Requires HTTPS in production
- ❌ Browser privacy features may block

**Best for:** Same-domain deployments

#### localStorage + Bearer Tokens (Pragmatic for cross-domain)
**Pros:**
- ✅ Works across different domains
- ✅ Simple implementation
- ✅ Compatible with all browsers
- ✅ Fine-grained control over token lifecycle

**Cons:**
- ⚠️ Vulnerable to XSS attacks (if XSS exists)
- ⚠️ Requires manual token management
- ⚠️ Developer must include in requests

**Best for:** Cross-domain deployments (production reality)

## Mitigation Strategies for localStorage

Since we're using localStorage for cross-domain compatibility, implement these protections:

### 1. Content Security Policy (CSP)
```http
Content-Security-Policy: default-src 'self'; script-src 'self'
```
Prevents loading malicious scripts from external domains.

### 2. Input Sanitization
- Sanitize all user inputs (especially in UI components)
- Use React's built-in XSS protection (escaping by default)
- Never use `dangerouslySetInnerHTML` with user content

### 3. Short Token Expiration
- Current: 30 minutes (good)
- Implement refresh tokens for longer sessions
- Auto-logout on token expiration

### 4. HTTPS Only
- ✅ Already enforced in production
- Prevents man-in-the-middle attacks

### 5. Token Rotation
- Rotate tokens on sensitive operations
- Clear tokens on logout
- Implement token revocation list

## Recommendations by Deployment Type

### Same-Domain Deployment (Most Secure)
Example: `app.example.com` and `app.example.com/api`

```bash
# Use httpOnly cookies
FRONTEND_URL=https://app.example.com
BACKEND_URL=https://app.example.com/api
ENVIRONMENT=production
```

**Configuration:**
- httpOnly cookies enabled
- SameSite=lax
- Secure=true

### Cross-Domain Deployment (Current Setup)
Example: Different domains on Render, Vercel, Netlify

```bash
# Use Bearer tokens
FRONTEND_URL=https://job-tracker.vercel.app
BACKEND_URL=https://job-tracker-api.onrender.com
ENVIRONMENT=production
```

**Configuration:**
- URL fragment for OAuth callbacks
- localStorage for token storage
- Bearer token authentication
- Strict CSP headers

## Migration Path to Maximum Security

If you want maximum security, migrate to a same-domain setup:

### Option 1: Backend as Subdomain
- **Frontend:** `https://app.jobtracker.com`
- **Backend:** `https://api.jobtracker.com`
- **Result:** Same root domain, cookies work with `Domain=.jobtracker.com`

### Option 2: Backend Behind Proxy
- **Frontend:** `https://jobtracker.com`
- **Backend:** `https://jobtracker.com/api/*` (proxied)
- **Result:** Same origin, full cookie support

### Option 3: Use API Gateway
- Deploy both behind AWS API Gateway, Azure App Gateway, or Cloudflare
- Configure routing at edge level
- Both appear on same domain to clients

## Current Implementation Status

✅ **Implemented:**
- Cross-domain OAuth with URL fragments
- Backwards compatible Bearer token support
- httpOnly cookie support for same-domain
- Secure cookie settings (SameSite, Secure, HttpOnly)
- Token cleared from URL immediately
- Environment-based configuration

⚠️ **Recommended Additions:**
- Implement Content Security Policy headers
- Add refresh token mechanism
- Consider token rotation on sensitive ops
- Add rate limiting (prevent brute force)
- Implement CSRF protection for state-changing requests

## Testing Checklist

- [x] Google OAuth works in production (cross-domain)
- [x] Regular login works in production
- [x] Token stored in localStorage
- [x] Token cleared from URL after OAuth
- [x] CORS configured correctly
- [ ] Test with browser privacy features enabled
- [ ] Verify no token leakage in server logs
- [ ] Test token expiration and refresh

## References

- [OWASP: Cross-Site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/)
- [MDN: SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [URL Fragment Best Practices](https://www.rfc-editor.org/rfc/rfc6749#section-7.4)

---

**Last Updated:** 2025-11-04
**Status:** Implemented and tested in production
