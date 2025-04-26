// api/verify-email.js
// --> Verifica se um email está autorizado no Firestore
// --> Acessível em https://SEU_APP.vercel.app/api/verify-email

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '../.env' });
}
const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
    console.log('Firebase Admin SDK inicializado (verify-email).');
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin SDK (verify-email):', error);
     return (req, res) => { res.status(500).json({ error: 'Erro interno do servidor (Firebase init).' }); }
  }
}
const db = admin.firestore();

module.exports = async (req, res) => {
  // Permite apenas GET ou POST (para enviar email no corpo)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Pega o email da query string (GET: /api/verify-email?email=...)
  // ou do corpo da requisição (POST)
  const emailToVerify = req.query.email || req.body?.email;

  if (!emailToVerify) {
    return res.status(400).json({ error: 'Email não fornecido.' });
  }

  console.log(`Verificando autorização para: ${emailToVerify}`);

  try {
    const userRef = db.collection('authorizedUsers').doc(emailToVerify);
    const docSnap = await userRef.get();

    if (docSnap.exists && docSnap.data()?.status === 'active') {
      // Email encontrado e ativo!
      console.log(`Email ${emailToVerify} está autorizado.`);
      res.status(200).json({ authorized: true });
    } else {
      // Email não encontrado ou não está ativo
      console.log(`Email ${emailToVerify} NÃO está autorizado.`);
      res.status(403).json({ authorized: false, message: 'Email não autorizado ou pagamento não confirmado.' });
    }
  } catch (error) {
    console.error(`Erro ao verificar email ${emailToVerify} no Firestore:`, error);
    res.status(500).json({ error: 'Erro interno ao verificar autorização.' });
  }
};