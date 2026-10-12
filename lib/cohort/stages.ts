/**
 * Pipeline vocabulary, shared by the server loader and the operator UI.
 *
 * Isomorphic on purpose. lib/cohort/pipeline.ts is server-only because it
 * uses the service role; the board that renders its output is a client
 * component. The labels and the shapes belong to neither, so they live
 * here — the same split as lib/theme/identity.ts.
 */

export type Stage =
  | 'applied' | 'reviewing' | 'selected' | 'matching'
  | 'matched' | 'activated' | 'hold' | 'declined';

/** What the operator reads. Never a database value. */
export const STAGE_LABEL: Record<Stage, string> = {
  applied: 'Applied',
  reviewing: 'Reviewing',
  selected: 'Selected',
  matching: 'Ready to match',
  matched: 'Matched',
  activated: 'Activated',
  hold: 'On hold',
  declined: 'Declined',
};

/** The primary flow, left to right. Hold and Declined sit outside it. */
export const PRIMARY_STAGES: Stage[] = [
  'applied', 'reviewing', 'selected', 'matching', 'matched', 'activated',
];

export interface PipelinePerson {
  applicationId: string;
  profileId: string | null;
  role: 'mentee' | 'mentor';
  stage: Stage;
  fullName: string;
  email: string;
  appliedAt: string;
  school: string | null;
  year: string | null;
  major: string | null;
  careerInterests: string[];
  title: string | null;
  organization: string | null;
  expertise: string | null;
  wants: string | null;
  /** Student: where they are stuck. Mentor: why they are mentoring. */
  context: string | null;
  /** Student: what they have already tried. Mentor: prior involvement. */
  tried: string | null;
  linkedinUrl: string | null;
  accessSignals: string[];
  operatorNotes: string | null;
  partnerName: string | null;
  mentorshipId: string | null;
  waitingOn: string | null;
}

export interface Funnel {
  role: 'mentee' | 'mentor';
  applied: number;
  reviewing: number;
  selected: number;
  matched: number;
  activated: number;
  hold: number;
  declined: number;
}
