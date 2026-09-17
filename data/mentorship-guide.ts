/**
 * The Mentorship Guide. Short, practical, readable in a minute or three each.
 *
 * Copy standard: write like an experienced person giving useful advice. No
 * slogans, no "unlock your potential". Nothing here is attributed to a real
 * person; the "what they notice" lines are the standard we're describing, not
 * quotes.
 */

export interface GuideTopic {
  id: string;
  title: string;
  summary: string;
  points: string[];
  /** Where the fundamentals live, when this topic builds on them instead of repeating them. */
  seeAlso?: { href: string; label: string };
}

/*
 * Division of labour with Networking 101 (/networking). That page teaches how
 * to start and build a professional relationship: finding people, reaching out,
 * preparing for and running a first conversation, thank-you notes. This guide
 * is about making an ongoing mentorship work, so where a topic touches those
 * basics it builds on them and links across with seeAlso rather than repeating.
 */

export const MENTEE_STANDARD = {
  title: 'What mentors notice',
  lines: [
    'They remembered what we discussed.',
    'They actually did the work.',
    'Their questions got better.',
    'They took the feedback seriously.',
    'They respect my time, and don’t expect me to solve everything.',
  ],
};

export const MENTOR_STANDARD = {
  title: 'What mentees remember',
  lines: [
    'They remembered, and they followed up.',
    'They didn’t make me feel stupid.',
    'They told me what I needed to hear.',
    'They helped me think, rather than telling me what to think.',
    'They showed up when it mattered.',
  ],
};

export const MENTEE_TOPICS: GuideTopic[] = [
  {
    id: 'first-meeting',
    title: 'Preparing for your first meeting',
    summary: 'Know why you’re there and what you hope to build.',
    points: [
      'Be ready to say, in a sentence or two, what you want to develop.',
      'Ask what they can realistically help with. Don’t assume.',
      'Agree on how often you’ll meet and how to reach each other in between.',
      'Ask what preparation they’d like to see before each conversation.',
    ],
  },
  {
    id: 'knowing',
    title: 'Getting to know your mentor',
    summary: 'A profile tells you where they’ve been. Conversations tell you why.',
    points: [
      'Remember what they’ve told you about their path, and build on it next time.',
      'Ask about the turns: the decisions they weighed, and what they’d do differently.',
      'Don’t recite their résumé back to them. Use what you know to ask something only they can answer.',
    ],
    seeAlso: { href: '/networking#research', label: 'Researching someone before a first conversation' },
  },
  {
    id: 'questions',
    title: 'Bringing better questions each time',
    summary: 'Your questions should grow as the relationship does.',
    points: [
      'Start from where you left off: what you tried since last time, and what happened.',
      'Come with a point of view. Your mentor can help you sharpen it.',
      'Too broad: “Can you tell me about investment banking?” Better: “You moved from corporate banking into investment banking. What changed in how you evaluated companies?”',
    ],
    seeAlso: { href: '/networking#questions', label: 'Question basics in Networking 101' },
  },
  {
    id: 'listening',
    title: 'Listening well',
    summary: 'Don’t plan your next question while they’re answering this one.',
    points: [
      'Let pauses happen. People often say the most useful thing after one.',
      'Ask a follow-up before moving to your next prepared question.',
      'Repeat the important advice back in your own words to check you got it.',
      'Listen for what they emphasize, and for the mistake they’re trying to help you avoid.',
    ],
  },
  {
    id: 'notes',
    title: 'Taking useful notes',
    summary: 'Be present first. Capture key points. Organize afterward.',
    points: [
      'Pen and paper keeps a screen out of the conversation.',
      'Write down the advice, then separate it: what’s perspective, what’s a fact, and what’s something you’ll actually do.',
      'Type it up the same day, while you still remember the context.',
    ],
  },
  {
    id: 'ai-tools',
    title: 'Using transcription and AI tools responsibly',
    summary: 'Tools can help you capture a conversation. They can’t replace paying attention.',
    points: [
      'Dictation or note tools (Wispr Flow, for example) are fine for organizing your own thoughts afterward.',
      'Always ask before you record or transcribe another person, and respect a no.',
      'Never record anyone without their consent.',
      'Don’t paste someone’s private or confidential information into an AI tool.',
    ],
  },
  {
    id: 'follow-through',
    title: 'Following through',
    summary: 'If you said you’d do it, come back having done it.',
    points: [
      'Turn what you committed to into action items, with dates.',
      'If something gets in the way, say so before the next conversation, not during it.',
      'Tell them what happened after their advice. That’s the part mentors rarely get to see.',
    ],
    seeAlso: { href: '/networking#follow-up', label: 'Writing a good thank-you note' },
  },
  {
    id: 'acting-on-advice',
    title: 'Acting on advice',
    summary: 'Advice is input, not instruction. You still decide.',
    points: [
      'Weigh advice against what you know about your own situation.',
      'If you decide not to follow it, that’s fine. Tell them why, briefly.',
      'Try things quickly and report back. That’s how the next conversation gets better.',
    ],
  },
  {
    id: 'updates',
    title: 'Giving your mentor updates',
    summary: 'Close the loop.',
    points: [
      'Good: “You suggested I rebuild the opening of my pitch. I tried it yesterday and the conversation went much better.”',
      'Keep updates short: what you did, what happened, what’s next.',
      'Thank them specifically. “Thanks for your time” says nothing; name what actually helped.',
    ],
  },
  {
    id: 'introductions',
    title: 'Asking for introductions',
    summary: 'Earn them. Don’t expect them.',
    points: [
      'Build the relationship first. Introductions follow trust.',
      'If you ask, be specific about who and why, and make it easy to say no.',
      'If they introduce you, follow up quickly and tell them how it went.',
    ],
  },
  {
    id: 'feedback',
    title: 'Receiving difficult feedback',
    summary: 'It’s about the work, not about you.',
    points: [
      'Listen to the end before responding.',
      'Ask for an example if it’s unclear.',
      'Say thank you, and decide later what you’ll do with it.',
    ],
  },
  {
    id: 'long-term',
    title: 'Building a long-term relationship',
    summary: 'Follow-through and progress keep people wanting to help.',
    points: [
      'Keep a light rhythm, even when nothing big is happening.',
      'Let your questions grow as you do.',
      'Remember that it runs both ways. Share what you’re learning too.',
    ],
  },
  {
    id: 'ending',
    title: 'Pausing or ending a mentorship',
    summary: 'Relationships change. End them with the same respect you started with.',
    points: [
      'Say so directly and kindly. Don’t just go quiet.',
      'Thank them for something specific.',
      'Leave the door open if you mean it.',
    ],
  },
];

