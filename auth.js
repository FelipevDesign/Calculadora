// auth.js - Lógica de Autenticação Firebase

// Verifica se o Firebase foi inicializado
if (typeof firebase === 'undefined' || !firebase.app()) {
    console.error("Firebase não foi inicializado antes de auth.js");
    // Idealmente, mostrar um erro mais visível ao usuário
} else {
    const auth = firebase.auth(); // Obtém a instância de autenticação

    // --- Elementos UI (Pode variar dependendo da página) ---
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const logoutButton = document.getElementById('logout-button'); // Adicionar este botão no HTML principal
    const userDisplay = document.getElementById('user-display');   // Adicionar este elemento
    const loginErrorMsg = document.getElementById('login-error');
    const signupErrorMsg = document.getElementById('signup-error');

    // --- Funções de Autenticação ---

    // Cadastro
    const signupUser = (email, password) => {
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Cadastro bem-sucedido, usuário logado automaticamente
                console.log("Usuário cadastrado:", userCredential.user);
                // Redireciona para a calculadora principal
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error("Erro no cadastro:", error);
                if (signupErrorMsg) {
                     signupErrorMsg.textContent = getFirebaseErrorMessage(error);
                     signupErrorMsg.style.display = 'block';
                }
            });
    };

    // Login
    const loginUser = (email, password) => {
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Login bem-sucedido
                console.log("Usuário logado:", userCredential.user);
                // Redireciona para a calculadora principal
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error("Erro no login:", error);
                 if (loginErrorMsg) {
                     loginErrorMsg.textContent = getFirebaseErrorMessage(error);
                     loginErrorMsg.style.display = 'block';
                 }
            });
    };

    // Logout
    const logoutUser = () => {
        auth.signOut()
            .then(() => {
                console.log("Logout bem-sucedido.");
                // Redireciona para a página de login
                window.location.href = 'login.html';
            })
            .catch((error) => {
                console.error("Erro no logout:", error);
                alert("Erro ao tentar sair.");
            });
    };

    // --- Listeners de Formulário ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Impede recarregamento da página
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            if (loginErrorMsg) loginErrorMsg.style.display = 'none'; // Esconde erro anterior
            loginUser(email, password);
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const passwordConfirm = document.getElementById('signup-password-confirm').value;
             if (signupErrorMsg) signupErrorMsg.style.display = 'none'; // Esconde erro anterior

            if (password !== passwordConfirm) {
                if (signupErrorMsg) {
                    signupErrorMsg.textContent = "As senhas não coincidem!";
                    signupErrorMsg.style.display = 'block';
                }
                return; // Para a execução
            }
             if (password.length < 6) {
                 if (signupErrorMsg) {
                     signupErrorMsg.textContent = "A senha deve ter no mínimo 6 caracteres.";
                     signupErrorMsg.style.display = 'block';
                 }
                return;
             }

            signupUser(email, password);
        });
    }

    // Listener do botão de Logout (no index.html)
    if (logoutButton) {
        logoutButton.addEventListener('click', logoutUser);
    }

    // --- Verificador de Estado de Autenticação (Executa em TODAS as páginas que incluem auth.js) ---
    auth.onAuthStateChanged((user) => {
        console.log("Verificando estado de auth. Usuário:", user ? user.email : 'Nenhum');
        const currentPage = window.location.pathname.split('/').pop(); // Pega o nome do arquivo atual

        if (user) {
            // Usuário está logado
            if (currentPage === 'login.html' || currentPage === 'signup.html') {
                // Se está logado e na página de login/cadastro, redireciona para a calculadora
                console.log("Usuário logado, redirecionando para calculadora...");
                window.location.href = 'index.html';
            } else if (currentPage === 'index.html') {
                // Está na página correta (calculadora)
                // Atualiza a UI para mostrar info do usuário e botão de logout
                if (userDisplay) userDisplay.textContent = `Logado como: ${user.email}`;
                if (logoutButton) logoutButton.style.display = 'inline-block'; // Mostra o botão
                // Pode adicionar/remover classes no body se quiser estilizar diferente para logado/deslogado
                 document.body.classList.add('user-logged-in');
                 document.body.classList.remove('user-logged-out');
            }
        } else {
            // Usuário NÃO está logado
            if (currentPage !== 'login.html' && currentPage !== 'signup.html') {
                // Se não está logado e NÃO está nas páginas de login/cadastro,
                // redireciona para o login
                console.log("Usuário deslogado, redirecionando para login...");
                window.location.href = 'login.html';
            } else {
                 // Está nas páginas de login/cadastro, tudo certo
                 document.body.classList.add('user-logged-out');
                 document.body.classList.remove('user-logged-in');
            }
        }
    });

    // --- Função Auxiliar para Mensagens de Erro ---
    function getFirebaseErrorMessage(error) {
        switch (error.code) {
            case 'auth/user-not-found':
                return 'Email não encontrado.';
            case 'auth/wrong-password':
                return 'Senha incorreta.';
            case 'auth/invalid-email':
                return 'Formato de email inválido.';
             case 'auth/email-already-in-use':
                return 'Este email já está cadastrado.';
             case 'auth/weak-password':
                 return 'Senha muito fraca. Use pelo menos 6 caracteres.';
            // Adicione outros códigos de erro comuns aqui
            default:
                return 'Ocorreu um erro. Tente novamente.';
        }
    }
}
