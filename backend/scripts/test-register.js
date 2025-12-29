// backend/scripts/test-register.js
// Usage: node test-register.js
// Node 18+ recommended (global fetch). If you have older Node, run via curl or Postman.

const API = process.env.API_URL || 'http://localhost:4000/api';

async function run() {
  try {
    const unique = Date.now();
    const payload = {
      nomComplet: `Test User ${unique}`,
      email: `test.user.${unique}@local.test`,
      // send phoneE164 as frontend does (+226....)
      phoneE164: '+22670123456',
      password: 'TestPass123!',
      pin: '1234'
    };

    console.log('Envoi POST', `${API}/auth/register`, 'avec payload:', payload);

    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const body = await res.json().catch(() => ({}));
    console.log('Status /auth/register:', res.status);
    console.log('Body:', body);

    if (!res.ok) {
      console.error('Inscription échouée — vérifier le backend ou le payload.');
      return process.exit(1);
    }

    const token = body.token;
    if (!token) {
      console.error('Aucun token retourné — impossible de vérifier le PIN automatiquement.');
      return process.exit(1);
    }

    // Vérifier le PIN via /api/wallet/verify-pin
    const verifyRes = await fetch(`${API}/wallet/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ pin: payload.pin })
    });

    const verifyBody = await verifyRes.json().catch(() => ({}));
    console.log('Status /wallet/verify-pin:', verifyRes.status);
    console.log('Body:', verifyBody);

    if (verifyRes.ok && verifyBody.valide) {
      console.log('✅ Le PIN fourni à l\'inscription est bien accepté par le backend (PIN stocké et haché).');
    } else {
      console.warn('⚠️ Le backend n\'a pas validé le PIN. Vérifier que `authController.register` stocke le PIN dans le Wallet.');
    }
  } catch (err) {
    console.error('Erreur de test:', err);
    process.exit(1);
  }
}

run();
