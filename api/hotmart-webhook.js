// api/hotmart-webhook.js
// --> Processa webhooks da Hotmart para autorizar usuários no Firestore

endido. Aqui estão os códigos completos dos dois arquivos API com o log de depuração da chave decodificada adicionado// Importa módulos necessários
const admin = require('firebase-admin');
const path = require('path'); //.

**Lembrete Importante:** Este código imprimirá sua chave privada nos logs da Vercel. Use Necessário para resolver o caminho da chave

// Carrega variáveis de ambiente localmente (do .env na raiz) se não estiver-o apenas para um teste rápido e exclua os logs imediatamente depois!

**1. `api/hotmart-webhook em produção
if (process.env.NODE_ENV !== 'production') {
  try {
    // Tenta carregar do caminho relativo à pasta 'api'
    require('dotenv').config({ path: path.resolve.js` (Completo com Log de Chave Decodificada)**

```javascript
// api/hotmart(__dirname, '../.env') });
    console.log('.env carregado para desenvolvimento (hotmart-webhook-webhook.js
// --> Processa webhooks da Hotmart para autorizar usuários no Firestore

// Importa módulos necessários
)');
  } catch (error) {
    console.warn('Arquivo .env não encontrado ou erro ao carconst admin = require('firebase-admin');
const path = require('path'); // Necessário para resolver o caminhoregar (hotmart-webhook). Variáveis de ambiente do sistema/Vercel serão usadas.');
  }
 da chave

// Carrega variáveis de ambiente localmente (do .env na raiz) se não estiver em produção
}

// --- Inicialização do Firebase Admin SDK (v7 - LOG DECODED KEY) ---
if (!admin.appsif (process.env.NODE_ENV !== 'production') {
  try {
    // Tenta carregar do caminho relativo à pasta 'api'
    require('dotenv').config({ path: path.resolve(__dirname, '../..length) { // Verifica se já não foi inicializado
  let credential;
  let serviceAccount = null; // Inicia como null

  // Tenta carregar localmente primeiro
  try {
    const serviceenv') });
    console.log('.env carregado para desenvolvimento (hotmart-webhook)');
  } catchAccountPath = path.resolve(__dirname, '../firebase-service-account.json');
    serviceAccount = require (error) {
    console.warn('Arquivo .env não encontrado ou erro ao carregar (hotmart-webhook). Variáveis de ambiente do sistema/Vercel serão usadas.');
  }
}

// --- Inicial(serviceAccountPath);
    console.log(`(${path.basename(__filename)}) [Debug] Chave deização do Firebase Admin SDK (v7 - LOG DECODED KEY) ---
