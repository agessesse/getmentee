import type { TenantPalette, TokenSet } from './derive';

/**
 * What a tenant looks like to the interface.
 *
 * Isomorphic on purpose. lib/theme/resolve.ts is server-only because it uses
 * the service role; the shell components that RENDER this are client
 * components. Keeping the shape in its own module means neither has to import
 * the other's constraints.
 */
export interface TenantIdentity {
  organizationId: string;
  /** The legal entity. "University of North Carolina at Chapel Hill". */
  legalName: string;
  /** What a participant is actually in. "Carolina Alumni Mentorship". */
  displayName: string;
  tagline: string | null;
  /**
   * A disclaimer stored beside the branding, so the two cannot be separated.
   * Rendered wherever the identity is rendered. See migration 0031.
   */
  notice: string | null;
  /** "Finance Access". */
  programName: string | null;
  /** "Cohort 001". */
  cohortName: string | null;
  /** "Fall 2026". */
  term: string | null;
  /** The four configured colours, or null for the Mentable default. */
  palette: TenantPalette | null;
  /** Derived token set, or null when the tenant has no theme. */
  tokens: TokenSet | null;
}