export const MENTOR_TOPICS: GuideTopic[] = [
  {
    id: 'first-conversation',
    title: 'Your first conversation',
    summary: 'Find out what would make this useful before you say what you can offer.',
    points: [
      'Ask what they want to develop, and be honest about what you can and can’t help with.',
      'Agree on a rhythm and on how to reach each other.',
      'Say what preparation you’d like to see.',
      'Agree on confidentiality, and on anything that’s off the table.',
    ],
  },
  {
    id: 'understand-first',
    title: 'Understand before you advise',
    summary: 'Advice lands better once you know the context.',
    points: [
      '“What are you trying to accomplish?”',
      '“What have you tried?”',
      '“What do you think the problem is?”',
      '“What would make this conversation useful?”',
      'If you’ve been talking for five minutes straight, stop and ask a question.',
    ],
  },
  {
    id: 'listening',
    title: 'Listening well',
    summary: 'The best mentors talk less than you’d expect.',
    points: [
      'Let them finish. Resist solving it in the first minute.',
      'Reflect back what you heard before you respond.',
      'Notice what they avoid saying as well as what they say.',
    ],
  },
  {
    id: 'questions',
    title: 'Questions that build judgment',
    summary: 'Help them reason, not just reach your answer.',
    points: [
      '“What makes you think that?”',
      '“What evidence would change your mind?”',
      '“What are you optimizing for?”',
      '“What would happen if you did nothing?”',
      '“What would you recommend if this were someone else’s decision?”',
    ],
  },
  {
    id: 'feedback',
    title: 'Giving useful feedback',
    summary: 'Observation, impact, next step.',
    points: [
      'Not “Be more concise.”',
      'Instead: “Your answer had strong substance, but it took almost two minutes to reach your main point. In an interview, that makes the listener work to find it. Try leading with the conclusion.”',
      'Be specific enough that they know exactly what to try next.',
    ],
  },
  {
    id: 'challenge',
    title: 'Challenging respectfully',
    summary: 'High standards and respect aren’t in tension.',
    points: [
      'Say: “I think you can take this one step further.”',
      'Not: “You clearly don’t understand this.”',
      'Criticize the work, not the person. Do it privately.',
    ],
  },
  {
    id: 'bias',
    title: 'Avoiding assumptions',
    summary: 'Ask rather than assume.',
    points: [
      'Judge the work and the effort, not background, accent, school, or where someone comes from.',
      'Your path worked for you. It may not be available, or right, for them.',
      'People start with different access and opportunities. Account for it.',
      'Give every mentee the same standard of attention and respect.',
    ],
  },
  {
    id: 'dependency',
    title: 'Supporting without creating dependency',
    summary: 'The goal is that they need you less over time.',
    points: [
      'Ask them to propose a plan before you offer yours.',
      'Point them to how to find answers, not just the answers.',
      'Notice when their judgment is getting better, and say so.',
    ],
  },
  {
    id: 'decisions',
    title: 'Helping them decide for themselves',
    summary: 'Your experience is perspective, not instruction.',
    points: [
      'Be clear about which is which: personal experience, professional knowledge, opinion, or a guess.',
      'Lay out tradeoffs rather than a single right answer.',
      'Respect the decision they make, even if it isn’t the one you’d make.',
    ],
  },
  {
    id: 'introductions',
    title: 'Making introductions responsibly',
    summary: 'Introduce someone only when you can stand behind them.',
    points: [
      'You’re never obligated to make an introduction.',
      'When you do, set context for both sides and let the other person opt in.',
      'Your reputation travels with the introduction. That’s why it matters.',
    ],
  },
  {
    id: 'outside-expertise',
    title: 'When it’s outside your expertise',
    summary: '“I don’t know enough about that to advise you” is good mentorship.',
    points: [
      'You’re not their therapist, doctor, lawyer, or financial adviser. Don’t act as one.',
      'Suggest where they could find qualified help.',
      'Admitting uncertainty builds more trust than guessing.',
    ],
  },
  {
    id: 'sensitive',
    title: 'Handling sensitive conversations',
    summary: 'Listen, ask, and keep it about their development.',
    points: [
      'On political, religious, or social disagreements: listen, ask questions, and separate facts from opinion.',
      'Don’t pressure anyone to adopt your beliefs. Agreement is never a requirement for mentorship.',
      'Never use an opportunity or introduction as leverage for anything.',
      'If they share something personal, don’t use it against them, and don’t repeat it.',
    ],
  },
  {
    id: 'ending',
    title: 'Pausing or ending a mentorship',
    summary: 'End it clearly and kindly.',
    points: [
      'If your availability changes, say so. Don’t fade out.',
      'Name what you saw them accomplish.',
      'Suggest a next step or another person if you can.',
    ],
  },
];

