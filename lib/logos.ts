// ─────────────────────────────────────────────────────────────────────────────
// Logo utilities — maps organisation names to web domains for favicon icons.
// Uses Google's favicon service: no API key, no Next.js domain config needed.
// ─────────────────────────────────────────────────────────────────────────────

export const COMPANY_LOGO_DOMAINS: Record<string, string> = {
  'Wells Fargo': 'wellsfargo.com',
  // The brokerage arm is a distinct string on mentor entries. Without its own
  // key the prior-company chip silently renders nothing, because the lookup is
  // exact and case-sensitive.
  'Wells Fargo Advisors': 'wellsfargo.com',
  'Alyra Technology': 'alyratechnology.com',
  'Wells Fargo Corporate & Investment Banking': 'wellsfargo.com',
  'Morgan Stanley': 'morganstanley.com',
  'Goldman Sachs': 'goldmansachs.com',
  'J.P. Morgan': 'jpmorgan.com',
  'JPMorganChase': 'jpmorgan.com',
  'Bank of America': 'bankofamerica.com',
  'Citi': 'citi.com',
  'Deutsche Bank': 'db.com',
  'Evercore': 'evercore.com',
  'Houlihan Lokey': 'hl.com',
  'Jefferies': 'jefferies.com',
  'Piper Sandler': 'pipersandler.com',
  'William Blair': 'williamblair.com',
  'Citadel': 'citadel.com',
  'HPS Investment Partners': 'hpspartners.com',
  'SMBC': 'smbcgroup.com',
  'Fifth Third Securities': '53.com',
  'Bondway.ai': 'bondway.ai',
  'MyEyeDr.': 'myeyedr.com',
  'Beds for Kids': 'bedsforkids.org',
  // 'Keane Capital Management' is deliberately absent. keane.com returns a hard
  // 404 from the favicon service, so every visitor made a failing third-party
  // request and the card rendered a broken logo slot anyway. The firm's real
  // domain is not something to guess at — attaching the wrong company's mark to
  // a named person is worse than showing no mark. The card falls back cleanly.
  'Engineered Land Solutions': 'engineeredlandsolutions.com',
  'Wall Street Oasis': 'wallstreetoasis.com',
  'Envoy Capital Advisors': 'envoycapitaladvisors.com',
  'PlugVerse': 'plugverse.com',
  'Columbia Youth Adventurers': 'columbia.edu',
  'BlackGen Capital': 'blackgencapital.com',
  'McColl Partners': 'mccollpartners.com',
};

export const SCHOOL_LOGO_DOMAINS: Record<string, string> = {
  'University of North Carolina at Chapel Hill': 'unc.edu',
  'UNC Kenan-Flagler Business School': 'unc.edu',
  'UNC Kenan-Flagler Business School / University of North Carolina at Chapel Hill': 'unc.edu',
  'UNC Kenan-Flagler': 'unc.edu',
  'Columbia University': 'columbia.edu',
  'Duke University': 'duke.edu',
  'Georgetown University': 'georgetown.edu',
  'Queens University': 'queensu.ca',
  'UC Berkeley': 'berkeley.edu',
  'UC Berkeley · Haas': 'berkeley.edu',
  'UC Berkeley — Haas School of Business': 'berkeley.edu',
  'University of New Hampshire': 'unh.edu',
  'University of Minnesota': 'umn.edu',
  'University of Minnesota — Carlson School of Management': 'umn.edu',
  'University of Pennsylvania': 'upenn.edu',
};

export function faviconUrl(domain: string, size = 64): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

export function companyFaviconUrl(name: string): string | null {
  const domain = COMPANY_LOGO_DOMAINS[name];
  return domain ? faviconUrl(domain) : null;
}

export function schoolFaviconUrl(name: string): string | null {
  const domain = SCHOOL_LOGO_DOMAINS[name];
  return domain ? faviconUrl(domain) : null;
}
