// integration.js
// Responsável por inicializar todos os módulos e conectar eventos

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Carregado. Iniciando Integração...");

    // 1. Inicializar Módulos (ordem pode ser importante)
    if (typeof initializeThemeManager === 'function') initializeThemeManager(); else console.error("initializeThemeManager não definida");
    if (typeof initializeEquipmentManager === 'function') initializeEquipmentManager(); else console.error("initializeEquipmentManager não definida");
    if (typeof initializeSettingsManager === 'function') initializeSettingsManager(); else console.error("initializeSettingsManager não definida");
    if (typeof initializeCoreCalculator === 'function') initializeCoreCalculator(); else console.error("initializeCoreCalculator não definida");
    if (typeof initializeMenu === 'function') initializeMenu(); else console.error("initializeMenu não definida");
    // --- Inicializa o Wizard ---
    if (typeof initializeWizard === 'function') initializeWizard(); else console.error("initializeWizard não definida");
    // ---------------------------


    // 2. Injetar Seções Dinâmicas (como antes)
    const calculatorContainer = document.getElementById('price-calculator');
    if (calculatorContainer) {
        if (typeof addEquipmentSectionToCalculator === 'function') {
             addEquipmentSectionToCalculator();
        } else {
             console.error("Função addEquipmentSectionToCalculator não definida em equipment.js.");
        }
         if (typeof addDisposableMaterialsSection === 'function') {
             // addDisposableMaterialsSection(); // Descomentar quando implementada
             console.warn("Função addDisposableMaterialsSection não implementada/chamada.");
         }
    } else {
        console.error("Container principal #price-calculator não encontrado no HTML!");
    }


    // 3. Configurar Event Listeners Globais para Recálculo (como antes)
    if (calculatorContainer) {
        // Delegação de eventos para inputs e selects dentro do formulário principal
        calculatorContainer.addEventListener('input', function(event) {
            // Recalcula se o evento veio de um input, select ou textarea relevante
            if (event.target.matches('input, select, textarea')) {
                // Chama a função central de cálculo (definida em calculator-core.js)
                if (typeof runCalculationsAndUpdateUI === 'function') {
                    runCalculationsAndUpdateUI();
                } else {
                    console.error("Função runCalculationsAndUpdateUI não definida (deveria estar em calculator-core.js)");
                }
            }
        });

         // Delegação de eventos para cliques (ex: adicionar/remover item)
         calculatorContainer.addEventListener('click', function(event) {
             // Recalcula após adicionar ou remover itens dinâmicos
             if (event.target.closest('.add-button') || event.target.closest('.remove-item')) {
                 // Espera um pequeno instante para o DOM atualizar antes de recalcular
                 setTimeout(() => {
                     if (typeof runCalculationsAndUpdateUI === 'function') {
                         runCalculationsAndUpdateUI();
                     } else {
                        console.error("Função runCalculationsAndUpdateUI não definida para clique");
                     }
                 }, 50); // 50ms delay pode ser ajustado
             }
         });
    } else {
        console.error("Não foi possível adicionar listeners de cálculo - #price-calculator não encontrado.");
    }

    // 4. Executar Cálculo Inicial ao Carregar a Página (como antes)
     // Garante que a UI inicial reflita os valores padrão/carregados
     // Envolve em setTimeout para garantir que todas as inicializações e injeções de HTML tenham ocorrido
     setTimeout(() => {
        console.log("Executando cálculo inicial após inicialização...");
         if (typeof runCalculationsAndUpdateUI === 'function') {
            runCalculationsAndUpdateUI();
            console.log("Integração e cálculo inicial completos.");
         } else {
             console.error("Função runCalculationsAndUpdateUI não definida para cálculo inicial");
         }
     }, 150); // Aumenta um pouco o delay para segurança

});