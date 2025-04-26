// auth.js - Lógica de Autenticação Firebase (ATUALIZADO)

if (typeof firebase === 'undefined' || !firebase.app()) {
    console.error("Firebase não foi inicializado antes de auth.js");
} else {
    const auth = firebase.auth();

    // --- Elementos UI ---
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const logoutButton = document.getElementById('logout-button');
    const userDisplay = document.getElementById('user-display');
    const loginErrorMsg = document.getElementById('login-error');
    const signupErrorMsg = document.getElementById('signup-error');

    // --- Funções de Autenticação ---

    // Cadastro (AGORA COM VERIFICAÇÃO)
    const signupUser = async (email, password) => { // Adiciona async
        if (signupErrorMsg) signupErrorMsg.style.display = 'none'; // Limpa erro

        // ** PASSO 1: Verificar autorização ANTES de criar no Firebase Auth **
        try {
            console.log(`Chamando API para verificar email: ${email}`);
            // Chama sua função serverless (ajuste a URL se necessário no futuro)
            const verificationResponse = await fetch(`/api/verify-email?email=${encodeURIComponent(email)}`);

            const verificationData = await verificationResponse.json();

            if (!verificationResponse.ok || !verificationData.authorized) {
                console.log("Verificação falhou:", verificationData.message || 'Não autorizado');
                if (signupErrorMsg) {
                    signupErrorMsg.textContent = verificationData.message || "Email não autorizado para cadastro.";
                    signupErrorMsg.style.display = 'block';
                }
                return; // Interrompe o cadastro
            }

            console.log("Email autorizado. Prosseguindo com cadastro no Firebase Auth...");

            // ** PASSO 2: Criar usuário no Firebase Auth (se autorizado) **
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            console.log("Usuário cadastrado no Firebase Auth:", userCredential.user);
            // Redireciona para a calculadora principal
            window.location.href = 'index_updated.html';

        } catch (error) {
            console.error("Erro durante cadastro ou verificação:", error);
            if (signupErrorMsg) {
                // Verifica se o erro veio do Firebase Auth ou da nossa verificação
                signupErrorMsg.textContent = error.code ? getFirebaseErrorMessage(error) : "Erro ao verificar autorização. Tente novamente.";
                signupErrorMsg.style.display = 'block';
            }
        }
    };

    // Login (sem mudanças na lógica principal)
    const loginUser = (email, password) => {
         if (loginErrorMsg) loginErrorMsg.style.display = 'none';
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log("Usuário logado:", userCredential.user);
                window.location.href = 'index_updated.html';
            })
            .catch((error) => {
                console.error("Erro no login:", error);
                 if (loginErrorMsg) {
                     loginErrorMsg.textContent = getFirebaseErrorMessage(error);
                     loginErrorMsg.style.display = 'block';
                 }
            });
    };

    // Logout (sem mudanças)
    const logoutUser = () => { /* ... como antes ... */
         auth.signOut()
            .then(() => {
                console.log("Logout bem-sucedido.");
                window.location.href = 'login.html';
            })
            .catch((error) => {
                console.error("Erro no logout:", error);
                alert("Erro ao tentar sair.");
            });
    };

    // --- Listeners de Formulário ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => { /* ... como antes ... */
             e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            if (loginErrorMsg) loginErrorMsg.style.display = 'none';
            loginUser(email, password);
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => { /* Modificado para chamar signupUser */
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const passwordConfirm = document.getElementById('signup-password-confirm').value;
            if (signupErrorMsg) signupErrorMsg.style.display = 'none';

            if (password !== passwordConfirm) {
                if (signupErrorMsg) { signupErrorMsg.textContent = "As senhas não coincidem!"; signupErrorMsg.style.display = 'block';}
                return;
            }
             if (password.length < 6) {
                  if (signupErrorMsg) { signupErrorMsg.textContent = "A senha deve ter no mínimo 6 caracteres."; signupErrorMsg.style.display = 'block';}
                return;
             }

            signupUser(email, password); // Chama a função async atualizada
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', logoutUser);
    }

    // --- Verificador de Estado de Autenticação (sem mudanças) ---
    auth.onAuthStateChanged((user) => { /* ... como antes ... */
         console.log("Verificando estado de auth. Usuário:", user ? user.email : 'Nenhum');
        const currentPage = window.location.pathname.split('/').pop() || 'index_updated.html'; // Default para index

        if (user) {
            if (currentPage === 'login.html' || currentPage === 'signup.html') {
                console.log("Usuário logado, redirecionando para calculadora...");
                window.location.href = 'index_updated.html';
            } else if (currentPage === 'index_updated.html') {
                if (userDisplay) userDisplay.textContent = `Logado como: ${user.email}`;
                if (logoutButton) logoutButton.style.display = 'inline-block';
                 document.body.classList.add('user-logged-in');
                 document.body.classList.remove('user-logged-out');
                 // Certifique-se de que a calculadora seja inicializada aqui se necessário
                 if (typeof initializeCoreCalculator === 'function' && !window.calculatorInitialized) {
                     // initializeCoreCalculator(); // Ou chame a inicialização geral
                     // window.calculatorInitialized = true;
                 }
            }
        } else {
            if (currentPage !== 'login.html' && currentPage !== 'signup.html') {
                console.log("Usuário deslogado, redirecionando para login...");
                window.location.href = 'login.html';
            } else {
                 document.body.classList.add('user-logged-out');
                 document.body.classList.remove('user-logged-in');
            }
        }
    });

    // --- Função Auxiliar para Mensagens de Erro (sem mudanças) ---
    function getFirebaseErrorMessage(error) { /* ... como antes ... */
         switch (error.code) {
            case 'auth/user-not-found': return 'Email não encontrado.';
            case 'auth/wrong-password': return 'Senha incorreta.';
            case 'auth/invalid-email': return 'Formato de email inválido.';
             case 'auth/email-already-in-use': return 'Este email já está cadastrado no sistema de login.'; // Mensagem mais clara
             case 'auth/weak-password': return 'Senha muito fraca. Use pelo menos 6 caracteres.';
            default: return 'Ocorreu um erro de autenticação. Tente novamente.';
        }
    }
}
