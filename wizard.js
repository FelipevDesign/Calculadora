// wizard.js - Lógica para o modo passo-a-passo
// Nenhuma mudança necessária neste arquivo para a funcionalidade de tooltips.

let isWizardMode = false;
let currentStepIndex = 0;
// Ordem das seções no Wizard - IMPORTANTE: use os valores de 'data-section' do HTML
const wizardSectionsOrder = [
    'piece-info',
    'materials',
    'labor',
    'expenses', // Inclui custos fixos e equipamentos
    'taxes',
    'profit',
    'artistic',
    'final-price' // Inclui gráfico e resumo
];

// Referências aos elementos (serão definidas no initializeWizard)
let toggleButton = null;
let wizardNavContainer = null;
let prevButton = null;
let nextButton = null;
let priceCalculatorDiv = null;
let sectionElements = []; // Array para guardar as referências das seções DOM

function initializeWizard() {
    console.log("Inicializando Wizard...");
    toggleButton = document.getElementById('toggle-view-mode');
    wizardNavContainer = document.getElementById('wizard-navigation');
    prevButton = document.getElementById('wizard-prev');
    nextButton = document.getElementById('wizard-next');
    priceCalculatorDiv = document.getElementById('price-calculator');

    if (!toggleButton || !wizardNavContainer || !prevButton || !nextButton || !priceCalculatorDiv) {
        console.error("Erro: Elementos essenciais do Wizard não encontrados no HTML.");
        return; // Impede a execução se faltar elementos
    }

    // Mapeia as seções DOM baseadas na ordem definida em wizardSectionsOrder
    sectionElements = wizardSectionsOrder
        .map(sectionId => {
            const section = priceCalculatorDiv.querySelector(`.form-section[data-section="${sectionId}"]`);
            return section;
        })
        .filter(el => el !== null); // Filtra se alguma seção não for encontrada

    if (sectionElements.length === 0) {
         console.error("Nenhuma seção da calculadora encontrada para o Wizard.");
         return;
    }

    if (sectionElements.length !== wizardSectionsOrder.length) {
        console.warn("Aviso: Nem todas as seções definidas em wizardSectionsOrder foram encontradas no HTML. Verifique os atributos 'data-section'.");
    }

    // Event Listeners
    toggleButton.addEventListener('click', toggleWizardMode);
    prevButton.addEventListener('click', goToPrevStep);
    nextButton.addEventListener('click', goToNextStep);

    // Verifica preferência salva (opcional)
    const savedMode = localStorage.getItem('calculatorViewMode');
    if (savedMode === 'wizard') {
        isWizardMode = true;
        currentStepIndex = 0; // Sempre começa do 0 ao carregar
    } else {
        isWizardMode = false;
    }

    updateWizardView(); // Aplica o estado inicial (mostra/esconde elementos)
    console.log("Wizard Inicializado. Modo inicial:", isWizardMode ? "Wizard" : "Completo");
}

function toggleWizardMode() {
    isWizardMode = !isWizardMode;
    if (isWizardMode) {
        currentStepIndex = 0; // Reseta ao entrar no modo wizard
        console.log("Mudando para Modo Wizard (Passo a Passo)");
    } else {
        console.log("Mudando para Modo Completo");
    }
    localStorage.setItem('calculatorViewMode', isWizardMode ? 'wizard' : 'full'); // Salva preferência
    updateWizardView();
}

function goToStep(stepIndex) {
    // Garante que o índice esteja dentro dos limites válidos
    if (stepIndex >= 0 && stepIndex < sectionElements.length) {
        currentStepIndex = stepIndex;
        updateWizardView(); // Atualiza a UI para o novo passo

        // Scroll suave para o topo da seção ativa
        const activeSection = sectionElements[currentStepIndex];
        if (activeSection) {
            // Espera um instante para o display: block ser aplicado antes do scroll
            setTimeout(() => {
                 activeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100); // Pequeno delay
        }
    } else {
        console.warn("Tentativa de ir para passo inválido:", stepIndex);
    }
}

function goToNextStep() {
    if (currentStepIndex < sectionElements.length - 1) {
        goToStep(currentStepIndex + 1);
    } else {
        // Ação no último passo (ex: finalizar ou voltar ao modo completo)
        console.log("Chegou ao último passo do Wizard.");
        // Exemplo: Voltar para o modo completo ao clicar em "Finalizar"
        toggleWizardMode();
    }
}

function goToPrevStep() {
    if (currentStepIndex > 0) {
        goToStep(currentStepIndex - 1);
    }
}

function updateWizardView() {
    if (!toggleButton || !wizardNavContainer || !sectionElements.length) {
        console.error("Wizard não inicializado corretamente, impossível atualizar a view.");
        return; // Sai se não inicializado
    }

    const globalActions = document.getElementById('global-actions');

    if (isWizardMode) {
        document.body.classList.add('wizard-active');
        wizardNavContainer.classList.remove('hidden');
        toggleButton.innerHTML = '<i class="fas fa-list-alt"></i> Mudar para Visão Completa';
        if (globalActions) globalActions.classList.add('hidden'); // Esconde ações globais

        // Mostrar/Esconder Seções (CSS cuida de esconder/mostrar instruções .tooltip)
        sectionElements.forEach((section, index) => {
            if (index === currentStepIndex) {
                section.classList.add('wizard-active-section');
            } else {
                section.classList.remove('wizard-active-section');
            }
        });

        // Atualizar Botões de Navegação
        prevButton.disabled = currentStepIndex === 0;
        prevButton.style.opacity = currentStepIndex === 0 ? '0.6' : '1';
        prevButton.style.cursor = currentStepIndex === 0 ? 'not-allowed' : 'pointer';

        if (currentStepIndex === sectionElements.length - 1) {
            nextButton.innerHTML = 'Finalizar <i class="fas fa-check"></i>';
        } else {
            nextButton.innerHTML = 'Próximo <i class="fas fa-chevron-right"></i>';
        }
        nextButton.disabled = false;

    } else {
        // Modo Completo
        document.body.classList.remove('wizard-active');
        wizardNavContainer.classList.add('hidden');
        toggleButton.innerHTML = '<i class="fas fa-magic"></i> Mudar para Modo Passo-a-Passo';
        if (globalActions) globalActions.classList.remove('hidden');

        // Garante que todas as seções sejam potencialmente visíveis
        sectionElements.forEach(section => {
            section.classList.remove('wizard-active-section');
        });

        if (typeof applyCurrentSettings === 'function') {
            console.log("Reaplicando configurações de visibilidade para Modo Completo.");
            applyCurrentSettings();
        } else {
              sectionElements.forEach(section => { section.style.display = ''; });
              console.warn("Função applyCurrentSettings não encontrada. Mostrando todas as seções do wizard.");
        }
    }
}