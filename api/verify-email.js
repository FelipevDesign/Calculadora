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

// --- Inicialização do Firebase Admin SDK (Garantindo Instância Única) ---
if (!admin.apps.length) {
  let serviceAccount;
  try {
    const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');
    console.log(`(verify-email) Tentando carregar credenciais de: ${serviceAccountPath}`);
    serviceAccount = require(serviceAccountPath);
    console.log("(verify-email) Chave de serviço local carregada com sucesso.");
  } catch (error) {
    console.warn(`(verify-email) Não foi possível carregar a chave local (${error.code || error.message}). Tentando credenciais padrão (GOOGLE_APPLICATION_CREDENTIALS).`);
    serviceAccount = null;
  }

  try {
    const initOptions = {};
    if (serviceAccount) {
      console.log("(verify-email) Inicializando Admin SDK com chave de serviço local.");
      initOptions.credential = admin.credential.cert(serviceAccount);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
       console.log("(verify-email) Inicializando Admin SDK com credenciais padrão (GOOGLE_APPLICATION_CREDENTIALS).");
       initOptions.credential = admin.credential.applicationDefault();
    } else {
        throw new Error("Nenhuma credencial do Firebase Admin encontrada (nem local, nem GOOGLE_APPLICATION_CREDENTIALS).");
    }
    admin.initializeApp(initOptions);
    console.log('(verify-email) Firebase Admin SDK inicializado com sucesso.');
  } catch (error) {
    console.error('!!! (verify-email) ERRO FATAL ao inicializar Firebase Admin SDK:', error);
    throw new Error(`Falha na inicialização do Firebase Admin: ${error.message}`);
  }
}
// --------------------------------------------------------------------

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
