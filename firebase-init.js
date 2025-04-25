// firebase-init.js

// !!! SUBSTITUA PELAS SUAS CHAVES REAIS DO FIREBASE !!!
const firebaseConfig = {
  apiKey: "AIzaSyAxA_VoOTmVN_qh0P1H1UBmi7-0-GlkUqs", // Sua Chave API
  authDomain: "calculadora-d4616.firebaseapp.com", // Seu Domínio Auth
  projectId: "calculadora-d4616", // Seu ID de Projeto
  storageBucket: "calculadora-d4616.firebasestorage.app", // Seu Storage Bucket
  messagingSenderId: "212899403641", // Seu Sender ID
  appId: "1:212899403641:web:a6c0e608ca32aaf45ac1a8" // Seu App ID
};

// Inicializa o Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase inicializado com sucesso.");
} catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
    // Opcional: Mostrar mensagem para usuário
    alert("Erro ao conectar com o sistema de autenticação. Tente recarregar a página.");
}