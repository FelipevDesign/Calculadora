// api/hotmart-webhook.js
// --> Processa webhooks da Hotmart para autorizar usuários no Firestore

// Importa módulos necessários
const admin = require('firebase-admin');
const path = require('path'); // Necessário para resolver o caminho da chave

// Carrega variáveis de ambiente localmente (do .env na raiz) se não estiver em produção
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
    console.log('.env carregado para desenvolvimento (hotmart-webhook)');
  } catch (error) {
    console.warn('Arquivo .env não encontrado ou erro ao carregar (hotmart-webhook). Variáveis de ambiente do sistema/Vercel serão usadas.');
  }
}

// --- Inicialização do Firebase Admin SDK (v4 - Debug Variáveis Vercel) ---
if (!admin.apps.length) { // Verifica se já não foi inicializado
  let credential;
  let serviceAccount = null; // Inicia como null

  // Tenta carregar localmente primeiro
  try {
    const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');
    serviceAccount = require(serviceAccountPath);
    console.log(`(${path.basename(__filename)}) [Debug] Chave de serviço LOCAL carregada com sucesso.`);
    credential = admin.credential.cert(serviceAccount);
  } catch (localError) {
    // Se falhar localmente, tenta usar variáveis de ambiente (ambiente Vercel/produção)
    console.warn(`(${path.basename(__filename)}) [Debug] Chave local não encontrada (${localError.code || localError.message}). Tentando variáveis de ambiente...`);

    // Log explícito das variáveis de ambiente que estamos procurando
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY; // Pega a chave "crua"

    console.log(`(${path.basename(__filename)}) [Debug] process.env.FIREBASE_PROJECT_ID: ${projectId ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
    console.log(`(${path.basename(__filename)}) [Debug] process.env.FIREBASE_CLIENT_EMAIL: ${clientEmail ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
    console.log(`(${path.basename(__filename)}) [Debug] process.env.FIREBASE_PRIVATE_KEY: ${privateKeyRaw ? 'ENCONTRADO (verificar conteúdo)' : 'NÃO ENCONTRADO'}`);

    // Verifica se TODAS as variáveis de ambiente necessárias existem
    if (projectId && clientEmail && privateKeyRaw) {
      console.log(`(${path.basename(__filename)}) [Debug] Inicializando Admin SDK com variáveis de ambiente FIREBASE_*`);
      try {
        credential = admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          // IMPORTANTE: Substitui '\\n' de volta para '\n' na chave privada
          privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
        });
         console.log(`(${path.basename(__filename)}) [Debug] admin.credential.cert() executado com sucesso.`);
      } catch(certError){
          console.error(`(${path.basename(__filename)}) [Debug] ERRO ao criar credencial com admin.credential.cert():`, certError);
           throw new Error("Falha ao criar credencial do Firebase Admin a partir das variáveis de ambiente.");
      }
    } else {
      console.error(`(${path.basename(__filename)}) [Debug] Faltam variáveis de ambiente FIREBASE_*. Nenhuma credencial válida encontrada.`);
      // Lança um erro se nenhuma credencial puder ser determinada
      throw new Error("Nenhuma credencial do Firebase Admin encontrada (local ou via variáveis de ambiente FIREBASE_*).");
    }
  }

  // Inicializa o app com a credencial determinada
  try {
    admin.initializeApp({ credential });
    console.log(`(${path.basename(__filename)}) Firebase Admin SDK inicializado com sucesso.`);
  } catch (initError) {
    console.error(`!!! (${path.basename(__filename)}) ERRO FATAL na chamada final de initializeApp:`, initError);
    throw new Error(`Falha na inicialização final do Firebase Admin: ${initError.message}`);
  }
}
// --------------------------------------------------------------------

const db = admin.firestore(); // Obtém instância do Firestore

