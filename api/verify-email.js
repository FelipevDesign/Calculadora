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
    // Cria a query: seleciona documentos onde o campo 'email' é igual ao email fornecido
    const querySnapshot = await usersRef.where('email', '==', emailToVerify).limit(1).get(); // limit(1) é uma otimização

    // Verifica se a query retornou algum documento
    if (!querySnapshot.empty) {
      // Pega o primeiro (e idealmente único) documento encontrado
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
        // Mensagem mais genérica para o usuário final
        res.status(403).json({ authorized: false, message: 'Acesso não autorizado ou pendente.' });
      }
    } else {
      // Nenhum documento encontrado com esse email
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
