// calculator-core.js
// Lógica central de cálculo, UI e funcionalidades da calculadora

// Variáveis globais do Core
let priceChart = null;
let savedCalculations = [];
let selectedSavedCalculationId = null;

// --- Inicialização ---
function initializeCoreCalculator() {
    console.log("Inicializando Core Calculator...");
    initializeChart();
    loadSavedCalculationsFromStorage();
    setupCoreEventListeners();
    applySettingsToInputs();
    console.log("Core Calculator Inicializado.");
}
function applySettingsToInputs() {
     if (currentSettings && currentSettings.calculation) {
         const settings = currentSettings.calculation;
         setInputValue('hourly-rate', settings.defaultHourlyRate);
         setInputValue('profit-percentage', settings.defaultProfitMargin);
         setInputValue('sales-tax', settings.defaultSalesTax);
         setInputValue('platform-fee', settings.defaultPlatformFee);
         setInputValue('payment-fee', settings.defaultPaymentFee);
         setSelectValue('round-price', settings.defaultRounding);
     }
}

// --- Coleta de Dados ---
function gatherInputs() {
     const inputs = {
         pieceName: getInputValue('piece-name'),
         pieceDescription: getInputValue('piece-description'),
         copperWeight: getInputNumber('copper-weight'),
         copperPrice: getInputNumber('copper-price'),
         gemstones: getDynamicItemsData('gemstones-container', '.gemstone-item', ['type', 'quantity', 'price']), // <<< CORREÇÃO AQUI: Classes reais usadas no HTML
         shells: getDynamicItemsData('shells-container', '.shell-item', ['type', 'quantity', 'price']), // <<< CORREÇÃO AQUI: Classes reais usadas no HTML
         otherMaterials: getDynamicItemsData('other-materials-container', '.other-material-item', ['desc', 'quantity', 'price']), // <<< CORREÇÃO AQUI: Classes reais usadas no HTML
         disposables: getDynamicItemsData('disposable-materials-container', '.disposable-item', ['desc', 'quantity', 'price']), // <<< CORREÇÃO AQUI: Classes reais usadas no HTML
         hourlyRate: getInputNumber('hourly-rate'),
         workHours: getInputNumber('work-hours'),
         rent: getInputNumber('rent'),
         electricity: getInputNumber('electricity'),
         water: getInputNumber('water'),
         internet: getInputNumber('internet'),
         otherFixedExpenses: getInputNumber('other-fixed-expenses'),
         dailyHours: getInputNumber('daily-hours', 8),
         monthlyDays: getInputNumber('monthly-days', 20),
         equipmentUsageFactor: getInputNumber('equipment-usage-factor', 100),
         equipmentWorkDays: getInputNumber('work-days', 1),
         salesTaxPercent: getInputNumber('sales-tax'),
         platformFeePercent: getInputNumber('platform-fee'),
         paymentFeePercent: getInputNumber('payment-fee'),
         profitPercentage: getInputNumber('profit-percentage'),
         artisticValueAdd: getInputNumber('artistic-value-add'),
         rounding: getSelectValue('round-price')
     };
     // console.log("Inputs Gathered:", inputs); // Log Opcional
     return inputs;
}

function getDynamicItemsData(containerId, itemSelector, keys) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    const items = container.querySelectorAll(itemSelector);
    const data = [];
    items.forEach(item => {
        const itemData = {};
        let hasValue = false;
        // Mapeia as chaves para as classes CSS corretas dos inputs
        const classMap = {
            'type': item.querySelector('.gemstone-type, .shell-type'), // Adicione outras classes de tipo se houver
            'desc': item.querySelector('.other-material-desc, .disposable-desc'), // Adicione outras classes de descrição
            'quantity': item.querySelector('.gemstone-quantity, .shell-quantity, .other-material-quantity, .disposable-quantity, .quantity'), // Classe genérica .quantity
            'price': item.querySelector('.gemstone-price, .shell-price, .other-material-price, .disposable-price') // Classes de preço
        };

        keys.forEach(key => {
            const input = classMap[key];
            if (input) {
                const value = input.type === 'number' ? (parseFloat(input.value) || 0) : input.value.trim();
                itemData[key] = value;
                if (value && value !== 0 && value !== '') hasValue = true;
            }
        });

        // Garante quantidade mínima 1 se existir e for 0, exceto para consumíveis talvez? Ajustar regra se necessário.
        if (keys.includes('quantity') && (itemData.quantity === undefined || itemData.quantity === 0) && !containerId.includes('disposable')) {
             itemData.quantity = 1;
        }

        // Adiciona apenas se tiver algum valor relevante (nome, descrição ou preço > 0)
        if (hasValue || itemData.price > 0 || itemData.desc || itemData.type) {
             data.push(itemData);
        }
    });
    // console.log(`Data for ${containerId}:`, data); // Log Opcional
    return data;
}


