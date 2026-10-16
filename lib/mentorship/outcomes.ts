/**
 * What each side thought, after a conversation actually happened.
 *
 * THE FIRST REAL FEEDBACK LOOP. Nothing in Mentable currently reads a
 * finished conversation and changes anything, which is why the public
 * copy no longer claims that it does. This module is the data existing;
 * learning from it is a later, separate, earned step.
 *
 * FOUR QUESTIONS TOTAL. Two per side, asked once, after the first
 * completed conversation. That ceiling is a design constraint, not a
 * starting point: response rate collapses with length, and a survey
 * nobody finishes produces worse data than two questions everybody
 * answers. If a fifth question is ever worth adding, something here has
 * to come out.
 *
 * WHY THESE TWO. The first asks what the conversation was worth. The
 * second asks whether they would do it again — and the second is the more
 * predictive of the two, because people are polite about usefulness and
 * honest about repeating. A future ranking should weight it accordingly.
 *
 * THREE OPTIONS, NOT A SCALE. "Very / Somewhat / Not really" is a
 * judgement a person can make honestly in two seconds. A seven-point
 * scale invites a precision nobody has and produces averages that look
 * like measurement.
 *
 * NEITHER SIDE EVER SEES THE OTHER'S ANSWER. The table is service-role
 * only and there is no surface that renders a counterpart's response.
 * Candid answers about a named person stop being candid the moment that
 * stops being true, and an organisation gets aggregates, never attributed
 * responses.
 *
 * Pure and isomorphic: the server loads, this defines, the page renders.
 */

export type Usefulness = 'high' | 'some' | 'low';
export type ContinueIntent = 'yes' | 'maybe' | 'no';

export interface OutcomeAnswer {
  usefulness: Usefulness;
  continueIntent: ContinueIntent;
  note?: string;
}

export interface Choice<T> {
  value: T;
  label: string;
}

export interface OutcomeQuestions {
  /** Named for the conversation, so it is obvious what is being rated. */
  usefulness: { prompt: string; choices: Choice<Usefulness>[] };
  continueIntent: { prompt: string; choices: Choice<ContinueIntent>[] };
}

/*
  THE WORDING DIFFERS BY ROLE, AND IT MATTERS.

  A student is asked whether the conversation was USEFUL. A mentor is
  asked whether it was a GOOD USE OF THEIR TIME — which is the question
  they are actually asking themselves, and the one whose answer predicts
  whether they stay. Asking a volunteer "was this useful?" invites them to
  rate the student's performance, which is neither what is wanted nor
  something anyone should be asked to put in writing.
*/
export function questionsFor(role: 'mentee' | 'mentor'): OutcomeQuestions {
  return role === 'mentee'
    ? {
        usefulness: {
          prompt: 'Was this conversation useful?',
          choices: [
            { value: 'high', label: 'Very' },
            { value: 'some', label: 'Somewhat' },
            { value: 'low', label: 'Not really' },
          ],
        },
        continueIntent: {
          prompt: 'Would you want to speak with them again?',
          choices: [
            { value: 'yes', label: 'Yes' },
            { value: 'maybe', label: 'Maybe' },
            { value: 'no', label: 'No' },
          ],
        },
      }
    : {
        usefulness: {
          prompt: 'Was this a good use of your time?',
          choices: [
            { value: 'high', label: 'Yes' },
            { value: 'some', label: 'Mostly' },
            { value: 'low', label: 'No' },
          ],
        },
        continueIntent: {
          prompt: 'Would you continue this relationship?',
          choices: [
            { value: 'yes', label: 'Yes' },
            { value: 'maybe', label: 'Maybe' },
            { value: 'no', label: 'No' },
          ],
        },
      };
}

/**
 * What to say back, once. Not a score and not a thank-you card.
 *
 * A "no" is answered with what will actually happen next, because the
 * single fastest way to stop someone answering honestly a second time is
 * to have their honest answer visibly change nothing. "Not really" is the
 * most valuable response this collects and the one most easily lost.
 */
export function acknowledgement(a: OutcomeAnswer, role: 'mentee' | 'mentor'): string {
  if (a.continueIntent === 'no') {
    return role === 'mentee'
      ? 'Noted, and it stays private. We will not suggest this pairing again.'
      : 'Noted, and it stays private. We will not count you as available for this one.';
  }
  if (a.usefulness === 'low') {
    return 'Thank you for saying so. It is more useful to us than a good review.';
  }
  return 'Thank you. This is the first thing Mentable has that could teach it anything.';
}

/**
 * Is this relationship's outcome still outstanding for this viewer?
 *
 * Deliberately narrow. Asked only about the FIRST completed conversation,
 * so nobody is prompted after every call — a recurring survey is how a
 * relationship starts feeling administered.
 */
export function shouldAsk(opts: {
  firstCompletedSessionId: string | null;
  alreadyAnswered: boolean;
}): boolean {
  return Boolean(opts.firstCompletedSessionId) && !opts.alreadyAnswered;
}
