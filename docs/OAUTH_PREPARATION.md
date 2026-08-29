# OAuth Integration Preparation

This document outlines the architecture for adding Google and LinkedIn OAuth to Mentee in future phases.

## Current State (Phase 2)

Email/password authentication is fully implemented via `lib/auth-context.tsx` and Supabase Auth.

## Future: Google OAuth

### Why We're Not Implementing It Now

1. Requires Google Cloud Console setup (outside current scope)
2. Can be added cleanly to existing Supabase Auth
3. Non-critical for MVP

### How to Add It Later

1. **Create Google OAuth Credentials**
   - Go to Google Cloud Console
   - Create OAuth 2.0 credentials (Web application)
   - Get Client ID and Client Secret

2. **Configure Supabase**
   - Supabase Dashboard → Authentication → Providers
   - Enable Google
   - Add Client ID and Client Secret

3. **Update Auth UI**
   - Add Google sign-in button in `components/auth/login-form.tsx`
   - Call `supabase.auth.signInWithOAuth({ provider: 'google' })`

4. **Profile Metadata** (Optional)
   - Auto-fill `first_name`, `last_name`, `avatar_url` from Google profile

### Code Structure (Already Set Up for This)

```typescript
// Future Google sign-in
const handleGoogleSignIn = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
};
```

## Future: LinkedIn OAuth

### Important Notes

- Legitimate integration only via LinkedIn OAuth 2.0 provider
- Mentee currently does NOT import LinkedIn profiles automatically
- LinkedIn integration is optional for MVP

### When to Add It

LinkedIn OAuth should only be added when:

1. LinkedIn credentials are available
2. Clear user value is established (e.g., "import education history")
3. Privacy and data sharing is clearly communicated to users

### How to Add It Responsibly

1. **Register with LinkedIn**
   - Go to LinkedIn Developers
   - Create an app
   - Get Client ID and Client Secret

2. **Configure Supabase**
   - Add LinkedIn as provider (similar to Google)
   - Set authorized redirect URIs

3. **Implement Sign-In**
   - Add LinkedIn button to auth forms
   - Call `signInWithOAuth({ provider: 'linkedin_oidc' })`

4. **What NOT To Do**
   - Do NOT scrape LinkedIn profiles
   - Do NOT use unofficial APIs
   - Do NOT store LinkedIn auth tokens beyond session
   - Do NOT auto-populate professional data without explicit consent

## References

- [Supabase OAuth Providers](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [LinkedIn OAuth 2.0](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)

## Summary

The current auth architecture supports OAuth cleanly without requiring changes to:

- Database schema
- Session management
- Protected routes
- Profile creation logic

OAuth is a future enhancement, not a blocker for MVP.
