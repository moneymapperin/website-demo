export const DOMAIN_MAP: Record<string, string> = {
  // Banks & Financials
  hdfcbank: 'hdfcbank.com',
  hdfc: 'hdfc.com',
  sbi: 'sbi.co.in',
  sbin: 'sbi.co.in',
  icici: 'icicibank.com',
  axis: 'axisbank.com',
  kotak: 'kotak.com',
  pnbindia: 'pnbindia.in',
  bob: 'bankofbaroda.in',
  canara: 'canarabank.com',
  canbk: 'canarabank.com',
  idfc: 'idfcfirstbank.com',
  idfcfirst: 'idfcfirstbank.com',
  yesbank: 'yesbank.in',
  yesbk: 'yesbank.in',
  indusind: 'indusind.com',
  indusindbk: 'indusind.com',
  rbl: 'rblbank.com',
  bandhan: 'bandhanbank.com',

  // Stock Tickers & Large Caps
  reliance: 'reliance.com',
  tcs: 'tcs.com',
  infy: 'infosys.com',
  infosys: 'infosys.com',
  itc: 'itcportal.com',
  bhartiartl: 'airtel.in',
  airtel: 'airtel.in',
  bajfinance: 'bajajfinserv.in',
  bajajfinsv: 'bajajfinserv.in',
  larsentoubro: 'larsentoubro.com',
  asnpaint: 'asianpaints.com',
  maruti: 'marutisuzuki.com',
  titan: 'titan.co.in',
  hindalco: 'hindalco.com',
  tatasteel: 'tatasteel.com',
  tatamotors: 'tatamotors.com',
  tataconsum: 'tataconsumer.com',
  tatapower: 'tatapower.com',
  tata: 'tata.com',
  birla: 'adityabirla.com',
  mahindra: 'mahindra.com',
  adani: 'adani.com',
  jsw: 'jsw.in',
  vedanta: 'vedantalimited.com',
  sunpharma: 'sunpharma.com',
  cipla: 'cipla.com',
  drreddy: 'drreddys.com',
  divislab: 'divislabs.com',
  apollohosp: 'apollohospitals.com',
  hul: 'hul.co.in',
  nestleind: 'nestle.in',
  britannia: 'britannia.co.in',
  coalindia: 'coalindia.in',
  ntpc: 'ntpc.co.in',
  ongc: 'ongcindia.com',
  pfc: 'pfcindia.com',
  recltd: 'recindia.nic.in',
  gail: 'gailonline.com',
  ioc: 'iocl.com',
  bpcl: 'bharatpetroleum.in',
  hpcl: 'hindustampetroleum.com',
  zomato: 'zomato.com',
  paytm: 'paytm.com',
  nykaa: 'fsn.in',
  powergrid: 'powergrid.in',
  bajajauto: 'bajajauto.com',
  heromotoco: 'heromotocorp.com',
  eichermot: 'eicher.in',
  grasim: 'grasim.com',
  ultratech: 'ultratechcement.com',
  shreecem: 'shreecement.com',
  techm: 'techmahindra.com',
  wipro: 'wipro.com',
  hcltech: 'hcltech.com',
  mrftyres: 'mrf.com',
  pidilitind: 'pidilite.com',
  siemens: 'siemens.com',
  abb: 'abb.com',
  havells: 'havells.com',
  voltas: 'voltas.com',
  trent: 'trentlimited.com',
  bhel: 'bhel.in',
  bel: 'bel-india.in',
  hal: 'hal-india.co.in',
  mazagondoc: 'mazagondock.in',
  rvnl: 'rvnl.org',
  irfc: 'irfc.co.in',
  concor: 'concorindia.co.in',
  ltim: 'ltimindtree.com',
  ltimindtree: 'ltimindtree.com',
  oil: 'oil-india.com',
  ireda: 'ireda.in',
  nhpc: 'nhpcindia.com',
  sjvn: 'sjvn.nic.in',
  unionbank: 'unionbankofindia.co.in',
  indianb: 'indianbank.in',
  idbi: 'idbi.com',
  federalbnk: 'federalbank.co.in',
  aubank: 'aubank.in',
  karurvysya: 'kvb.co.in',
  southbank: 'southindianbank.com',
  csbbank: 'csb.co.in',
  dcbbank: 'dcbbank.com',
  equitas: 'equitasbank.com',
  uujjivan: 'ujjivansfb.in',

  // Insurance
  lic: 'licindia.in',
  niva: 'nivabupa.com',
  star: 'starhealth.in',
  care: 'careinsurance.com',
  max: 'maxlifeinsurance.com',
  hdfclife: 'hdfclife.com',
  icicipru: 'iciciprulife.com',
  sbilife: 'sbilife.co.in',

  // AMCs (Mutual Funds)
  miraeasset: 'miraeassetmf.co.in',
  mirae: 'miraeassetmf.co.in',
  nippon: 'nipponindiaim.com',
  dsp: 'dspim.com',
  quant: 'quantmutual.com',
  ppfas: 'amc.ppfas.com',
  motilal: 'motilaloswalmf.com',
  edelweiss: 'edelweissmf.com',
  uti: 'utimf.com',
  franklin: 'franklintempletonindia.com',
};

const SORTED_DOMAIN_KEYS = Object.keys(DOMAIN_MAP).sort((a, b) => b.length - a.length);

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/limited/g, '')
    .replace(/ltd/g, '')
    .replace(/pvt/g, '')
    .replace(/india/g, '')
    .replace(/\.ns/g, '')
    .replace(/\.bo/g, '')
    .replace(/nse:/g, '')
    .replace(/bse:/g, '')
    .replace(/\s+/g, '')
    .replace(/&/g, '');
}

export function getLogoUrl(name: string): string | null {
  if (!name) return null;
  const token = import.meta.env.VITE_LOGO_DEV_TOKEN || '';
  const cleanName = normalizeName(name);

  for (const key of SORTED_DOMAIN_KEYS) {
    if (cleanName.includes(key)) {
      return `https://img.logo.dev/${DOMAIN_MAP[key]}?token=${token}`;
    }
  }

  // Fallback for tickers: if the ORIGINAL name has length 3-10 and no space
  if (name.length >= 3 && name.length <= 10 && !name.includes(' ')) {
    return `https://img.logo.dev/${name.toLowerCase()}.com?token=${token}`;
  }

  return null;
}

export function getDomainFromLogoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    return segments.length > 0 ? segments[segments.length - 1] : null;
  } catch {
    return null;
  }
}

// 8-color palette identical to Flutter's Colors.blue, red, green, orange, purple, teal, indigo, pink
export const FALLBACK_COLORS: string[] = [
  '#2196F3', // blue
  '#F44336', // red
  '#4CAF50', // green
  '#FF9800', // orange
  '#9C27B0', // purple
  '#009688', // teal
  '#3F51B5', // indigo
  '#E91E63', // pink
];

export function getFallbackColor(name: string): string {
  if (!name) return FALLBACK_COLORS[0];
  const index = name.length % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[index];
}