// --- Cálculos ---
function performFullCalculation(inputs) {
    const results = {};
    results.copperCost = (inputs.copperWeight || 0) * (inputs.copperPrice || 0);
    results.gemstonesCost = calculateDynamicItemsTotal(inputs.gemstones);
    results.shellsCost = calculateDynamicItemsTotal(inputs.shells);
    results.otherMaterialsCost = calculateDynamicItemsTotal(inputs.otherMaterials);
    results.disposablesCost = calculateDynamicItemsTotal(inputs.disposables);
    results.totalMaterialsCost = results.copperCost + results.gemstonesCost + results.shellsCost + results.otherMaterialsCost + results.disposablesCost;

    results.laborCost = (inputs.hourlyRate || 0) * (inputs.workHours || 0);

    results.monthlyFixedExpenses = (inputs.rent || 0) + (inputs.electricity || 0) + (inputs.water || 0) + (inputs.internet || 0) + (inputs.otherFixedExpenses || 0);
    results.monthlyHours = (inputs.dailyHours || 8) * (inputs.monthlyDays || 20);
    results.hourlyFixedExpenses = results.monthlyHours > 0 ? results.monthlyFixedExpenses / results.monthlyHours : 0;
    results.pieceFixedExpenses = results.hourlyFixedExpenses * (inputs.workHours || 0);
    results.pieceEquipmentCost = typeof calculateEquipmentCostForPiece === 'function' ? calculateEquipmentCostForPiece(inputs.equipmentWorkDays || 1, inputs.equipmentUsageFactor || 100, inputs.monthlyDays || 20) : 0;
    results.totalIndirectExpenses = results.pieceFixedExpenses + results.pieceEquipmentCost;

    results.totalProductionCost = results.totalMaterialsCost + results.laborCost + results.totalIndirectExpenses;
    results.profitValue = results.totalProductionCost * ((inputs.profitPercentage || 0) / 100);
    results.artisticAdjustment = inputs.artisticValueAdd || 0;
    results.subtotalPreTaxes = results.totalProductionCost + results.profitValue + results.artisticAdjustment;

    // Cálculo de taxas precisa ser sobre o subtotal
    const totalTaxRate = ((inputs.salesTaxPercent || 0) + (inputs.platformFeePercent || 0) + (inputs.paymentFeePercent || 0)) / 100;
    results.taxesTotal = results.subtotalPreTaxes * totalTaxRate; // Ajuste se a base de cálculo for outra

    results.finalPrice = results.subtotalPreTaxes + results.taxesTotal;
    results.roundedPrice = calculateRoundedPrice(results.finalPrice, inputs.rounding);
    results.inputs = inputs; // Guarda os inputs usados para este resultado

    // console.log("Calculation Results:", results); // Log Opcional
    return results;
}

function calculateDynamicItemsTotal(items) {
     if (!items || items.length === 0) return 0;
     return items.reduce((sum, item) => {
         const quantity = item.quantity || 1; // Garante quantidade 1 se não definida ou 0
         const price = item.price || 0;
         return sum + (quantity * price);
     }, 0);
}
function calculateRoundedPrice(price, roundingOption) {
     if (roundingOption === 'none' || !roundingOption) return price;
     const multiple = parseFloat(roundingOption);
     if (isNaN(multiple) || multiple <= 0) return price;
     // Usa Math.ceil para arredondar para CIMA para o próximo múltiplo
     return Math.ceil(price / multiple) * multiple;
}

// --- Atualização da UI ---
function updateUI(results) {
    // console.log("Updating UI with results:", results); // Log Opcional
    updateElementText('copper-total-cost', formatCurrency(results.copperCost));
    updateElementText('gemstones-total-cost', formatCurrency(results.gemstonesCost));
    updateElementText('shells-total-cost', formatCurrency(results.shellsCost));
    updateElementText('other-materials-total-cost', formatCurrency(results.otherMaterialsCost));
    updateElementText('disposables-total-cost', formatCurrency(results.disposablesCost));
    updateElementText('materials-total-cost', formatCurrency(results.totalMaterialsCost));
    updateElementText('summary-materials', formatCurrency(results.totalMaterialsCost));

    updateElementText('labor-cost', formatCurrency(results.laborCost));
    updateElementText('summary-labor', formatCurrency(results.laborCost));

    updateElementText('monthly-fixed-expenses-total', formatCurrency(results.monthlyFixedExpenses));
    updateElementText('monthly-hours-total', `${results.monthlyHours.toFixed(1)} horas`); // Ajuste para mostrar horas
    updateElementText('hourly-fixed-expenses', formatCurrency(results.hourlyFixedExpenses));
    updateElementText('piece-fixed-expenses', formatCurrency(results.pieceFixedExpenses));
    // Custo Equipamento Peça é atualizado dentro de calculateEquipmentCostForPiece
    updateElementText('indirect-expenses-total', formatCurrency(results.totalIndirectExpenses));
    updateElementText('summary-expenses', formatCurrency(results.totalIndirectExpenses));

    updateElementText('summary-cost', formatCurrency(results.totalProductionCost));

    updateElementText('profit-value', formatCurrency(results.profitValue));
    updateElementText('summary-profit', formatCurrency(results.profitValue));

    updateElementText('artistic-adjustment', formatCurrency(results.artisticAdjustment));
    updateElementText('summary-artistic', formatCurrency(results.artisticAdjustment));

    updateElementText('taxes-total', formatCurrency(results.taxesTotal));
    updateElementText('summary-taxes', formatCurrency(results.taxesTotal));

    updateElementText('final-price-value', formatCurrency(results.finalPrice)); // Preço base antes de arredondar
    updateElementText('rounded-price', formatCurrency(results.roundedPrice)); // Preço final arredondado

    updateChart(results);
}

