export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { username } = req.query;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    const resolveRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ usernames: [username.trim()], excludeBannedUsers: false }),
    });

    if (!resolveRes.ok) {
      return res.status(502).json({ error: 'Roblox API unavailable' });
    }

    const resolveData = await resolveRes.json();

    if (!resolveData.data || resolveData.data.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = resolveData.data[0];

    const userRes = await fetch(`https://users.roblox.com/v1/users/${user.id}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!userRes.ok) {
      return res.status(502).json({ error: 'Could not fetch user details' });
    }

    const userData = await userRes.json();

    const created = new Date(userData.created);
    const now = new Date();
    const days = Math.floor((now - created) / (1000 * 60 * 60 * 24));

    return res.status(200).json({
      id: userData.id,
      name: userData.name,
      displayName: userData.displayName,
      days,
      eligible: days >= 80,
    });
  } catch (err) {
    console.error('check-account error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
