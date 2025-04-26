// api/verify-email.js
// --> Verifica se um email está autorizado no Firestore (BUSCANDO PELO CAMPO 'email')
// --> Acessível em https://SEU_APP.vercel.app/api/verify-email

// Importa módulos necessários
const admin = require('firebase-admin');
const path = require('path');

// Carrega variáveis de ambiente localmente
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
     console.log('.env carregado para desenvolvimento (verify-email)');
  } catch (error) {
    console.warn('Arquivo .env não encontrado ou erro ao carregar (verify-email). Variáveis de ambiente do sistema/Vercel serão usadas.');
  }
}

// --- Inicialização do Firebase Admin SDK (v8 - Corrigido + Log Decoded Key) ---
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
    console.warn(`(${path.basename(__filename)}) [Debug] Chave local não encontrada (${localError.code || localError.message}). Usando variáveis de ambiente...`);

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL; // Linha corrigida
    const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY; // Pega a chave "crua"

    // --- DETAILED VALUE LOGGING ---
    console.log(`(${path.basename(__filename)}) [Debug Val] FIREBASE_PROJECT_ID: (${typeof projectId}) "${projectId}"`);
    console.log(`(${path.basename(__filename)}) [Debug Val] FIREBASE_CLIENT_EMAIL: (${typeof clientEmail}) "${clientEmail}"`);
    // Log only the start/end/length of the private key to avoid exposing it fully in logs
    const pkSnippet = privateKeyBase64 ? `${privateKeyBase64.substring(0, 20)}...${privateKeyBase64.substring(privateKeyBase64.length - 20)}` : 'N/A';
    console.log(`(${path.basename(__filename)}) [Debug Val] FIREBASE_PRIVATE_KEY (Base64): (${typeof privateKeyBase64}) Length=${privateKeyBase64?.length || 0}, Snippet="${pkSnippet}"`);
    // ------------------------------


    // Verifica se TODAS as variáveis de ambiente necessárias existem E têm valor (são "truthy")
    if (projectId && clientEmail && privateKeyBase64) {
      console.log(`(${path.basename(__filename)}) [Debug] Todas as variáveis (Base64) encontradas e não vazias. Tentando decodificar e criar credencial...`);
      let privateKeyDecoded; // Mover declaração para fora do try/catch
      try {
        // --- DECODIFICA A CHAVE PRIVADA BASE64 ---
        privateKeyDecoded = Buffer.from(privateKeyBase64, 'base64').toString('utf8');
        // -----------------------------------------

        // !!!!! TEMPORARY DEBUG LOG - REMOVE AFTER TEST !!!!!
        console.log(`(${path.basename(__filename)}) [Debug Key] Chave Decodificada:\n${privateKeyDecoded}\n[Fim Chave Decodificada]`);
        // !!!!! --------------------------------------- !!!!!

        console.log(`(${path.basename(__filename)}) [Debug] Decodificação concluída. Tentando criar credencial...`);
        credential = admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKeyDecoded, // Usa a chave decodificada
        });
         console.log(`(${path.basename(__filename)}) [Debug] admin.credential.cert() executado com sucesso.`);

      } catch(decodeOrCertError){
          // Loga o erro, seja da decodificação ou do cert()
          console.error(`(${path.basename(__filename)}) [Debug] ERRO durante decodificação ou criação de credencial:`, decodeOrCertError);
          // Se o erro foi no cert(), privateKeyDecoded pode ter um valor, mas ser inválido
          // Se foi no Buffer.from, privateKeyDecoded pode ser undefined
          if (!privateKeyDecoded) {
              console.error(`(${path.basename(__filename)}) [Debug] Falha ocorreu DURANTE a decodificação Base64.`);
              throw new Error(`Falha ao decodificar FIREBASE_PRIVATE_KEY (Base64): ${decodeOrCertError.message}`);
          } else {
               console.error(`(${path.basename(__filename)}) [Debug] Falha ocorreu em admin.credential.cert() APÓS decodificação.`);
               throw new Error(`Falha ao criar credencial do Firebase Admin (chave decodificada pode ser inválida): ${decodeOrCertError.message}`);
          }
      }
    } else {
       let missingVars = [];
       if (!projectId) missingVars.push("FIREBASE_PROJECT_ID");
       if (!clientEmail) missingVars.push("FIREBASE_CLIENT_EMAIL");
       if (!privateKeyBase64) missingVars.push("FIREBASE_PRIVATE_KEY");
      console.error(`(${path.basename(__filename)}) [Debug] ERRO: Variáveis (Base64) ausentes/vazias: ${missingVars.join(', ')}.`);
      throw new Error("Nenhuma credencial do Firebase Admin encontrada (variáveis de ambiente Base64 ausentes/vazias).");
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

const db = admin.firestore(); // Obtém instância do Firestore

module.exports = async (req, res) => {
  // Permite apenas GET (para teste fácil) ou POST (mais seguro se enviar no corpo)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Pega o email da query string (GET) ou do corpo (POST) e normaliza
  const emailToVerify = (req.query.email || req.body?.email)?.toLowerCase();

  if (!emailToVerify) {
    return res.status(400).json({ error: 'Email não fornecido.' });
  }

  console.log(`--- (verify-email) Verificando autorização para: [${emailToVerify}] ---`);

  try {
    // --- CONSULTA PELO CAMPO 'email' ---
    console.log(`(verify-email) Consultando Firestore: collection='authorizedUsers' ONDE campo 'email' == '${emailToVerify}'`);
    const usersRef = db.collection('authorizedUsers');
    const querySnapshot = await usersRef.where('email', '==', emailToVerify).limit(1).get();

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      console.log(`(verify-email) Documento encontrado (ID: ${docSnap.id}). Dados:`, docSnap.data());
      const userData = docSnap.data();
      console.log(`(verify-email) Status encontrado: [${userData?.status}]`);

      // Verifica se o status é EXATAMENTE 'active'
      if (userData?.status === 'active') {
        console.log(`(verify-email) Status é 'active'. Autorizado.`);
        res.status(200).json({ authorized: true });
      } else {
        console.log(`(verify-email) Status NÃO é 'active' (${userData?.status}). Não autorizado.`);
        res.status(403).json({ authorized: false, message: 'Acesso não autorizado ou pendente.' });
      }
    } else {
      console.log(`(verify-email) Nenhum documento encontrado com email ${emailToVerify}. Não autorizado.`);
      res.status(403).json({ authorized: false, message: 'Email não encontrado na lista de compradores.' });
    }
    // --- FIM DA CONSULTA PELO CAMPO ---

  } catch (error) {
    console.error(`(verify-email) Erro GERAL ao verificar email ${emailToVerify} no Firestore:`, error);
    res.status(500).json({ error: 'Erro interno ao verificar autorização.' });
  }
  console.log(`--- (verify-email) Fim da verificação para: [${emailToVerify}] ---`);
};