// --- Gráfico ---
function initializeChart() {
    const ctx = document.getElementById('price-chart')?.getContext('2d');
    if (!ctx) {
        console.warn("Elemento canvas #price-chart não encontrado.");
        return;
    }
    if (priceChart) priceChart.destroy();
    priceChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Materiais', 'Mão de Obra', 'Desp. Indiretas', 'Lucro', 'Valor Artístico', 'Impostos/Taxas'],
            datasets: [{
                data: [1, 1, 1, 1, 1, 1], // Valores iniciais para evitar erro
                backgroundColor: [
                    '#3498db', // Materiais (Azul)
                    '#2ecc71', // Mão de Obra (Verde)
                    '#f39c12', // Desp. Indiretas (Laranja)
                    '#9b59b6', // Lucro (Roxo)
                    '#e74c3c', // Artístico (Vermelho)
                    '#f1c40f'  // Taxas (Amarelo)
                ],
                borderWidth: 1,
                borderColor: '#ffffff' // Adiciona borda branca para separar fatias
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        boxWidth: 12, // Tamanho do quadrado da legenda
                        font: {
                            size: 10 // Tamanho da fonte da legenda
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Composição do Preço Final',
                    padding: { top: 10, bottom: 15 },
                    font: { size: 14 }
                }
            }
        }
    });
}

function updateChart(results) {
    if (!priceChart) {
        // console.warn("Gráfico não inicializado, tentando inicializar...");
        // initializeChart(); // Tenta inicializar se não existir
        // if (!priceChart) { // Se ainda não existir, retorna
             console.error("Não foi possível atualizar: Gráfico não existe.");
             return;
        // }
    }

    const chartData = [
        results.totalMaterialsCost,
        results.laborCost,
        results.totalIndirectExpenses,
        results.profitValue,
        results.artisticAdjustment,
        results.taxesTotal
    ];
    const chartLabels = ['Materiais', 'Mão de Obra', 'Desp. Indiretas', 'Lucro', 'Valor Artístico', 'Impostos/Taxas'];
    const backgroundColors = ['#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e74c3c', '#f1c40f'];

    const filteredLabels = [];
    const filteredData = [];
    const filteredColors = [];

    chartData.forEach((value, index) => {
        // Inclui no gráfico apenas se o valor for maior que zero
        if (value > 0.001) { // Usa uma pequena tolerância para evitar floats minúsculos
            filteredLabels.push(chartLabels[index]);
            filteredData.push(value);
            filteredColors.push(backgroundColors[index]);
        }
    });

    // Se não houver dados (tudo zero), mostra uma mensagem ou estado padrão
    if (filteredData.length === 0) {
        priceChart.data.labels = ['Nenhum Custo'];
        priceChart.data.datasets[0].data = [1]; // Dado fictício para exibir algo
        priceChart.data.datasets[0].backgroundColor = ['#cccccc']; // Cinza
    } else {
        priceChart.data.labels = filteredLabels;
        priceChart.data.datasets[0].data = filteredData;
        priceChart.data.datasets[0].backgroundColor = filteredColors;
    }

    priceChart.update();
}

// --- Funcionalidades Adicionais ---
function setupCoreEventListeners() {
    document.getElementById('clear-form')?.addEventListener('click', resetForm);
    document.getElementById('save-calculation')?.addEventListener('click', saveCalculation);
    document.getElementById('load-calculation')?.addEventListener('click', showSavedCalculationsModal);
    document.getElementById('export-pdf')?.addEventListener('click', exportToPDF);

    // Listeners do Modal de Salvos
    document.querySelector('.close-modal[data-modal-id="saved-calculations-modal"]')?.addEventListener('click', hideSavedCalculationsModal);
    document.getElementById('load-selected-calculation')?.addEventListener('click', loadSelectedCalculation);
    document.getElementById('delete-selected-calculation')?.addEventListener('click', deleteSelectedCalculation);
    // Fechar modal clicando fora
    const savedModal = document.getElementById('saved-calculations-modal');
    if (savedModal) {
        savedModal.addEventListener('click', (event) => {
            if (event.target === savedModal) {
                hideSavedCalculationsModal();
            }
        });
    }


    // Listeners para adicionar/remover itens dinâmicos (usando delegação)
    const calculatorContainer = document.getElementById('price-calculator');
    if (calculatorContainer) {
        calculatorContainer.addEventListener('click', function(e) {
            const target = e.target;
            if (target.matches('#add-gemstone')) {
                addDynamicItem('gemstones-container', 'gemstone-item', ['type', 'quantity', 'price']);
            } else if (target.matches('#add-shell')) {
                addDynamicItem('shells-container', 'shell-item', ['type', 'quantity', 'price']);
            } else if (target.matches('#add-other-material')) {
                addDynamicItem('other-materials-container', 'other-material-item', ['desc', 'quantity', 'price']);
            } else if (target.matches('#add-disposable-material')) {
                addDynamicItem('disposable-materials-container', 'disposable-item', ['desc', 'quantity', 'price']);
            } else if (target.closest('.remove-item')) {
                const item = target.closest('.dynamic-item');
                const container = item?.parentElement;
                // Só remove se não for o último item (o template)
                if (item && container && container.children.length > 1) {
                    item.remove();
                    runCalculationsAndUpdateUI(); // Recalcula após remover
                } else if (item && container && container.children.length === 1) {
                    // Se for o último, apenas limpa os campos
                    clearDynamicItemInputs(item);
                    runCalculationsAndUpdateUI(); // Recalcula após limpar
                }
            }
        });

        // Listener principal para inputs que já está em integration.js, não duplicar aqui.
        // Apenas certifique-se de que integration.js chama runCalculationsAndUpdateUI.
    }

    setupTooltips(); // Atualmente CSS only
}