// Exporta a função manipuladora para Vercel
module.exports = async (req, res) => {
  // 1. Segurança: Verificar Método e Token Secreto
  if (req.method !== 'POST') {
    console.warn('(hotmart-webhook) Método não permitido:', req.method);
    return res.status(405).send('Método não permitido');
  }

  const hotmartToken = process.env.HOTMART_SECRET_TOKEN;
  const requestToken = req.headers['hottok'];

  if (!hotmartToken || !requestToken || requestToken !== hotmartToken) {
    console.warn(`(hotmart-webhook) Tentativa de acesso não autorizado. Header hottok: ${requestToken || 'ausente'}`);
    return res.status(403).send('Acesso não autorizado.');
  }
  console.log('(hotmart-webhook) Token Hottok validado com sucesso.');

  // 2. Processar o corpo da requisição
  const payload = req.body;
  console.log('(hotmart-webhook) Payload recebido:', JSON.stringify(payload, null, 2));

  // 3. Extrair dados relevantes (Ajuste os caminhos se a estrutura da Hotmart mudar)
  const eventType = payload?.event;
  const buyerEmail = payload?.data?.buyer?.email?.toLowerCase(); // Normaliza para minúsculas
  const transactionId = payload?.data?.transaction;
  const purchaseDate = payload?.data?.purchase?.date || Date.now(); // Data da compra
  const status = payload?.data?.purchase?.status; // Status da compra

  if (!buyerEmail || !transactionId) {
    console.error('(hotmart-webhook) Webhook recebido sem buyer.email ou transaction.');
    return res.status(400).send('Dados essenciais ausentes no webhook (email ou transação).');
  }
   if (!eventType) {
      console.warn('(hotmart-webhook) Evento não encontrado no payload.');
   }

  console.log(`(hotmart-webhook) Processando evento '${eventType}' para ${buyerEmail} (Transação: ${transactionId}, Status: ${status})`);

  // 4. Lógica Principal: Adicionar/Atualizar usuário no Firestore
  try {
    const userRef = db.collection('authorizedUsers').doc(buyerEmail); // Usa o email como ID

    // Verifica eventos de aprovação
    if (eventType === 'PURCHASE_APPROVED' || status === 'approved') {
       console.log(`(hotmart-webhook) Autorizando usuário: ${buyerEmail}`);
       await userRef.set({
         email: buyerEmail,
         status: 'active',
         transactionId: transactionId,
         purchaseDate: new Date(purchaseDate),
         lastWebhookEvent: eventType || 'N/A',
         lastWebhookTimestamp: admin.firestore.FieldValue.serverTimestamp()
       }, { merge: true });
       console.log(`(hotmart-webhook) Usuário ${buyerEmail} autorizado/atualizado no Firestore.`);

    // Verifica eventos de cancelamento/reembolso
    } else if (['PURCHASE_CANCELED', 'PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK', 'PURCHASE_EXPIRED', 'PURCHASE_BILLET_PRINTED'].includes(eventType) ||
               ['canceled', 'refunded', 'chargeback', 'expired', 'billet_printed'].includes(status) ) {
        console.log(`(hotmart-webhook) Desativando/Atualizando status para ${buyerEmail} devido a evento/status: ${eventType || status}`);
         await userRef.set({
           email: buyerEmail,
           status: 'inactive',
           transactionId: transactionId,
           lastWebhookEvent: eventType || 'N/A',
           lastWebhookTimestamp: admin.firestore.FieldValue.serverTimestamp()
         }, { merge: true });
         console.log(`(hotmart-webhook) Status do usuário ${buyerEmail} atualizado para inativo.`);
    } else {
        console.log(`(hotmart-webhook) Evento Hotmart '${eventType}' (status: ${status}) ignorado para ${buyerEmail}.`);
    }

    // 5. Responder à Hotmart
    res.status(200).send('Webhook recebido com sucesso.');

  } catch (error) {
    console.error(`(hotmart-webhook) Erro CRÍTICO ao processar Firestore para ${buyerEmail}:`, error);
    res.status(500).send('Erro interno ao processar webhook.');
  }
};
