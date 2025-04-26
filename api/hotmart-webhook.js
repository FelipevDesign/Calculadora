// api/hotmart-webhook.js
// --> Esta função será acessível em https://SEU_APP.vercel.app/api/hotmart-webhook

// Carrega variáveis de ambiente localmente (em produção, Vercel injeta)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '../.env' }); // Ajusta path se necessário
}

// Importa o SDK Admin do Firebase
const admin = require('firebase-admin');

// Inicializa o Firebase Admin SDK (APENAS UMA VEZ)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // Credenciais são carregadas automaticamente pela variável de ambiente
      // GOOGLE_APPLICATION_CREDENTIALS no Vercel ou do .env localmente
      credential: admin.credential.applicationDefault(),
      // databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com` // Se usar Realtime DB
    });
    console.log('Firebase Admin SDK inicializado.');
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin SDK:', error);
    // Retorna erro 500 se a inicialização falhar
     return (req, res) => { // Função dummy para retornar erro
         res.status(500).send('Erro interno do servidor (Firebase init).');
     }
  }
}

const db = admin.firestore(); // Obtém instância do Firestore

// Exporta a função manipuladora para Vercel
module.exports = async (req, res) => {
  // 1. Segurança: Verificar se é POST e se tem o token secreto da Hotmart
  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

  // Obtenha seu Hottok da configuração do Webhook na Hotmart
  const hotmartToken = process.env.HOTMART_SECRET_TOKEN;
  const requestToken = req.headers['hottok']; // Header enviado pela Hotmart

  if (!hotmartToken || !requestToken || requestToken !== hotmartToken) {
    console.warn('Tentativa de acesso não autorizado ao webhook.');
    return res.status(403).send('Acesso não autorizado.');
  }

  // 2. Processar o corpo da requisição (payload da Hotmart)
  const payload = req.body;
  console.log('Webhook Hotmart recebido:', JSON.stringify(payload, null, 2));

  // 3. Extrair dados relevantes (ajuste os nomes dos campos conforme a documentação da Hotmart)
  const eventType = payload.event; // Ex: PURCHASE_APPROVED, PURCHASE_CANCELED
  const buyerEmail = payload.data?.buyer?.email;
  const transactionId = payload.data?.transaction;
  const purchaseDate = payload.data?.purchase_date || Date.now(); // Data da compra
  const status = payload.data?.status; // Ex: approved, canceled, refunded

  if (!buyerEmail || !transactionId) {
    console.error('Webhook recebido sem email ou ID de transação.');
    return res.status(400).send('Dados incompletos no webhook.');
  }

  // 4. Lógica Principal: Adicionar/Atualizar usuário no Firestore
  try {
    const userRef = db.collection('authorizedUsers').doc(buyerEmail); // Usa o email como ID do documento

    if (eventType === 'PURCHASE_APPROVED' || status === 'approved') {
       console.log(`Autorizando usuário: ${buyerEmail}`);
       await userRef.set({
         email: buyerEmail,
         status: 'active', // Marca como ativo
         transactionId: transactionId,
         purchaseDate: new Date(purchaseDate),
         lastWebhookEvent: eventType,
         lastWebhookTimestamp: admin.firestore.FieldValue.serverTimestamp() // Data/Hora do processamento
       }, { merge: true }); // Merge: true atualiza ou cria se não existir
       console.log(`Usuário ${buyerEmail} autorizado/atualizado no Firestore.`);

    } else if (['PURCHASE_CANCELED', 'PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK'].includes(eventType) || ['canceled', 'refunded', 'chargeback'].includes(status) ) {
        console.log(`Desativando usuário: ${buyerEmail}`);
        // Remove ou marca como inativo (marcar é mais seguro para histórico)
         await userRef.update({
           status: 'inactive', // Marca como inativo
           lastWebhookEvent: eventType,
           lastWebhookTimestamp: admin.firestore.FieldValue.serverTimestamp()
         });
         console.log(`Usuário ${buyerEmail} marcado como inativo.`);
    } else {
        console.log(`Evento Hotmart ignorado: ${eventType}`);
    }

    // 5. Responder à Hotmart que o webhook foi recebido com sucesso
    res.status(200).send('Webhook recebido com sucesso.');

  } catch (error) {
    console.error(`Erro ao processar webhook para ${buyerEmail}:`, error);
    // Informa a Hotmart que houve um erro (ela pode tentar reenviar)
    res.status(500).send('Erro interno ao processar webhook.');
  }
};