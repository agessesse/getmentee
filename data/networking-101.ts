/**
 * Networking 101 content that is data rather than prose: templates, the
 * question bank, the timeline, checklists, common mistakes.
 *
 * Voice: a smart friend a few years ahead who explains professional norms
 * without making anyone feel behind. Principles over rules. Where a convention
 * belongs to one field (usually finance recruiting), it's labelled as such in
 * the page, not stated as universal etiquette. Placeholders are in [brackets];
 * nothing here refers to a real person, school, or club.
 */

export interface Template {
  id: string;
  title: string;
  when: string;
  text: string;
}

export const TEMPLATES: Template[] = [
  {
    id: 'alumni',
    title: 'Reaching out to an alum',
    when: 'Someone who went to your school and works in a field you’re exploring.',
    text: `Subject: [Your university] first-year interested in [field]

Hi [First name],

I’m [Your name], a first-year at [Your university] studying [major]. I’m starting to explore [field], and I noticed you [a specific, true detail about their path].

I’d love to hear how you figured out it was the right path for you. If you have 20 minutes sometime in the next couple of weeks, I’m happy to work around your schedule.

Thanks so much for considering it.

[Your name]
[Your university] ’[Year] · [Major]`,
  },
  {
    id: 'upperclassman',
    title: 'Reaching out to an upperclassman',
    when: 'A student a year or two ahead who did something you’re considering.',
    text: `Subject: Quick question about [club / internship / recruiting]

Hi [First name],

I’m [Your name], a first-year in [club or major]. [Mutual person] mentioned you [did the internship / went through recruiting for field] last year.

I’m trying to figure out whether [thing] is right for me. Would you be up for coffee or a quick call sometime in the next few weeks? Totally understand if things are busy.

Thanks!
[Your name]`,
  },
  {
    id: 'linkedin',
    title: 'LinkedIn message',
    when: 'When you can’t find an email address. Connection notes are short, so keep it tight.',
    text: `Hi [First name], I’m a first-year at [Your university] exploring [field]. I noticed you [specific detail]. Would you be open to a short chat sometime? I’d love to hear how you got started. Thank you!`,
  },
  {
    id: 'intro',
    title: 'Asking for an introduction',
    when: 'Someone you already know mentioned a person worth talking to.',
    text: `Subject: Would you be comfortable introducing me to [Name]?

Hi [First name],

Thanks again for [something they did for you]. You mentioned [Name] works on [team or area]. I’m trying to learn more about [topic], and I think their experience would really help.

If you’re comfortable with it, would you be willing to introduce us? I’ve added a short note below you can forward, so it’s easy. And no worries at all if the timing isn’t right.

Note to forward:
“[Your name] is a [year] at [Your university] exploring [field]. They’d love 20 minutes to hear about your path into [area].”

Thanks,
[Your name]`,
  },
  {
    id: 'thanks',
    title: 'Thank-you note',
    when: 'Within a day or so of the conversation.',
    text: `Subject: Thank you

Hi [First name],

Thank you for taking the time to talk today. Hearing how [something specific they said] really helped me think about [your question].

I’m going to [the thing you’ll do next], and I’ll let you know how it goes.

Thanks again,
[Your name]`,
  },
  {
    id: 'no-response',
    title: 'Following up when you haven’t heard back',
    when: 'About a week after your first message.',
    text: `Hi [First name],

I wanted to follow up on my note from last week in case it got buried. I’d still love to hear about your experience with [topic] if you have 20 minutes in the coming weeks. If now isn’t a good time, no worries at all.

Thanks,
[Your name]`,
  },
  {
    id: 'update',
    title: 'Staying in touch with an update',
    when: 'When their advice led somewhere.',
    text: `Subject: An update since we talked

Hi [First name],

When we talked in [month], you suggested I [their advice]. I did that this [month or semester], and [what happened].

It helped me realize [what you learned]. Thanks again for pointing me in that direction. I hope [something relevant to them] is going well.

Best,
[Your name]`,
  },
];

export const TERMS: { term: string; meaning: string }[] = [
  { term: 'Coffee chat', meaning: 'An informal professional conversation, usually 15–30 minutes, where you learn about someone’s experience, career, company, or industry. It might happen over coffee, by phone, or on video. It usually isn’t an interview, but you should still come prepared. You may also hear it called an informational interview.' },
  { term: 'Alumnus, alumna, alumni', meaning: 'Someone who graduated from your school. Alumni is the plural. Shared school ties give you a natural reason to reach out.' },
  { term: 'Analyst, associate', meaning: 'Common early-career job titles, especially in finance and consulting. Usually someone in their first few years after college or graduate school.' },
  { term: 'VP, director, partner, managing director', meaning: 'More senior titles. They vary by industry, so don’t worry about the exact ranking.' },
  { term: 'Recruiter', meaning: 'Someone whose job is hiring. They know application processes, timelines, eligibility, and programs, but usually not what a specific team’s day-to-day work is like.' },
  { term: 'Referral', meaning: 'When someone at an organization recommends you for a role. It comes from a real relationship and is never owed.' },
];

export const LADDER: { who: string; why: string }[] = [
  { who: 'Peers', why: 'Your classmates matter. Some will work at companies you’re curious about, start businesses, go to graduate school, and introduce you to people. Networking isn’t only something you do upward.' },
  { who: 'Upperclassmen', why: 'Often the easiest place to start. They recently went through the same classes, clubs, applications, interviews, and internships, and can explain it in plain language.' },
  { who: 'Alumni', why: 'People who graduated from your school. The shared connection gives you a natural reason to reach out, and many are glad to help students from their school.' },
  { who: 'Early-career professionals', why: 'Analysts, associates, and others in their first few years. The best people to ask about recruiting, interviews, day-to-day work, team culture, and internships.' },
  { who: 'Senior professionals', why: 'Useful for career perspective, how an industry is changing, leadership, and long-term decisions. More senior doesn’t automatically mean more helpful for your question.' },
  { who: 'Recruiters', why: 'Ask them about application processes, timelines, eligibility, programs, and recruiting events.' },
  { who: 'Mentors', why: 'A networking conversation may happen once. A mentorship develops over time, with the same person helping you think through decisions as they come up.' },
];

