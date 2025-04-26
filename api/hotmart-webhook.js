// api/hotmart-webhook.js
// --> Processa webhooks da Hotmart para autorizar usuários no Firestore

// Importa módulos necessários
const admin = require('firebase-admin');
const path = require('path'); // Necessário para resolver o caminho da chave

// Carrega variáveis de ambiente localmente (do .env na raiz) se não estiver em produção
if (process.env.NODE_ENV !== 'production') {
  try {
    // Tenta carregar do caminho relativo à pasta 'api'
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
    console.log('.env carregado para desenvolvimento (hotmart-webhook)');
  } catch (error) {
    console.warn('Arquivo .env não encontrado ou erro ao carregar (hotmart-webhook). Variáveis de ambiente do sistema/Vercel serão usadas.');
  }
}

// --- Inicialização do Firebase Admin SDK (v9 - JSON Direto da Vercel) ---
if (!admin.apps.length) { // Verifica se já não foi inicializado
  let credential;
  let serviceAccount = null; // Inicia como null

  // Tenta carregar localmente primeiro (para 'vercel dev')
  try {
    const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');
    serviceAccount = require(serviceAccountPath);
    console.log(`(${path.basename(__filename)}) [Debug] Usando chave de serviço LOCAL.`);
    credential = admin.credential.cert(serviceAccount);
  } catch (localError) {
    // Se falhar localmente, tenta usar a variável de ambiente JSON (ambiente Vercel)
    console.warn(`(${path.basename(__filename)}) [Debug] Chave local não encontrada (${localError.code || localError.message}). Usando variável de ambiente FIREBASE_SERVICE_ACCOUNT_JSON.`);

    const serviceAccountJSONString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    // Log para verificar se a variável JSON foi encontrada
    console.log(`(${path.basename(__filename)}) [Debug Val] FIREBASE_SERVICE_ACCOUNT_JSON: ${serviceAccountJSONString ? 'ENCONTRADO (Verificar conteúdo)' : 'NÃO ENCONTRADO'}`);

    if (serviceAccountJSONString) {
      console.log(`(${path.basename(__filename)}) [Debug] Variável FIREBASE_SERVICE_ACCOUNT_JSON encontrada. Tentando parsear...`);
      try {
        // Parseia a string JSON da variável de ambiente
        const serviceAccountJSON = JSON.parse(serviceAccountJSONString);

        // !!!!! LOG PARA VER O JSON PARSEADO (TEMPORÁRIO - OPCIONAL) !!!!!
        // console.log(`(${path.basename(__filename)}) [Debug JSON Parsed] Objeto parseado:`, JSON.stringify(serviceAccountJSON, null, 2));
        // !!!!! ------------------------------------------ !!!!!

        // Cria a credencial a partir do objeto JSON parseado
        credential = admin.credential.cert(serviceAccountJSON);
        console.log(`(${path.basename(__filename)}) [Debug] admin.credential.cert() executado com sucesso usando JSON da variável de ambiente.`);
      } catch (parseOrCertError) {
        console.error(`(${path.basename(__filename)}) [Debug] ERRO ao parsear JSON ou criar credencial a partir da variável de ambiente:`, parseOrCertError);
        // Loga a string original para ajudar a depurar erros de JSON.parse
        console.error(`(${path.basename(__filename)}) [Debug] String JSON recebida (início):`, serviceAccountJSONString?.substring(0, 100));
        throw new Error(`Falha ao processar FIREBASE_SERVICE_ACCOUNT_JSON: ${parseOrCertError.message}`);
      }
    } else {
      console.error(`(${path.basename(__filename)}) [Debug] ERRO: Variável de ambiente FIREBASE_SERVICE_ACCOUNT_JSON não encontrada.`);
      throw new Error("Nenhuma credencial do Firebase Admin encontrada (nem local, nem variável JSON).");
    }
  }

  // Inicializa o app com a credencial determinada
  try {
    admin.initializeApp({ credential });
    console.log(`(${path.basename(__filename)}) Firebase Admin SDK inicializado com sucesso.`);
  } catch (initError) {
     if (initError.code === 'app/duplicate-app') {
        console.warn(`(${path.basename(__filename)}) Firebase Admin SDK já inicializado.`);
    } else {
        console.error(`!!! (${path.basename(__filename)}) ERRO FATAL na chamada final de initializeApp:`, initError);
        throw new Error(`Falha na inicialização final do Firebase Admin: ${initError.message}`);
    }
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
         await userRef.set({ // Usa set com merge para garantir que o doc exista
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