function addDynamicItem(containerId, itemClass, keys) {
     const container = document.getElementById(containerId);
     if (!container) return;
     const template = container.querySelector(`.${itemClass}`); // Pega o primeiro como template
     if (!template) return;

     const newItem = template.cloneNode(true); // Clona o template
     clearDynamicItemInputs(newItem); // Limpa os inputs do item clonado

     container.appendChild(newItem); // Adiciona o novo item ao final
     // runCalculationsAndUpdateUI(); // Chama o recálculo (opcional aqui, pode ser feito pelo listener de input)
}

function clearDynamicItemInputs(itemElement) {
    const inputs = itemElement.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        if (input.type === 'number') {
            input.value = input.classList.contains('quantity') ? '1' : '0'; // Padrão 1 para qtd, 0 para preço/outros
        } else {
            input.value = ''; // Limpa texto
        }
    });
}

function resetForm() {
     if (!confirm("Limpar todos os campos do formulário?")) return;

     const form = document.getElementById('price-calculator');
     if (form) {
        // Reseta inputs normais
        form.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(input => {
            if (!input.closest('.dynamic-item')) { // Não reseta os templates dinâmicos diretamente
                if (input.type === 'number') {
                   input.value = input.step === '0.1' ? '0.0' : '0'; // Respeita o step para decimais
                   // Valores padrão específicos podem ser setados aqui se necessário, ex:
                   if (input.id === 'daily-hours') input.value = '8';
                   if (input.id === 'monthly-days') input.value = '20';
                   if (input.id === 'equipment-usage-factor') input.value = '100';
                   if (input.id === 'work-days') input.value = '1';
                } else {
                   input.value = '';
                }
            }
        });
         // Reseta selects para o valor padrão (ou primeiro item) - CUIDADO com selects que devem pegar valor das settings
         form.querySelectorAll('select').forEach(select => {
             if (!select.closest('.dynamic-item') && select.id !== 'round-price') { // Não reseta o arredondamento
                 select.selectedIndex = 0;
             }
         });

        // Limpa itens dinâmicos (remove todos exceto o primeiro e limpa o primeiro)
        clearDynamicItems('gemstones-container', '.gemstone-item');
        clearDynamicItems('shells-container', '.shell-item');
        clearDynamicItems('other-materials-container', '.other-material-item');
        clearDynamicItems('disposable-materials-container', '.disposable-item');
     }

     applySettingsToInputs(); // Reaplica valores padrão das configurações
     runCalculationsAndUpdateUI(); // Recalcula e atualiza UI
     // initializeChart(); // Reinitialize chart if needed, though updateUI should handle it
     console.log("Formulário limpo.");
}

function clearDynamicItems(containerId, itemSelector) {
    const container = document.getElementById(containerId);
    if (container) {
        const items = container.querySelectorAll(itemSelector);
        // Remove todos os itens exceto o primeiro (template)
        for (let i = items.length - 1; i > 0; i--) {
            items[i].remove();
        }
        // Limpa os campos do primeiro item (template)
        if (items.length > 0) {
            clearDynamicItemInputs(items[0]);
        }
    }
}
function saveCalculation() {
     const inputs = gatherInputs();
     if (!inputs.pieceName) {
         inputs.pieceName = prompt("Digite um nome para salvar este cálculo:", `Peça_${Date.now().toString().slice(-5)}`);
         if (!inputs.pieceName) {
            alert("Nome inválido. O cálculo não foi salvo.");
            return; // Cancela se o usuário não digitar um nome
         }
         // Atualiza o input no formulário também, se desejar
         setInputValue('piece-name', inputs.pieceName);
     }

     const results = performFullCalculation(inputs);
     const calculationData = {
         id: Date.now(),
         name: inputs.pieceName,
         date: new Date().toLocaleString('pt-BR'),
         formData: inputs, // Salva todos os inputs coletados
         // Salva apenas os resultados chave para exibição rápida e referência
         results: {
             totalMaterialsCost: results.totalMaterialsCost,
             laborCost: results.laborCost,
             totalIndirectExpenses: results.totalIndirectExpenses,
             totalProductionCost: results.totalProductionCost,
             profitValue: results.profitValue,
             artisticAdjustment: results.artisticAdjustment,
             taxesTotal: results.taxesTotal,
             finalPrice: results.finalPrice,
             roundedPrice: results.roundedPrice
         }
     };

     savedCalculations.unshift(calculationData); // Adiciona no início da lista

     // Limita o número de cálculos salvos
     const maxSaved = currentSettings?.storage?.maxSavedCalculations || 50;
     if (savedCalculations.length > maxSaved) {
         savedCalculations.length = maxSaved; // Remove os mais antigos
     }

     saveCalculationsToStorage();
     alert(`Cálculo "${inputs.pieceName}" salvo!`);
     renderSavedCalculationsList(); // Atualiza a lista no modal (mesmo que fechado)
}