export const CONNECTIONS = [
  'Same university', 'Same hometown', 'Same student organization', 'Similar major', 'Similar career interest',
  'Same scholarship or program', 'Shared internship', 'An unusual shared interest', 'A career change you want to understand',
];

export const SEND_CHECKLIST = [
  'I know why I’m contacting this person.',
  'I looked at their background.',
  'My message is short.',
  'I explained the connection.',
  'My ask is clear.',
  'I checked their name, title, and organization.',
  'I proofread it.',
  'If it’s recruiting-related, my résumé is attached as a one-page PDF.',
];

export const FIVE_MINUTE_CHECKLIST = [
  'Open their profile.',
  'Review your questions.',
  'Run through your 30-second introduction.',
  'Have somewhere to take notes.',
  'Silence notifications.',
  'Check your microphone, link, or location.',
];

export const QUESTION_BANK: { group: string; questions: string[] }[] = [
  { group: 'Career path', questions: ['How did you decide on [field] in the first place?', 'What was the hardest decision along the way?', 'What would you do differently if you were starting over?'] },
  { group: 'Their role', questions: ['What does a typical week look like, and what takes up most of your time?', 'What skills matter most in your role that you didn’t expect?'] },
  { group: 'Company or team', questions: ['How would you describe the culture on your team?', 'What kind of people tend to do well there?'] },
  { group: 'The industry', questions: ['What’s changing in [field] right now, and how does it affect your work?'] },
  { group: 'Recruiting', questions: ['What did the recruiting process look like for you?', 'What helped most when you were preparing for interviews?'] },
  { group: 'Shared experiences', questions: ['How did [club or class] shape what you did next?', 'What do you wish you’d done differently in college?'] },
  { group: 'Advice', questions: ['What would you focus on if you were in my position right now?', 'Is there anything you’d suggest I read or try?'] },
  { group: 'Outside work, when it fits', questions: ['What do you enjoy outside of work?', 'How do you like living in [city]?'] },
];

export const FINANCE_QUESTIONS = [
  'How much of your time is client-facing?',
  'Could you tell me about a recent deal and what your role was?',
  'How does the workload change over the course of a deal?',
  'What skills from your first year matter most now?',
];

export const TIMELINE = [
  { year: 'First year', verb: 'Explore', points: ['Meet peers, upperclassmen, professors, alumni, and a few professionals.', 'Learn what careers exist. Most people discover options they didn’t know about.', 'Practice having professional conversations while the stakes are low.'] },
  { year: 'Sophomore year', verb: 'Narrow', points: ['Start understanding specific industries and how their recruiting works.', 'Go deeper with the people whose paths interest you.', 'Pursue internships, research, or projects that test your interests.'] },
  { year: 'Junior year', verb: 'Execute', points: ['Recruit intentionally for the paths you’ve chosen.', 'Prepare for internships and interviews.', 'Build relationships with people on the team or at the organization you’re joining.'] },
  { year: 'Senior year', verb: 'Maintain', points: ['Keep your relationships alive.', 'Help younger students the way others helped you.', 'Prepare for the move into full-time work or graduate school.'] },
];

export const GOES_WRONG: { title: string; body: string }[] = [
  { title: 'They’re late', body: 'Wait patiently. People get pulled into meetings. After about 10 minutes, send a short, friendly note: “Just checking in. Happy to reschedule if today got busy.”' },
  { title: 'They need to reschedule', body: 'Be flexible and gracious. It happens often and says nothing about you.' },
  { title: 'You need to reschedule', body: 'Apologize, give as much notice as you can, and offer two or three alternative times.' },
  { title: 'You don’t know an answer', body: 'That’s fine. A coffee chat isn’t an interview unless they tell you it is. “I haven’t thought about that yet, but I’d like to” is a good answer.' },
  { title: 'You stumble over your words', body: 'Keep going. They won’t remember it. They’ll remember whether you were curious and kind.' },
  { title: 'The conversation gets awkward', body: 'Turn back to them: “How did you end up choosing [their path]?” People enjoy talking about their own experience.' },
  { title: 'You accidentally go over time', body: 'Say so and give them an easy way out: “I realize we’re past time. I don’t want to keep you.”' },
  { title: 'They never respond', body: 'Follow up once or twice, then move on without resentment. It’s rarely about you, and there are plenty of other people to learn from.' },
];

export const MISTAKES: { title: string; body: string }[] = [
  { title: 'Sending the same message to everyone', body: 'People can tell.' },
  { title: 'Writing an autobiography', body: 'Your first message doesn’t need your life story.' },
  { title: 'Asking questions you could look up', body: 'Use the time for what only their experience can answer.' },
  { title: 'Trying too hard to impress', body: 'Curiosity beats performance.' },
  { title: 'Asking for a job right away', body: 'Build context first.' },
  { title: 'Not listening', body: 'A question list is a safety net, not a script.' },
  { title: 'Ignoring the clock', body: 'Respect the time they offered.' },
  { title: 'Taking advice and disappearing', body: 'Close the loop.' },
  { title: 'Only contacting senior people', body: 'Peers and recent graduates often help the most.' },
  { title: 'Treating it like a numbers game', body: 'Ten real relationships matter more than hundreds of shallow contacts.' },
];
