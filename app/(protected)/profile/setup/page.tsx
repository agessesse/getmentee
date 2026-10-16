import { schemaCapabilities } from '@/lib/schema-capabilities';
import ProfileSetupForm from '@/components/profile/ProfileSetupForm';

/**
 * Onboarding, which is really the matching engine's input surface.
 *
 * This page exists as a server component for one reason: to ask the
 * database what it can store before rendering a form that promises to
 * store it. Measured before this pass, 25 of 25 production mentors had an
 * industry and ZERO had can_help_with — the one field that says what a
 * person can be brought, rather than what subject they are tagged with. An
 * engine reading that data cannot do better than a job title, no matter
 * how good its ranking is.
 *
 * The richer inputs need columns from migration 0039. Rendering those
 * fields before the migration is applied would produce a form that looks
 * complete and silently drops half of what someone typed — the exact
 * failure this codebase has already shipped three times. So the capability
 * is asked for, and the fields appear the moment the migration lands.
 */
export default async function ProfileSetupPage() {
  const caps = await schemaCapabilities();
  return <ProfileSetupForm hasIntelligenceInputs={caps.intelligenceInputs} />;
}
