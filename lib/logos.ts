// ─────────────────────────────────────────────────────────────────────────────
// Logo utilities — maps organisation names to web domains for favicon icons.
// Uses Google's favicon service: no API key, no Next.js domain config needed.
// ─────────────────────────────────────────────────────────────────────────────

export const COMPANY_LOGO_DOMAINS: Record<string, string> = {
  'Wells Fargo': 'wellsfargo.com',
  'Wells Fargo Corporate & Investment Banking': 'wellsfargo.com',
  'Morgan Stanley': 'morganstanley.com',
  'Goldman Sachs': 'goldmansachs.com',
  'J.P. Morgan': 'jpmorgan.com',
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
  'Keane Capital Management': 'keane.com',
  'Envoy Capital Advisors': 'envoycapitaladvisors.com',
  'PlugVerse': 'plugverse.com',
  'Columbia Youth Adventurers': 'columbia.edu',
  'BlackGen Capital': 'blackgencapital.com',
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