function loadSavedCalculationsFromStorage() {
    try {
        const savedData = localStorage.getItem('savedCalculations');
        savedCalculations = savedData ? JSON.parse(savedData) : [];
        // Ordena por ID decrescente (mais recentes primeiro) caso não estejam ordenados
        savedCalculations.sort((a, b) => b.id - a.id);
    } catch (e) {
        console.error("Erro ao carregar cálculos salvos:", e);
        savedCalculations = [];
    }
}
function saveCalculationsToStorage() {
    try {
        localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));
    } catch (e) {
        console.error("Erro ao salvar cálculos no localStorage:", e);
        alert("Erro ao salvar cálculos. Verifique o espaço de armazenamento do navegador.");
    }
}
function showSavedCalculationsModal() {
     loadSavedCalculationsFromStorage(); // Garante que a lista está atualizada
     renderSavedCalculationsList();
     document.getElementById('saved-calculations-modal')?.classList.remove('hidden');
 }
function hideSavedCalculationsModal() {
      document.getElementById('saved-calculations-modal')?.classList.add('hidden');
      selectedSavedCalculationId = null; // Limpa a seleção ao fechar
      // Remove a classe 'selected' de todos os itens
      document.querySelectorAll('#saved-list .saved-item.selected').forEach(el => el.classList.remove('selected'));
}
function renderSavedCalculationsList() {
     const listContainer = document.getElementById('saved-list');
     if (!listContainer) return;

     listContainer.innerHTML = ''; // Limpa a lista atual

     if (savedCalculations.length === 0) {
         listContainer.innerHTML = '<p class="empty-list">Nenhum cálculo salvo.</p>';
         return;
     }

     savedCalculations.forEach(calc => {
         const item = document.createElement('div');
         item.className = 'saved-item';
         item.dataset.id = calc.id;
         // Exibe nome, data e preço final
         item.innerHTML = `
             <div class="saved-item-info">
                 <strong>${calc.name || 'Cálculo Sem Nome'}</strong>
                 <span class="saved-item-date">Salvo em: ${calc.date || 'Data Desconhecida'}</span>
             </div>
             <div class="saved-item-price">
                 ${formatCurrency(calc.results?.roundedPrice || calc.results?.finalPrice || 0)}
             </div>`;
         item.addEventListener('click', () => selectSavedItem(calc.id, item));
         listContainer.appendChild(item);
     });
}

function selectSavedItem(id, element) {
     // Remove a seleção anterior
     document.querySelectorAll('#saved-list .saved-item.selected').forEach(el => el.classList.remove('selected'));
     // Adiciona a seleção ao item clicado
     element.classList.add('selected');
     selectedSavedCalculationId = id; // Armazena o ID selecionado
}
function loadSelectedCalculation() {
    if (!selectedSavedCalculationId) {
        alert("Por favor, selecione um cálculo da lista para carregar.");
        return;
    }

    const calculationToLoad = savedCalculations.find(calc => calc.id === selectedSavedCalculationId);

    if (!calculationToLoad || !calculationToLoad.formData) {
        alert("Erro: Não foi possível encontrar os dados do cálculo selecionado.");
        return;
    }

    if (!confirm(`Carregar o cálculo "${calculationToLoad.name}"? Os dados atuais do formulário serão substituídos.`)) {
        return;
    }

    loadFormData(calculationToLoad.formData); // Carrega os dados no formulário
    hideSavedCalculationsModal(); // Fecha o modal
    // Garante que o cálculo seja executado após o carregamento dos dados
    setTimeout(runCalculationsAndUpdateUI, 100); // Pequeno delay para garantir que o DOM está pronto
    alert(`Cálculo "${calculationToLoad.name}" carregado com sucesso!`);
}

