# Security Architecture

## Phase 2 Security Checklist

### Authentication & Authorization

✅ **Email/Password Hashing**

- Supabase Auth handles password hashing (bcrypt)
- Passwords never leave browser unencrypted
- No passwords stored in application code

✅ **Session Management**

- Supabase Auth manages sessions securely
- Tokens are signed JWTs (no secrets inside)
- Session data stored in secure cookies

✅ **Protected Routes**

- `/dashboard` requires authenticated session
- Unauthenticated users redirected to `/login`
- Session check via `useAuth()` hook

### Database Security

✅ **Row-Level Security (RLS) Enabled**

- All data access enforced at database level
- Users can only read their own profile
- Users can only update their own profile

✅ **RLS Policies Implemented**

```sql
-- Users can read own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

✅ **No Broad Access**

- Unauthenticated users cannot access profiles
- No "select all profiles" permission granted

✅ **Profile Creation via Trigger**

- Profiles cannot be inserted directly via API
- Automatic creation via PostgreSQL trigger ensures data consistency
- Prevents users from creating profiles for others

### Environment & Secrets

✅ **No Secrets Committed**

- `.env.local` is in `.gitignore`
- Only `.env.example` with placeholders is tracked
- Service-role key is NEVER in browser code

✅ **Environment Variables**

- `NEXT_PUBLIC_SUPABASE_URL` — Safe to expose
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Safe to expose (read-only)
- `SUPABASE_SERVICE_ROLE_KEY` — NOT USED in Phase 2

✅ **No Hardcoded Credentials**

- All config comes from `.env.local`
- No API keys in source code

### Client/Server Boundary

✅ **Browser Client (`lib/supabase.ts`)**

- Uses Supabase JS SDK
- Uses anon key (limited permissions)
- Authenticates via Supabase Auth

✅ **No Server-Side Auth Code (Phase 2)**

- Future phases may add server actions for sensitive operations
- Currently: all auth operations are browser-based and Supabase-handled

✅ **Trust Model**

- Never trust client-supplied user ID
- Always check `auth.uid()` server-side (via RLS)
- Supabase Auth is source of truth

### Input Validation

✅ **Form Validation**

- Email format validation (HTML5 + React)
- Password requirements (at signup)
- Required field checks

⏳ **Server-Side Validation (Future)**

- Phase 3+ will add request validation with Zod
- Database constraints (NOT NULL, CHECK, UNIQUE)

### What's NOT Yet Implemented

❌ **Email Verification**

- Users can sign up without confirming email
- Future: Add email confirmation flow

❌ **Two-Factor Authentication**

- Not required for MVP
- Can be added later via Supabase Auth

❌ **Rate Limiting**

- Database doesn't rate-limit auth attempts
- Future: Implement via middleware or Supabase Extensions

❌ **CSRF Protection**

- Next.js provides automatic CSRF protection for form actions
- Not yet needed in Phase 2 (server actions not used)

❌ **Audit Logging**

- No record of who logged in when
- Future: Add audit trails for security events

## Threat Model (Phase 2)

### Addressed Threats

1. **Weak Passwords**
   - Mitigation: Password requirements at signup

2. **Session Hijacking**
   - Mitigation: Secure cookies, HTTPS required

3. **Unauthorized Profile Access**
   - Mitigation: RLS policies at database level

4. **SQL Injection**
   - Mitigation: Supabase client uses parameterized queries

5. **XSS (Cross-Site Scripting)**
   - Mitigation: React auto-escapes content, no `dangerouslySetInnerHTML`

### Known Limitations (Phase 2)

1. **Email Unverified**
   - Users can sign up with fake emails
   - Mitigation (Phase 3+): Add email verification

2. **No Rate Limiting**
   - Attackers could brute-force passwords
   - Mitigation (Phase 3+): Implement rate limiting

3. **Profile Takeover Risk**
   - If password is compromised, attacker gains full access
   - Mitigation (Phase 3+): Add password reset, 2FA, login alerts

## Compliance & Standards

✅ **HTTPS Required**

- Vercel enforces HTTPS in production
- Development uses `http://localhost:3000`

✅ **Data in Transit**

- All Supabase connections use TLS 1.2+
- No unencrypted data transmission

✅ **Data at Rest**

- Supabase encrypts database with AES-256
- No additional encryption needed in Phase 2

## Best Practices Followed

1. **Principle of Least Privilege**
   - Users only access their own data
   - No admin override without service key

2. **Defense in Depth**
   - Client-side validation (UX)
   - Server-side validation (Supabase Auth + RLS)
   - Database constraints (last resort)

3. **Secure Defaults**
   - RLS enabled by default
   - No public access unless explicitly granted
   - Session-based auth (stateless)

4. **Security as Process**
   - Regular reviews of RLS policies
   - Future: Penetration testing before launch
   - Future: Security audit of production deployment

## Testing Security

### Manual Checks Before Phase 3

1. Attempt to access another user's profile (RLS should block)
2. Attempt to update another user's email (RLS should block)
3. Attempt unauthenticated access to `/dashboard` (should redirect to login)
4. Verify `.env.local` is not in git (check `.gitignore`)
5. Verify secrets are not in logs or error messages

### Future Security Testing

- Automated security scanning in CI/CD
- OWASP Top 10 compliance audit
- Penetration testing
- Bug bounty program (if applicable)

## Security Review Checklist for Phase 3+

Before each phase:

1. [ ] No new secrets committed
2. [ ] RLS policies reviewed and tested
3. [ ] Input validation added where needed
4. [ ] Rate limiting configured
5. [ ] Audit logs functional
6. [ ] Email verification implemented (if needed)

---

**Last Reviewed:** August 2026  
**Next Review:** After Phase 3