if (!admin.apps.length) { serviço LOCAL carregada com sucesso.`);
    credential = admin.credential.cert(serviceAccount);
  } catch (localError) {
    // Se falhar localmente, tenta usar variáveis de ambiente
    console.warn // Verifica se já não foi inicializado
  let credential;
  let serviceAccount = null; // Inicia como null

  // Tenta carregar localmente primeiro
  try {
    const serviceAccountPath = path(`(${path.basename(__filename)}) [Debug] Chave local não encontrada (${localError.code || localError.message}). Usando variáveis de ambiente...`);

    const projectId = process.env.FIREBASE_PROJECT_ID;
.resolve(__dirname, '../firebase-service-account.json');
    serviceAccount = require(serviceAccountPath    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyBase64);
    console.log(`(${path.basename(__filename)}) [Debug] Chave de serviço LOCAL carregada com sucesso.`);
    credential = admin.credential.cert(serviceAccount);
  } catch (localError) = process.env.FIREBASE_PRIVATE_KEY; // Espera Base64

    console.log(`(${path {
    // Se falhar localmente, tenta usar variáveis de ambiente (ambiente Vercel/produção).basename(__filename)}) [Debug Val] FIREBASE_PROJECT_ID: (${typeof projectId}) "${projectId}"`);
    console.warn(`(${path.basename(__filename)}) [Debug] Chave local não encontrada (${localError
    console.log(`(${path.basename(__filename)}) [Debug Val] FIREBASE_CLIENT_EMAIL: (${typeof clientEmail}) "${clientEmail}"`);
    console.log(`(${path.basename(__filename)}) [.code || localError.message}). Usando variáveis de ambiente...`);

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
Debug Val] FIREBASE_PRIVATE_KEY (Base64): ${privateKeyBase64 ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);

    if (projectId && clientEmail && privateKey    const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY; // Espera Base64Base64) {
      console.log(`(${path.basename(__filename)}) [Debug] Todas as variáveis

    // --- DETAILED VALUE LOGGING ---
    console.log(`(${path.basename(__filename)}) [Debug (Base64) encontradas. Tentando decodificar...`);
      let privateKeyDecoded; // Val] FIREBASE_PROJECT_ID: (${typeof projectId}) "${projectId}"`);
    console.log(`(${path.basename(__filename)}) [Debug Val] FIREBASE_CLIENT_EMAIL: (${typeof clientEmail}) "${client Mover declaração para fora do try/catch
      try {
        // --- DECODIFICA A CHAVE PRIVADA BASE64 ---
        privateKeyDecoded = Buffer.from(privateKeyBase64, 'Email}"`);
    // Log only the start/end/length of the private key to avoid exposing it fully in logsbase64').toString('utf8');
        // -----------------------------------------

        // !!!!! TEMPORARY DEBUG
    const pkSnippet = privateKeyBase64 ? `${privateKeyBase64.substring(0,  LOG - REMOVE AFTER TEST !!!!!
        console.log(`(${path.basename(__filename)}) [Debug Key] Chave20)}...${privateKeyBase64.substring(privateKeyBase64.length - 20)}` : 'N/A';
    console.log(`(${path.basename(__filename)}) [Debug Val Decodificada:\n${privateKeyDecoded}\n[Fim Chave Decodificada]`);
        // !!!!! ] FIREBASE_PRIVATE_KEY (Base64): (${typeof privateKeyBase64}) Length=${privateKeyBase--------------------------------------- !!!!!

        console.log(`(${path.basename(__filename)}) [Debug] Decodificação concluída64?.length || 0}, Snippet="${pkSnippet}"`);
    // ------------------------------


    // Verifica. Tentando criar credencial...`);
        credential = admin.credential.cert({
          projectId: projectId, se TODAS as variáveis de ambiente necessárias existem E têm valor (são "truthy")
    if (projectId
          clientEmail: clientEmail,
          privateKey: privateKeyDecoded, // Usa a chave decodificada
        });
         console.log(`(${path.basename(__filename)}) [Debug] admin.credential. && clientEmail && privateKeyBase64) {
      console.log(`(${path.basename(__filename)}) [Debug] Todas as variáveis (Base64) encontradas. Tentando decodificar...`);
      letcert() executado com sucesso.`);

      } catch(decodeOrCertError){
          // Loga o erro, seja da decodificação ou do cert()
          console.error(`(${path.basename(__filename)}) [Debug privateKeyDecoded; // Mover declaração para fora do try/catch
      try {
        // --- DECOD] ERRO durante decodificação ou criação de credencial:`, decodeOrCertError);
          // Se o erro foi noIFICA A CHAVE PRIVADA BASE64 ---
        privateKeyDecoded = Buffer.from(privateKey cert(), privateKeyDecoded pode ter um valor, mas ser inválido
          // Se foi no Buffer.from, privateBase64, 'base64').toString('utf8');
        // -----------------------------------------

        //KeyDecoded pode ser undefined
          if (!privateKeyDecoded) {
              console.error(`(${path !!!!! TEMPORARY DEBUG LOG - REMOVE AFTER TEST !!!!!
        console.log(`(${path.basename(__filename)}) [Debug Key] Chave Decodificada:\n${privateKeyDecoded}\n[Fim Chave Decodificada].basename(__filename)}) [Debug] Falha ocorreu DURANTE a decodificação Base64.`);
              throw new Error(``);
        // !!!!! --------------------------------------- !!!!!

        console.log(`(${path.basename(__filename)}) [Falha ao decodificar FIREBASE_PRIVATE_KEY (Base64): ${decodeOrCertError.message}`);
          } else {
               console.error(`(${path.basename(__filename)}) [Debug] Falha ocorreu em adminDebug] Decodificação concluída. Tentando criar credencial...`);
        credential = admin.credential.cert({
          .credential.cert() APÓS decodificação.`);
               throw new Error(`Falha ao criar credencial do Firebase AdminprojectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKeyDecoded, // Usa (chave decodificada pode ser inválida): ${decodeOrCertError.message}`);
          }
      }
     a chave decodificada
        });
         console.log(`(${path.basename(__filename)}) [Debug] admin.credential.cert() executado com sucesso.`);

      } catch(decodeOrCertError){
          //} else {
       let missingVars = [];
       if (!projectId) missingVars.push("FIREBASE_PROJECT_ID");
       if (!clientEmail) missingVars.push("FIREBASE_CLIENT_EMAIL");
 Loga o erro, seja da decodificação ou do cert()
          console.error(`(${path.basename(__       if (!privateKeyBase64) missingVars.push("FIREBASE_PRIVATE_KEY");
      consolefilename)}) [Debug] ERRO durante decodificação ou criação de credencial:`, decodeOrCertError);
          // Se.error(`(${path.basename(__filename)}) [Debug] ERRO: Variáveis (Base64) aus o erro foi no cert(), privateKeyDecoded pode ter um valor, mas ser inválido
          // Se foi no Bufferentes/vazias: ${missingVars.join(', ')}.`);
      throw new Error("Nenhuma cred.from, privateKeyDecoded pode ser undefined
          if (!privateKeyDecoded) {
              console.encial do Firebase Admin encontrada (variáveis de ambiente Base64 ausentes/vazias).");
    }
  }error(`(${path.basename(__filename)}) [Debug] Falha ocorreu DURANTE a decodificação Base64.`);
              

  // Inicializa o app com a credencial determinada
  try {
    admin.initializeApp({ credential });
    throw new Error(`Falha ao decodificar FIREBASE_PRIVATE_KEY (Base64): ${decodeOrCertconsole.log(`(${path.basename(__filename)}) Firebase Admin SDK inicializado com sucesso.`);
  } catch (Error.message}`);
          } else {
               console.error(`(${path.basename(__filename)}) [Debug] FalhainitError) {
    if (initError.code === 'app/duplicate-app') {
        console.warn(` ocorreu em admin.credential.cert() APÓS decodificação.`);
               throw new Error(`Falha ao criar cred(${path.basename(__filename)}) Firebase Admin SDK já inicializado.`);
    } else {
        console.errorencial do Firebase Admin (chave decodificada pode ser inválida): ${decodeOrCertError.message}`);
          }
(`!!! (${path.basename(__filename)}) ERRO FATAL na chamada final de initializeApp:`, initError);
              }
    } else {
       let missingVars = [];
       if (!projectId) missingVars.pushthrow new Error(`Falha na inicialização final do Firebase Admin: ${initError.message}`);
    }