function loadFormData(formData) {
     // Não chama resetForm() inteiro para não perder configurações padrão que podem ter mudado
     // Limpa campos específicos antes de carregar
     const form = document.getElementById('price-calculator');
     if(form) {
         form.querySelectorAll('input[type="text"], input[type="number"]:not(#hourly-rate):not(#profit-percentage):not(#sales-tax):not(#platform-fee):not(#payment-fee), textarea').forEach(input => {
            if(!input.closest('.dynamic-item')) input.value = input.type === 'number' ? '0' : '';
         });
         clearDynamicItems('gemstones-container', '.gemstone-item');
         clearDynamicItems('shells-container', '.shell-item');
         clearDynamicItems('other-materials-container', '.other-material-item');
         clearDynamicItems('disposable-materials-container', '.disposable-item');
     }


     // Carrega os valores dos inputs normais
     for (const key in formData) {
         if (!['gemstones', 'shells', 'otherMaterials', 'disposables'].includes(key) && typeof formData[key] !== 'object' && formData.hasOwnProperty(key)) {
             // Verifica se o elemento existe antes de tentar setar o valor
             if (document.getElementById(key)) {
                setInputValue(key, formData[key]);
             } else {
                // Tenta encontrar por 'name' se 'id' falhar (menos comum)
                const elementByName = document.querySelector(`[name="${key}"]`);
                if (elementByName) {
                    elementByName.value = formData[key];
                } else {
                    // console.warn(`Elemento não encontrado para carregar dado: ${key}`); // Log Opcional
                }
             }
         }
     }
     // Trata selects especificamente se necessário (ex: arredondamento)
     setSelectValue('round-price', formData.rounding || '10');

     // Carrega os itens dinâmicos
     loadDynamicItems('gemstones-container', '.gemstone-item', formData.gemstones || []);
     loadDynamicItems('shells-container', '.shell-item', formData.shells || []);
     loadDynamicItems('other-materials-container', '.other-material-item', formData.otherMaterials || []);
     loadDynamicItems('disposable-materials-container', '.disposable-item', formData.disposables || []);
}

function loadDynamicItems(containerId, itemSelector, itemsData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Remove itens existentes (exceto o primeiro/template)
    const existingItems = container.querySelectorAll(`${itemSelector}`);
    for (let i = existingItems.length - 1; i > 0; i--) {
        existingItems[i].remove();
    }

    const template = container.querySelector(itemSelector); // Pega o primeiro item como template
    if (!template) return; // Não faz nada se não houver template

    // Limpa o template se não houver dados ou apenas um item
     if (!itemsData || itemsData.length === 0) {
        clearDynamicItemInputs(template);
        return;
     }

    // Preenche o template com o primeiro item dos dados
    fillDynamicItem(template, itemsData[0]);

    // Cria e preenche novos itens para o restante dos dados
    for (let i = 1; i < itemsData.length; i++) {
        const newItem = template.cloneNode(true);
        fillDynamicItem(newItem, itemsData[i]);
        container.appendChild(newItem);
    }
}

function fillDynamicItem(itemElement, itemData) {
    // Encontra os inputs dentro do elemento e preenche com os dados correspondentes
    // Adapte as classes CSS conforme necessário se elas mudarem
    const typeInput = itemElement.querySelector('.gemstone-type, .shell-type');
    const descInput = itemElement.querySelector('.other-material-desc, .disposable-desc');
    const quantityInput = itemElement.querySelector('.quantity'); // Usando a classe genérica '.quantity'
    const priceInput = itemElement.querySelector('.gemstone-price, .shell-price, .other-material-price, .disposable-price');

    if (typeInput && itemData.type !== undefined) typeInput.value = itemData.type;
    if (descInput && itemData.desc !== undefined) descInput.value = itemData.desc;
    if (quantityInput && itemData.quantity !== undefined) quantityInput.value = itemData.quantity;
    if (priceInput && itemData.price !== undefined) priceInput.value = itemData.price;
}

function deleteSelectedCalculation() {
     if (!selectedSavedCalculationId) {
         alert("Por favor, selecione um cálculo da lista para excluir.");
         return;
     }

     const calculationToDelete = savedCalculations.find(calc => calc.id === selectedSavedCalculationId);
     const calculationName = calculationToDelete?.name || 'o cálculo selecionado';

     if (confirm(`Tem certeza que deseja excluir "${calculationName}"? Esta ação não pode ser desfeita.`)) {
         savedCalculations = savedCalculations.filter(calc => calc.id !== selectedSavedCalculationId);
         selectedSavedCalculationId = null; // Limpa a seleção
         saveCalculationsToStorage(); // Salva a lista atualizada
         renderSavedCalculationsList(); // Re-renderiza a lista no modal
         alert("Cálculo excluído com sucesso.");
     }
}


