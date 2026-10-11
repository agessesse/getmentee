import 'server-only';
import { sendEmail, type EmailResult } from '@/lib/email/send';

/**
 * The messages Cohort 001 actually needs.
 *
 * WRITTEN AS A PERSON WOULD WRITE THEM. No banner image, no button styled
 * as a pill, no "Hi {{first_name}}, we're excited to have you on this
 * journey". Plain text, short, and signed by a human, because that is what
 * the first twenty participants should receive from a ten-person programme.
 *
 * Nine messages, each tied to one real transition in the operating model.
 * Nothing speculative, nothing scheduled, nothing drip.
 */

const SIGN_OFF = '\n\nAbel and Pablo\nMentable\nhttps://mentable.co';

const app = (path: string) =>
  `${(process.env.NEXT_PUBLIC_APP_URL ?? 'https://mentable.co').replace(/\/$/, '')}${path}`;

export const EMAILS = {
  applicationReceived: (name: string) => ({
    subject: 'We have your Mentable application',
    text: `${name},\n\nThanks for applying to Cohort 001. We read every application ourselves, and we will come back to you either way.\n\nTen students, ten alumni mentors, one semester.${SIGN_OFF}`,
  }),

  studentSelected: (name: string) => ({
    subject: 'You’re in — Mentable Cohort 001',
    text: `${name},\n\nYou have a place in Cohort 001.\n\nNext: sign in and answer six short questions before your first conversation. They take about three minutes, and we ask the same ones at the end so we can see what actually changed.\n\n${app('/cohort/check-in')}${SIGN_OFF}`,
  }),

  studentNotSelected: (name: string) => ({
    subject: 'About your Mentable application',
    text: `${name},\n\nWe are not able to offer you a place in Cohort 001. We had far more strong applications than the ten places we have this semester, and that is the whole of it.\n\nWe will write to you when the next cohort opens.${SIGN_OFF}`,
  }),

  mentorInvitation: (name: string, invitedBy: string) => ({
    subject: 'Would you mentor one student this semester?',
    text: `${name},\n\n${invitedBy} suggested you.\n\nThe ask is specific: one student, one semester, a conversation roughly every three weeks, 30 to 45 minutes each. Six conversations in total. Nothing else.\n\nIf that works, the terms are here and it takes a minute:\n\n${app('/cohort/commit')}${SIGN_OFF}`,
  }),

  mentorCommitted: (name: string) => ({
    subject: 'Thank you — you’re confirmed',
    text: `${name},\n\nYou are confirmed as a Cohort 001 mentor. We are matching deliberately and by hand, so it may be a week or so before we introduce you to your student.\n\nWhen we do, you will get their background and what they are trying to work out, before you speak.${SIGN_OFF}`,
  }),

  matchIntroduction: (name: string, partnerName: string, why: string, mentorshipPath: string) => ({
    subject: `Your Mentable match: ${partnerName}`,
    text: `${name},\n\nYou have been matched with ${partnerName}.\n\nWhy we put you together:\n${why}\n\nEverything about the relationship lives in one place — what you are working toward, what you each agreed to do, and what happened last time:\n\n${app(mentorshipPath)}\n\nThe first conversation should happen in the next two weeks.${SIGN_OFF}`,
  }),

  conversationScheduled: (name: string, partnerName: string, whenText: string, mentorshipPath: string) => ({
    subject: `Conversation with ${partnerName}: ${whenText}`,
    text: `${name},\n\nYour conversation with ${partnerName} is set for ${whenText}.\n\nA few minutes of preparation makes a real difference — what you want help with, and the questions you want to ask:\n\n${app(mentorshipPath)}${SIGN_OFF}`,
  }),

  nudgeNoFirstConversation: (name: string, partnerName: string, days: number) => ({
    subject: `Have you and ${partnerName} spoken yet?`,
    text: `${name},\n\nYou were matched ${days} days ago and we cannot see a first conversation yet.\n\nIf something is in the way, reply and tell us — that is genuinely useful to know. If it is just scheduling, here is where to book it:\n\n${app('/mentorships')}${SIGN_OFF}`,
  }),

  endlineRequest: (name: string) => ({
    subject: 'Five minutes on how the semester went',
    text: `${name},\n\nThe cohort is finishing. The same six questions you answered at the start, plus a few about what actually happened.\n\nThis is the only way we can tell whether Mentable made a difference or whether we simply picked people who were going to do well anyway. Honest answers are more useful than kind ones.\n\n${app('/cohort/check-in?phase=endline')}${SIGN_OFF}`,
  }),
};

/** Send one of the above. Returns the same result shape as sendEmail. */
export async function send(to: string, message: { subject: string; text: string }): Promise<EmailResult> {
  return sendEmail({ to, subject: message.subject, text: message.text });
}
