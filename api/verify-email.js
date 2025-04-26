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

// --- Inicialização do Firebase Admin SDK (v4 - Debug Variáveis Vercel) ---
if (!admin.apps.length) {
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