// --- Exportar PDF (Reescrito e Melhorado) ---
function exportToPDF() {
    if (typeof jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        alert("Erro: A biblioteca jsPDF não parece estar carregada corretamente.");
        console.error("jsPDF ou jsPDF.jsPDF não definido.");
        return;
    }
    console.log("Iniciando exportação para PDF...");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ // Configurações do documento
        orientation: 'p', // portrait
        unit: 'mm', // milímetros
        format: 'a4' // tamanho A4
    });

    // --- Coleta e Cálculo dos Dados ATUAIS do formulário ---
    const inputs = gatherInputs();
    const results = performFullCalculation(inputs);
    const pieceName = inputs.pieceName || 'Peça Sem Nome';
    const fileName = `Precificacao_${pieceName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;

    // --- Variáveis de Layout ---
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15; // Margem da página
    const maxW = pageW - margin * 2; // Largura útil
    let y = margin + 5; // Posição Y inicial (mais perto do topo)
    const lineH = 6; // Altura padrão da linha de texto (menor)
    const lineHSmall = 5; // Altura para detalhes
    const col1X = margin; // Posição X da Coluna 1 (Labels)
    // const col2X = pageW / 2 + 5; // Posição X da Coluna 2 (Valores) - Vamos alinhar à direita
    const valueX = pageW - margin; // Posição X para alinhar valores à direita

    // --- Funções Auxiliares PDF ---
    const addTitle = (text) => {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(40, 40, 40); // Cor escura, não preto puro
        doc.text(text, pageW / 2, y + 5, { align: 'center' });
        y += lineH * 2; // Mais espaço após título
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0); // Reseta cor
    };

    const addSectionTitle = (text) => {
        if (y > pageH - margin * 2) { doc.addPage(); y = margin; } // Adiciona nova página se necessário
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(50, 50, 50);
        doc.text(text, margin, y);
        y += lineH * 0.5; // Espaço antes da linha
        doc.setDrawColor(200, 200, 200); // Cinza claro para linha
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageW - margin, y); // Linha divisória
        y += lineH * 1.2; // Mais espaço após linha
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10); // Tamanho padrão para itens
        doc.setTextColor(0, 0, 0);
    };

    const addLineItem = (label, value, isTotal = false, isSubItem = false) => {
        if (y > pageH - margin) { doc.addPage(); y = margin; } // Nova página
        doc.setFontSize(isSubItem ? 9 : 10); // Menor para subitens
        doc.setFont(undefined, isTotal ? 'bold' : 'normal');
        doc.setTextColor(isSubItem ? 80 : 0, isSubItem ? 80 : 0, isSubItem ? 80 : 0); // Cinza para subitens

        const itemLabel = isSubItem ? `  - ${label}` : label; // Adiciona indentação para subitens
        doc.text(itemLabel, col1X, y, { align: 'left' });
        doc.text(formatCurrency(value), valueX, y, { align: 'right' }); // Alinha valor à direita

        y += isTotal ? lineH * 1.1 : (isSubItem ? lineHSmall : lineH); // Mais espaço após totais, menos para subitens
        doc.setTextColor(0, 0, 0); // Reseta cor
    };

    const addDetailText = (text, indent = 1) => {
         if (y > pageH - margin) { doc.addPage(); y = margin; }
         doc.setFontSize(8); // Bem pequeno
         doc.setFont(undefined, 'italic');
         doc.setTextColor(120, 120, 120); // Cinza mais claro
         doc.text(text, col1X + indent * 4, y); // Indentação
         y += lineHSmall * 0.9;
         doc.setTextColor(0, 0, 0); // Reseta cor
         doc.setFont(undefined, 'normal');
    }

    const addSeparator = (heavy = false) => {
        if (y > pageH - margin) { doc.addPage(); y = margin; }
        doc.setDrawColor(heavy ? 150 : 200, heavy ? 150 : 200, heavy ? 150 : 200);
        doc.setLineWidth(heavy ? 0.4 : 0.2);
        doc.line(margin, y, pageW - margin, y);
        y += heavy ? lineH * 0.8 : lineH * 0.5;
    }

    // --- Construção do PDF ---
    addTitle(`Relatório de Precificação`);
    doc.setFontSize(11);
    doc.text(`Peça: ${pieceName}`, margin, y);
    y += lineH * 1.5;

    // 1. Custos de Materiais
    addSectionTitle("Custos de Materiais");
    if (results.copperCost > 0) addLineItem("Cobre:", results.copperCost);
    if (results.gemstonesCost > 0) {
        addLineItem("Pedras:", results.gemstonesCost);
        inputs.gemstones.forEach(g => addDetailText(`${g.quantity}x ${g.type || 'Pedra'} @ ${formatCurrency(g.price)}/un.`));
    }
    if (results.shellsCost > 0) {
        addLineItem("Conchas/Fósseis:", results.shellsCost);
        inputs.shells.forEach(s => addDetailText(`${s.quantity}x ${s.type || 'Item'} @ ${formatCurrency(s.price)}/un.`));
    }
    if (results.otherMaterialsCost > 0) {
        addLineItem("Outros Materiais:", results.otherMaterialsCost);
        inputs.otherMaterials.forEach(o => addDetailText(`${o.quantity}x ${o.desc || 'Material'} @ ${formatCurrency(o.price)}/un.`));
    }
     if (results.disposablesCost > 0) {
        addLineItem("Consumíveis:", results.disposablesCost);
        inputs.disposables.forEach(d => addDetailText(`${d.quantity}x ${d.desc || 'Consumível'} @ ${formatCurrency(d.price)}/un.`));
    }
    addSeparator();
    addLineItem("Total Materiais:", results.totalMaterialsCost, true);
    y += lineH * 0.5; // Espaço extra após seção

    // 2. Mão de Obra
    addSectionTitle("Mão de Obra");
    addDetailText(`(${inputs.workHours.toFixed(1)} horas @ ${formatCurrency(inputs.hourlyRate)}/hora)`);
    addLineItem("Total Mão de Obra:", results.laborCost, true);
    y += lineH * 0.5;

    // 3. Despesas Indiretas
    addSectionTitle("Despesas Indiretas");
    addDetailText(`Custo Fixo/Hora: ${formatCurrency(results.hourlyFixedExpenses)} (Base: ${results.monthlyFixedExpenses.toFixed(2)}/mês / ${results.monthlyHours.toFixed(0)}h/mês)`);
    addLineItem("Custos Fixos (Peça):", results.pieceFixedExpenses);
     if (results.pieceEquipmentCost > 0) {
        addDetailText(`Depreciação Equipamentos (${inputs.equipmentWorkDays} dia(s) uso, ${inputs.equipmentUsageFactor}% fator)`);
        addLineItem("Desgaste Equipamentos (Peça):", results.pieceEquipmentCost);
    }
    addSeparator();
    addLineItem("Total Desp. Indiretas:", results.totalIndirectExpenses, true);
    y += lineH * 0.5;

    // 4. Custo de Produção
    addSeparator(true); // Linha mais forte
    addLineItem("CUSTO TOTAL DE PRODUÇÃO:", results.totalProductionCost, true);
    addSeparator(true);
    y += lineH; // Espaço extra

     // 5. Lucro e Adicionais
    addSectionTitle("Lucro e Adicionais");
    addDetailText(`Margem de Lucro: ${inputs.profitPercentage}% sobre Custo Produção`);
    addLineItem("Lucro Desejado:", results.profitValue);
    if (results.artisticAdjustment > 0) {
        addLineItem("Adicional Artístico/Exclusividade:", results.artisticAdjustment);
    }
    y += lineH * 0.5;

     // 6. Taxas Estimadas
     addSectionTitle("Impostos e Taxas (Estimativa)");
     const totalTaxPercent = (inputs.salesTaxPercent + inputs.platformFeePercent + inputs.paymentFeePercent);
     addDetailText(`Taxa total estimada: ${totalTaxPercent.toFixed(1)}% sobre Subtotal (Custo+Lucro+Artístico)`);
     addLineItem("Valor Estimado Taxas:", results.taxesTotal);
     y += lineH * 0.5;

     // 7. Preço Final
     addSeparator(true);
     y += lineH * 0.5;
     doc.setFontSize(13);
     doc.setFont(undefined, 'bold');
     doc.text("Preço Final Sugerido:", margin, y);
     doc.text(formatCurrency(results.roundedPrice), valueX, y, { align: 'right' });
     doc.setFont(undefined, 'normal');

     // Mostra o valor base se houve arredondamento
     if (Math.abs(results.roundedPrice - results.finalPrice) > 0.001) {
         y += lineHSmall;
         doc.setFontSize(9);
         doc.setTextColor(100, 100, 100);
         doc.text(`(Valor base antes de arredondar p/ ${inputs.rounding !== 'none' ? formatCurrency(parseFloat(inputs.rounding)) : 'N/A'}: ${formatCurrency(results.finalPrice)})`, valueX, y, { align: 'right'});
         doc.setTextColor(0,0,0);
     }

     // Adiciona Rodapé
     const pageCount = doc.internal.getNumberOfPages();
     for (let i = 1; i <= pageCount; i++) {
         doc.setPage(i);
         doc.setFontSize(8);
         doc.setTextColor(150, 150, 150);
         doc.text(`Calculadora Rocharts - Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, pageH - 10);
         doc.text(`Página ${i} de ${pageCount}`, pageW - margin, pageH - 10, { align: 'right' });
     }


    // --- Salvamento ---
    try {
        doc.save(fileName);
        console.log("PDF exportado:", fileName);
    } catch (e) {
        console.error("Erro ao gerar ou salvar o PDF:", e);
        alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
    }
}