("FIREBASE_PROJECT_ID");
       if (!clientEmail) missingVars.push("FIREBASE_CLIENT  }
}
// --- FIM DO BLOCO DE INICIALIZAÇÃO ---


const db = admin._EMAIL");
       if (!privateKeyBase64) missingVars.push("FIREBASE_PRIVATE_KEYfirestore(); // Obtém instância do Firestore

// Exporta a função manipuladora para Vercel
module.exports = async (");
      console.error(`(${path.basename(__filename)}) [Debug] ERRO: Variáveis (Basereq, res) => {
  // 1. Segurança: Verificar Método e Token Secreto
  if (req.method64) ausentes/vazias: ${missingVars.join(', ')}.`);
      throw new Error !== 'POST') {
    console.warn('(hotmart-webhook) Método não permitido:', req.method);("Nenhuma credencial do Firebase Admin encontrada (variáveis de ambiente Base64 ausentes/vazias).");
    
    return res.status(405).send('Método não permitido');
  }

  const hotmartToken = process.env.HOTMART_SECRET_TOKEN;
  const requestToken = req.headers}
  }

  // Inicializa o app com a credencial determinada
  try {
    admin.initializeApp({ credential });
    console.log(`(${path.basename(__filename)}) Firebase Admin SDK inicializado com sucesso.`);
['hottok'];

  if (!hotmartToken || !requestToken || requestToken !== hotmartToken) {
    console.warn(`(hotmart-webhook) Tentativa de acesso não autorizado. Header hottok: ${  } catch (initError) {
    // Se initializeApp for chamado mais de uma vez, pode dar erro [requestToken || 'ausente'}`);
    return res.status(403).send('Acesso nãoDEFAULT] already exists
    // Isso pode acontecer se a função for chamada rapidamente em sequência. O if !admin. autorizado.');
  }
  console.log('(hotmart-webhook) Token Hottok validado com sucessoapps.length deve prevenir.
    if (initError.code === 'app/duplicate-app') {
        console.warn(`(${path.basename(__filename)}) Firebase Admin SDK já inicializado.`);
    } else {
        .');

  // 2. Processar o corpo da requisição
  const payload = req.body;
  console.log('(hotmart-webhook) Payload recebido:', JSON.stringify(payload, null, 2console.error(`!!! (${path.basename(__filename)}) ERRO FATAL na chamada final de initializeApp:`, initError));

  // 3. Extrair dados relevantes
  const eventType = payload?.event;
  const buyerEmail =);
        throw new Error(`Falha na inicialização final do Firebase Admin: ${initError.message}`);
 payload?.data?.buyer?.email?.toLowerCase();
  const transactionId = payload?.data?.transaction;
      }
  }
}
// --- FIM DO BLOCO DE INICIALIZAÇÃO ---

const db = adminconst purchaseDate = payload?.data?.purchase?.date || Date.now();
  const status = payload?.data?.purchase?.status;

  if (!buyerEmail || !transactionId) {
    console.error('(hotmart-webhook.firestore(); // Obtém instância do Firestore (DEVE vir depois da inicialização)

// Exporta a função manipuladora para Vercel
module.exports = async (req, res) => {
  // 1. Segurança:) Webhook recebido sem buyer.email ou transaction.');
    return res.status(400).send('Dados ess Verificar Método e Token Secreto
  if (req.method !== 'POST') {
    console.warn('(enciais ausentes no webhook (email ou transação).');
  }
   if (!eventType) {
      hotmart-webhook) Método não permitido:', req.method);
    return res.status(405).console.warn('(hotmart-webhook) Evento não encontrado no payload.');
   }

  console.log(`(send('Método não permitido');
  }

  const hotmartToken = process.env.HOTMART_SECRET_TOKEN;
  const requestToken = req.headers['hottok'];

  if (!hotmarthotmart-webhook) Processando evento '${eventType}' para ${buyerEmail} (Transação: ${transactionId}, Status: ${status})`);

  // 4. Lógica Principal: Adicionar/Atualizar usuário no FirestoreToken || !requestToken || requestToken !== hotmartToken) {
    console.warn(`(hotmart-webhook) Tent
  try {
    const userRef = db.collection('authorizedUsers').doc(buyerEmail);

    //ativa de acesso não autorizado. Header hottok: ${requestToken || 'ausente'}`);
    return res.status(403).send('Acesso não autorizado.');
  }
  console.log('(hot Verifica eventos de aprovação
    if (eventType === 'PURCHASE_APPROVED' || status === 'approved') {
mart-webhook) Token Hottok validado com sucesso.');

  // 2. Processar o corpo da       console.log(`(hotmart-webhook) Autorizando usuário: ${buyerEmail}`);
       await userRef.set requisição
  const payload = req.body;
  console.log('(hotmart-webhook) Payload receb({
         email: buyerEmail,
         status: 'active',
         transactionId: transactionId,
         purchaseDate: new Date(purchaseDate),
         lastWebhookEvent: eventType || 'N/A',ido:', JSON.stringify(payload, null, 2));

  // 3. Extrair dados relevantes (Ajuste os caminhos se a estrutura da Hotmart mudar)
  const eventType = payload?.event;
         lastWebhookTimestamp: admin.firestore.FieldValue.serverTimestamp()
       }, { merge: true });
       console.log(`(hotmart-webhook) Usuário ${buyerEmail} autorizado/atualizado no Firestore.`);

    
  const buyerEmail = payload?.data?.buyer?.email?.toLowerCase(); // Normaliza para minúsculas
  const transactionId = payload?.data?.transaction;
  const purchaseDate = payload?.data?.purchase?.date// Verifica eventos de cancelamento/reembolso
    } else if (['PURCHASE_CANCELED || Date.now(); // Data da compra
  const status = payload?.data?.purchase?.status; // Status', 'PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK', 'PURCHASE_EX da compra

  if (!buyerEmail || !transactionId) {
    console.error('(hotmart-webhookPIRED', 'PURCHASE_BILLET_PRINTED'].includes(eventType) ||
               ['canceled', 'refunded',) Webhook recebido sem buyer.email ou transaction.');
    return res.status(400).send 'chargeback', 'expired', 'billet_printed'].includes(status) ) {
        console.log('Dados essenciais ausentes no webhook (email ou transação).');
  }
   if (!eventType) {
      (`(hotmart-webhook) Desativando/Atualizando status para ${buyerEmail} devido a evento/statusconsole.warn('(hotmart-webhook) Evento não encontrado no payload.');
   }

  console.log(`: ${eventType || status}`);
         await userRef.set({
           email: buyerEmail,
           status: 'inactive',
           transactionId: transactionId,
           lastWebhookEvent: eventType || 'N/(hotmart-webhook) Processando evento '${eventType}' para ${buyerEmail} (Transação: ${transactionId}, Status:A',
           lastWebhookTimestamp: admin.firestore.FieldValue.serverTimestamp()
         }, { merge: true ${status})`);

  // 4. Lógica Principal: Adicionar/Atualizar usuário no Firestore
   });
         console.log(`(hotmart-webhook) Status do usuário ${buyerEmail} atualizado para inativo.`);
try {
    const userRef = db.collection('authorizedUsers').doc(buyerEmail); // Usa o email como ID

    // Verifica eventos de aprovação
    if (eventType === 'PURCHASE_APPROVED' ||    } else {
        console.log(`(hotmart-webhook) Evento Hotmart '${eventType}' (status: ${ status === 'approved') {
       console.log(`(hotmart-webhook) Autorizando usuário: ${buyerstatus}) ignorado para ${buyerEmail}.`);
    }

    // 5. Responder à Hotmart
    res.Email}`);
       await userRef.set({
         email: buyerEmail,
         status: 'active',
         transactionstatus(200).send('Webhook recebido com sucesso.');

  } catch (error) {
    Id: transactionId,
         purchaseDate: new Date(purchaseDate),
         lastWebhookEvent: eventType || 'N/A',
         lastWebhookTimestamp: admin.firestore.FieldValue.serverTimestamp()
       }, { merge:console.error(`(hotmart-webhook) Erro CRÍTICO ao processar Firestore para ${buyerEmail}:`, error);
    res.status(500).send('Erro interno ao processar webhook.');
   true });
       console.log(`(hotmart-webhook) Usuário ${buyerEmail} autorizado/atualizado}
};
