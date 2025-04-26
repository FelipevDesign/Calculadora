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

// --- Inicialização do Firebase Admin SDK (v5 - Log Values) ---
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

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY; // Pega a chave "crua"

    // --- DETAILED VALUE LOGGING ---
    console.log(`(${path.basename(__filename)}) [Debug Val] FIREBASE_PROJECT_ID: (${typeof projectId}) "${projectId}"`);
    console.log(`(${path.basename(__filename)}) [Debug Val] FIREBASE_CLIENT_EMAIL: (${typeof clientEmail}) "${clientEmail}"`);
    // Log only the start/end/length of the private key to avoid exposing it fully in logs
    const pkSnippet = privateKeyRaw ? `${privateKeyRaw.substring(0, 20)}...${privateKeyRaw.substring(privateKeyRaw.length - 20)}` : 'N/A';
    console.log(`(${path.basename(__filename)}) [Debug Val] FIREBASE_PRIVATE_KEY: (${typeof privateKeyRaw}) Length=${privateKeyRaw?.length || 0}, Snippet="${pkSnippet}"`);
    // ------------------------------


    // Verifica se TODAS as variáveis de ambiente necessárias existem E têm valor (são "truthy")
    if (projectId && clientEmail && privateKeyRaw) {
      console.log(`(${path.basename(__filename)}) [Debug] Todas as variáveis encontradas e não vazias. Tentando criar credencial...`);
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
           throw new Error(`Falha ao criar credencial do Firebase Admin a partir das variáveis de ambiente: ${certError.message}`); // Include inner error
      }
    } else {
      // Loga qual variável está faltando ou vazia
       let missingVars = [];
       if (!projectId) missingVars.push("FIREBASE_PROJECT_ID");
       if (!clientEmail) missingVars.push("FIREBASE_CLIENT_EMAIL");
       if (!privateKeyRaw) missingVars.push("FIREBASE_PRIVATE_KEY");
      console.error(`(${path.basename(__filename)}) [Debug] ERRO: Variáveis ausentes/vazias: ${missingVars.join(', ')}. Nenhuma credencial válida encontrada.`);
      throw new Error("Nenhuma credencial do Firebase Admin encontrada (variáveis de ambiente ausentes/vazias)."); // More specific error
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
// --- FIM DO BLOCO DE INICIALIZAÇÃO ---


const db = admin.firestore(); // Obtém instância do Firestore (DEVE vir depois da inicialização)

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
         await userRef.set({ // Usa set com merge para garantir que o doc exista se o webhook de cancelamento chegar antes do de aprovação
           email: buyerEmail, // Garante que o email esteja lá
           status: 'inactive', // Marca como inativo
           transactionId: transactionId, // Atualiza a transação relacionada
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