// --- Funções Utilitárias ---
function formatCurrency(value) {
    const number = parseFloat(value);
    if (isNaN(number)) return "R$ 0,00";
    return `R$ ${number.toFixed(2).replace('.', ',')}`;
}
function getInputValue(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function getInputNumber(id, defaultValue = 0) {
    const el = document.getElementById(id);
    const value = el ? el.value : defaultValue.toString();
    // Permite vírgula como separador decimal
    const sanitizedValue = value.replace(',', '.');
    const val = parseFloat(sanitizedValue);
    return isNaN(val) ? defaultValue : val;
}
function getSelectValue(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setInputValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
        // Formata números para exibir com vírgula se for o caso (opcional, depende da preferência)
        // if (el.type === 'number' && typeof value === 'number') {
        //     el.value = value.toString().replace('.', ',');
        // } else {
            el.value = value ?? '';
        // }
    }
}
function setSelectValue(id, value) { const el = document.getElementById(id); if (el) el.value = value; }
function updateElementText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function setupTooltips() { /* CSS only, funcionalidade via :hover */ }


// --- Central Calculation Trigger ---
// !! ESTA É A FUNÇÃO QUE FALTAVA !!
function runCalculationsAndUpdateUI() {
    // console.log("Running calculations and updating UI..."); // Log Opcional
    try {
        const inputs = gatherInputs();
        const results = performFullCalculation(inputs);
        updateUI(results);
        // console.log("UI Updated successfully."); // Log Opcional
    } catch (error) {
        console.error("Erro durante cálculo e atualização da UI:", error);
        // Poderia adicionar um feedback visual ao usuário aqui, se desejado
        // Ex: updateElementText('error-message-area', 'Ocorreu um erro ao calcular.');
    }
}