export const SAFETY_TOPICS: GuideTopic[] = [
  {
    id: 'boundaries',
    title: 'Professional boundaries',
    summary: 'Warm and personal, but always professional.',
    points: [
      'Mentorship never requires sharing private information. Share only what you’re comfortable with.',
      'Romantic or sexual advances are never appropriate in a mentorship.',
      'No gifts or money should change hands, and no one should ask for them.',
      'Disclose any conflict of interest, such as being involved in hiring them.',
    ],
  },
  {
    id: 'information',
    title: 'Private and confidential information',
    summary: 'Some things should never be shared.',
    points: [
      'Never share passwords or give access to your accounts.',
      'Don’t ask for or share financial details or private documents.',
      'Mentors: don’t share confidential employer information.',
      'What’s said in confidence stays in confidence, unless someone is at risk of harm.',
    ],
  },
  {
    id: 'recording',
    title: 'Recording and transcription',
    summary: 'Ask first. Every time.',
    points: [
      'Get clear consent from the other person before recording or transcribing any conversation.',
      'If they say no, don’t record. Take notes by hand instead.',
      'Never record covertly.',
      'Before Mentable’s session notes feature starts, it asks you to confirm that everyone has agreed.',
    ],
  },
  {
    id: 'meeting',
    title: 'Off-platform contact and meeting in person',
    summary: 'Move at a pace you’re both comfortable with.',
    points: [
      'Keeping messages on Mentable gives you a record if anything goes wrong.',
      'If you meet in person, pick a public place during the day, and tell someone where you’ll be.',
      'You never have to share a personal phone number or address.',
    ],
  },
  {
    id: 'harassment',
    title: 'Harassment, discrimination, or pressure',
    summary: 'You don’t have to put up with it.',
    points: [
      'Harassment, discrimination, coercion, and inappropriate requests are never acceptable.',
      'You can stop a conversation at any time.',
      'Use Report or Block from their profile or your message thread. Reports go to the Mentable team.',
      'If you’re in danger, contact local emergency services first.',
    ],
  },
  {
    id: 'minors',
    title: 'If a mentee is under 18',
    summary: 'Extra care applies.',
    points: [
      'If you learn a mentee is under 18, keep all communication on the platform and involve a parent or guardian.',
      'Never meet a minor alone in person.',
      'Contact the Mentable team if you have any concern.',
    ],
  },
];
