const COUNTRY_LANG = {
  BR:'pt', PT:'pt', AO:'pt', MZ:'pt', CV:'pt', GW:'pt', ST:'pt', TL:'pt',
  ES:'es', MX:'es', AR:'es', CO:'es', PE:'es', VE:'es', CL:'es', EC:'es',
  BO:'es', PY:'es', UY:'es', CR:'es', PA:'es', DO:'es', GT:'es', HN:'es',
  SV:'es', NI:'es', CU:'es', PR:'es', GQ:'es',
  RU:'ru', BY:'ru', KZ:'ru', KG:'ru', TJ:'ru', UZ:'ru', AM:'ru', AZ:'ru', GE:'ru',
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const country = (req.headers['x-vercel-ip-country'] || '').toUpperCase().trim();
  const lang = COUNTRY_LANG[country] || 'en';
  return res.status(200).json({ lang, country });
}
