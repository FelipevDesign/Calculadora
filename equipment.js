// equipment.js - Gerenciamento de equipamentos duráveis

let equipamentosDuraveis = [];

// --- Inicialização e Persistência ---
function initializeEquipmentManager() {
    console.log("Inicializando Gerenciador de Equipamentos...");
    loadEquipmentFromStorage();
    createEquipmentModal(); // Cria o HTML do modal
    setupEquipmentEventListeners(); // Adiciona listeners ao modal e outros elementos
    // A injeção da seção no formulário principal agora acontece em integration.js
    // addEquipmentSectionToCalculator(); // Removido daqui
    updateEquipmentSummaryInForm(); // Atualiza valores no formulário
    console.log("Gerenciador de Equipamentos Inicializado.");
}

function loadEquipmentFromStorage() {
    const savedEquipment = localStorage.getItem('equipamentosDuraveis');
    if (savedEquipment) {
        try {
            equipamentosDuraveis = JSON.parse(savedEquipment);
            // Recalcula taxa mensal ao carregar (caso a lógica mude)
            equipamentosDuraveis.forEach(equip => {
                equip.taxaMensal = (equip.vidaUtil && equip.vidaUtil > 0) ? (equip.valor / equip.vidaUtil) : 0;
                if (!equip.id) equip.id = Date.now() + Math.random(); // Garante ID se faltar
            });
        } catch (e) {
            console.error('Erro ao carregar equipamentos do localStorage:', e);
            equipamentosDuraveis = [];
        }
    }
}

function saveEquipmentToStorage() {
    try {
        localStorage.setItem('equipamentosDuraveis', JSON.stringify(equipamentosDuraveis));
    } catch (e) {
        console.error("Erro ao salvar equipamentos no localStorage:", e);
        alert("Erro ao salvar lista de equipamentos.");
    }
}

// --- Modal de Gerenciamento ---
function createEquipmentModal() {
    if (document.getElementById('equipment-modal')) return; // Não recria se já existe

    const modal = document.createElement('div');
    modal.id = 'equipment-modal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2>Gerenciar Equipamentos Duráveis</h2>
                <span class="close-modal" data-modal-id="equipment-modal" title="Fechar">×</span>
            </div>
            <div class="modal-body">
                <div class="equipment-form">
                    <h3>Adicionar/Editar Equipamento</h3>
                    <input type="hidden" id="equipment-edit-id">
                    <div class="form-group">
                        <label for="equipment-name">Nome:</label>
                        <input type="text" id="equipment-name" placeholder="Ex: Politriz de Bancada" style="flex-grow: 3;">
                    </div>
                    <div class="form-row" style="gap: 20px;">
                        <div class="form-group">
                            <label for="equipment-value">Valor (R$):</label>
                            <input type="number" id="equipment-value" min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label for="equipment-lifespan">Vida Útil:</label>
                            <input type="number" id="equipment-lifespan" min="1" value="36">
                        </div>
                        <div class="form-group">
                            <label for="equipment-lifespan-unit">Unidade:</label>
                            <select id="equipment-lifespan-unit">
                                <option value="months" selected>Meses</option>
                                <option value="years">Anos</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="equipment-category">Categoria:</label>
                        <input type="text" id="equipment-category" placeholder="Ex: Ferramentas Elétricas (Opcional)">
                    </div>
                    <button type="button" id="add-update-equipment" class="action-button">
                        <i class="fas fa-plus"></i> Adicionar/Atualizar
                    </button>
                    <button type="button" id="cancel-edit-equipment" class="secondary-button hidden" style="margin-left: 10px;">
                        Cancelar Edição
                    </button>
                </div>
                <hr style="margin: 25px 0;">
                <div class="equipment-list">
                    <h3>Equipamentos Cadastrados</h3>
                    <div class="list-header">
                        <span class="col-name">Nome do Equipamento</span>
                        <span class="col-value">Valor (R$)</span>
                        <span class="col-lifespan">Vida Útil</span>
                        <span class="col-monthly">Deprec./Mês (R$)</span>
                        <span class="col-actions">Ações</span>
                    </div>
                    <div id="equipment-items">
                        <p class="empty-list">Nenhum equipamento cadastrado.</p>
                    </div>
                    <div class="equipment-summary">
                        <p>Total de Equipamentos: <span id="total-equipment-count">0</span></p>
                        <p>Depreciação Mensal Total: <span id="total-monthly-rate">R$ 0,00</span></p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" id="import-equipment" class="secondary-button">
                    <i class="fas fa-file-import"></i> Importar
                </button>
                <button type="button" id="export-equipment" class="secondary-button">
                    <i class="fas fa-file-export"></i> Exportar
                </button>
                <button type="button" class="action-button close-modal-button" data-modal-id="equipment-modal">
                    <i class="fas fa-check"></i> Fechar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    renderEquipmentList(); // Renderiza a lista inicial (vazia ou carregada)
}

function setupEquipmentEventListeners() {
    const modal = document.getElementById('equipment-modal');
    if (!modal) return;

    // Fechar Modal
    document.addEventListener('click', function(event) {
        // Clicar no X ou no botão Fechar
        if (event.target.matches('.close-modal[data-modal-id="equipment-modal"]') || event.target.matches('.close-modal-button[data-modal-id="equipment-modal"]')) {
            modal.classList.add('hidden');
        }
        // Clicar fora do conteúdo do modal
        if (event.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // Ações do Formulário do Modal
    modal.querySelector('#add-update-equipment')?.addEventListener('click', addOrUpdateEquipment);
    modal.querySelector('#cancel-edit-equipment')?.addEventListener('click', cancelEditEquipment);

    // Ações Importar/Exportar
    modal.querySelector('#export-equipment')?.addEventListener('click', exportEquipmentData);
    modal.querySelector('#import-equipment')?.addEventListener('click', () => {
        // Cria input file dinamicamente se não existir
        const input = document.getElementById('equipment-import-input') || (() => {
            const fi = document.createElement('input');
            fi.type = 'file';
            fi.id = 'equipment-import-input';
            fi.accept = '.json';
            fi.style.display = 'none';
            fi.addEventListener('change', importEquipmentData);
            document.body.appendChild(fi);
            return fi;
        })();
        input.click(); // Abre a janela de seleção de arquivo
    });

    // Ações na Lista (Editar/Excluir) - Delegação de Eventos
    const listContainer = modal.querySelector('#equipment-items');
    listContainer?.addEventListener('click', function(event) {
        const editButton = event.target.closest('.edit-equipment');
        const deleteButton = event.target.closest('.delete-equipment');

        if (editButton && editButton.dataset.id) {
            prepareEditEquipment(parseInt(editButton.dataset.id));
        } else if (deleteButton && deleteButton.dataset.id) {
            deleteEquipment(parseInt(deleteButton.dataset.id));
        }
    });
}

// --- CRUD de Equipamentos ---
function addOrUpdateEquipment() {
    const editIdInput = document.getElementById('equipment-edit-id');
    const editId = editIdInput ? editIdInput.value : '';

    if (editId) {
        updateEquipment(parseInt(editId));
    } else {
        addNewEquipment();
    }
}

function addNewEquipment() {
    const nomeInput = document.getElementById('equipment-name');
    const valorInput = document.getElementById('equipment-value');
    const vidaUtilInput = document.getElementById('equipment-lifespan');
    const unidadeSelect = document.getElementById('equipment-lifespan-unit');
    const categoriaInput = document.getElementById('equipment-category');

    const nome = nomeInput ? nomeInput.value.trim() : '';
    const valor = valorInput ? parseFloat(valorInput.value.replace(',', '.')) || 0 : 0;
    const vidaUtilValor = vidaUtilInput ? parseInt(vidaUtilInput.value) || 0 : 0;
    const unidade = unidadeSelect ? unidadeSelect.value : 'months';
    const categoria = categoriaInput ? categoriaInput.value.trim() : '';

    if (!nome) { alert('O nome do equipamento é obrigatório.'); return; }
    if (valor <= 0) { alert('O valor do equipamento deve ser maior que zero.'); return; }
    if (vidaUtilValor <= 0) { alert('A vida útil do equipamento deve ser maior que zero.'); return; }

    let vidaUtilMeses = (unidade === 'years') ? vidaUtilValor * 12 : vidaUtilValor;
    const taxaMensal = vidaUtilMeses > 0 ? valor / vidaUtilMeses : 0;

    const newEquip = {
        id: Date.now(), // ID único
        nome,
        valor,
        vidaUtil: vidaUtilMeses, // Armazena sempre em meses
        categoria,
        taxaMensal
    };

    equipamentosDuraveis.push(newEquip);
    finalizeEquipmentAction('Equipamento adicionado com sucesso!');
}

function updateEquipment(id) {
    const index = equipamentosDuraveis.findIndex(equip => equip.id === id);
    if (index === -1) {
        alert("Erro: Equipamento não encontrado para atualização.");
        cancelEditEquipment();
        return;
    }

    const nomeInput = document.getElementById('equipment-name');
    const valorInput = document.getElementById('equipment-value');
    const vidaUtilInput = document.getElementById('equipment-lifespan');
    const unidadeSelect = document.getElementById('equipment-lifespan-unit');
    const categoriaInput = document.getElementById('equipment-category');

    const nome = nomeInput ? nomeInput.value.trim() : '';
    const valor = valorInput ? parseFloat(valorInput.value.replace(',', '.')) || 0 : 0;
    const vidaUtilValor = vidaUtilInput ? parseInt(vidaUtilInput.value) || 0 : 0;
    const unidade = unidadeSelect ? unidadeSelect.value : 'months';
    const categoria = categoriaInput ? categoriaInput.value.trim() : '';

    if (!nome) { alert('O nome do equipamento é obrigatório.'); return; }
    if (valor <= 0) { alert('O valor do equipamento deve ser maior que zero.'); return; }
    if (vidaUtilValor <= 0) { alert('A vida útil do equipamento deve ser maior que zero.'); return; }

    let vidaUtilMeses = (unidade === 'years') ? vidaUtilValor * 12 : vidaUtilValor;
    const taxaMensal = vidaUtilMeses > 0 ? valor / vidaUtilMeses : 0;

    // Atualiza o objeto existente
    equipamentosDuraveis[index] = {
        ...equipamentosDuraveis[index], // Mantém o ID e outras propriedades não editadas
        nome,
        valor,
        vidaUtil: vidaUtilMeses,
        categoria,
        taxaMensal
    };

    finalizeEquipmentAction('Equipamento atualizado com sucesso!');
    cancelEditEquipment(); // Limpa o formulário após atualizar
}

function prepareEditEquipment(id) {
    const equip = equipamentosDuraveis.find(e => e.id === id);
    if (!equip) return;

    document.getElementById('equipment-edit-id').value = equip.id;
    document.getElementById('equipment-name').value = equip.nome;
    document.getElementById('equipment-value').value = equip.valor;
    document.getElementById('equipment-category').value = equip.categoria || '';

    // Converte vida útil de meses para anos se for múltiplo de 12 e >= 12
    let vidaUtilDisplay = equip.vidaUtil;
    let unidadeDisplay = 'months';
    if (equip.vidaUtil >= 12 && equip.vidaUtil % 12 === 0) {
        vidaUtilDisplay = equip.vidaUtil / 12;
        unidadeDisplay = 'years';
    }
    document.getElementById('equipment-lifespan').value = vidaUtilDisplay;
    document.getElementById('equipment-lifespan-unit').value = unidadeDisplay;

    // Muda texto do botão e mostra botão Cancelar
    const addUpdateButton = document.getElementById('add-update-equipment');
    const cancelButton = document.getElementById('cancel-edit-equipment');
    if (addUpdateButton) addUpdateButton.innerHTML = '<i class="fas fa-save"></i> Atualizar';
    if (cancelButton) cancelButton.classList.remove('hidden');

    document.getElementById('equipment-name').focus(); // Foca no primeiro campo
}

function cancelEditEquipment() {
    document.getElementById('equipment-edit-id').value = ''; // Limpa ID oculto
    document.getElementById('equipment-name').value = '';
    document.getElementById('equipment-value').value = '';
    document.getElementById('equipment-lifespan').value = '36'; // Valor padrão
    document.getElementById('equipment-lifespan-unit').value = 'months'; // Unidade padrão
    document.getElementById('equipment-category').value = '';

    // Restaura botão Adicionar e esconde Cancelar
    const addUpdateButton = document.getElementById('add-update-equipment');
    const cancelButton = document.getElementById('cancel-edit-equipment');
    if (addUpdateButton) addUpdateButton.innerHTML = '<i class="fas fa-plus"></i> Adicionar/Atualizar';
    if (cancelButton) cancelButton.classList.add('hidden');
}

function deleteEquipment(id) {
    const equipIndex = equipamentosDuraveis.findIndex(e => e.id === id);
    if (equipIndex === -1) return; // Não encontrado

    const equipName = equipamentosDuraveis[equipIndex].nome;
    if (confirm(`Tem certeza que deseja excluir o equipamento "${equipName}"?`)) {
        equipamentosDuraveis.splice(equipIndex, 1); // Remove o item do array
        finalizeEquipmentAction('Equipamento excluído.');
    }
}

function finalizeEquipmentAction(message) {
    // Chamada após adicionar, atualizar ou excluir
    cancelEditEquipment(); // Limpa o formulário de edição
    saveEquipmentToStorage(); // Salva a lista atualizada no localStorage
    renderEquipmentList(); // Atualiza a lista exibida no modal
    updateEquipmentSummaryInForm(); // Atualiza o resumo na seção do formulário principal
    // Recalcula o custo total se a função existir (para refletir mudança na depreciação)
    if (typeof runCalculationsAndUpdateUI === 'function') {
        runCalculationsAndUpdateUI();
    }
    // console.log(message); // Opcional: Log de sucesso
}

// --- Renderização da Lista no Modal ---
function renderEquipmentList() {
    const container = document.getElementById('equipment-items');
    const summaryCount = document.getElementById('total-equipment-count');
    const summaryRate = document.getElementById('total-monthly-rate');

    if (!container || !summaryCount || !summaryRate) {
        console.error("Elementos da lista de equipamentos ou sumário não encontrados no modal.");
        return;
    }

    container.innerHTML = ''; // Limpa lista atual
    let totalRate = 0;

    if (equipamentosDuraveis.length === 0) {
        container.innerHTML = '<p class="empty-list">Nenhum equipamento cadastrado.</p>';
    } else {
        // Ordena alfabeticamente para melhor visualização
        equipamentosDuraveis.sort((a, b) => a.nome.localeCompare(b.nome));

        equipamentosDuraveis.forEach(equip => {
            const item = document.createElement('div');
            item.className = 'equipment-item';

            // Formata a vida útil para exibição
            let vidaUtilDisplay = `${equip.vidaUtil} mes(es)`;
            if (equip.vidaUtil >= 12 && equip.vidaUtil % 12 === 0) {
                vidaUtilDisplay = `${equip.vidaUtil / 12} ano(s)`;
            }

            item.innerHTML = `
                <span class="col-name" title="${equip.categoria || 'Sem categoria'}">${equip.nome}</span>
                <span class="col-value">${formatCurrency(equip.valor)}</span>
                <span class="col-lifespan">${vidaUtilDisplay}</span>
                <span class="col-monthly">${formatCurrency(equip.taxaMensal)}</span>
                <span class="col-actions">
                    <button type="button" class="edit-equipment action-button-icon" data-id="${equip.id}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button type="button" class="delete-equipment action-button-icon" data-id="${equip.id}" title="Excluir"><i class="fas fa-trash"></i></button>
                </span>
            `;
            container.appendChild(item);
            totalRate += equip.taxaMensal || 0;
        });
    }

    // Atualiza o sumário no rodapé do modal
    summaryCount.textContent = equipamentosDuraveis.length;
    summaryRate.textContent = formatCurrency(totalRate);
}


// --- Integração com Formulário Principal ---

// Função para injetar a seção de depreciação no local correto
function addEquipmentSectionToCalculator() {
    const placeholder = document.getElementById('equipment-depreciation-placeholder');
    if (!placeholder) { console.error("Placeholder de equipamento não encontrado no HTML principal."); return; }
    if (document.getElementById('equipment-depreciation-section')) return; // Evita duplicar

    const equipmentSection = document.createElement('div');
    equipmentSection.id = 'equipment-depreciation-section';
    equipmentSection.className = 'subsection'; // Usa classe subsection para herdar estilos
    equipmentSection.innerHTML = `
        <h3><i class="fas fa-recycle"></i> Desgaste Equipamentos</h3>
        <div class="equipment-summary-form">
            <p>Deprec. Mensal Total: <strong id="monthly-depreciation-form">R$ 0,00</strong> (<span id="equipment-count-form">0</span> equips.)</p>
            <button type="button" id="manage-equipment-button" class="secondary-button manage-equipment-btn-form">
                <i class="fas fa-tools"></i> Gerenciar
            </button>
        </div>
        <hr style="margin: 10px 0;">
        <div class="form-row">
             <!-- Agrupa Dias Trab + Tooltip -->
             <div class="form-group">
                <label for="work-days">Dias Trab. (Peça):</label>
                <div class="input-with-tooltip"> <!-- << WRAPPER ADICIONADO >> -->
                    <input type="number" id="work-days" min="0.1" step="0.1" value="1">
                    <div class="tooltip">
                        <i class="fas fa-question-circle"></i>
                        <span class="tooltiptext">Quantos dias de trabalho (ou fração) esta peça específica exigiu o uso dos seus equipamentos duráveis? Ex: 0.5 para meio dia.</span>
                    </div>
                </div>
            </div>
            <!-- Agrupa Fator Uso + Tooltip -->
            <div class="form-group">
                <label for="equipment-usage-factor">Fator Uso (%):</label>
                <div class="input-with-tooltip"> <!-- << WRAPPER ADICIONADO >> -->
                    <input type="number" id="equipment-usage-factor" min="0" max="100" value="100">
                    <div class="tooltip">
                        <i class="fas fa-question-circle"></i>
                        <span class="tooltiptext">Percentual médio de uso dos seus equipamentos nesta peça em relação ao uso total diário. 100% se usou a maioria das ferramentas principais. Reduza se usou poucas ferramentas ou por pouco tempo.</span>
                    </div>
                 </div>
            </div>
        </div>
        <div class="result-group">
            <label>Custo Desgaste (Peça):</label>
            <span id="piece-equipment-cost">R$ 0,00</span>
             <div class="tooltip"> <!-- Tooltip para o resultado -->
                 <i class="fas fa-question-circle"></i>
                 <span class="tooltiptext">Custo estimado da depreciação dos seus equipamentos alocado a esta peça, baseado na depreciação mensal total, dias de trabalho na peça e fator de uso.</span>
             </div>
        </div>
    `;
    placeholder.replaceWith(equipmentSection);

    // Adiciona listener ao botão "Gerenciar" recém-criado
    const manageButton = document.getElementById('manage-equipment-button');
    if (manageButton) {
        manageButton.addEventListener('click', showEquipmentManager);
    } else {
        console.error("Botão 'manage-equipment-button' não encontrado após injeção.");
    }

    updateEquipmentSummaryInForm(); // Atualiza os valores iniciais
}


function showEquipmentManager() {
    const modal = document.getElementById('equipment-modal');
    if (modal) {
        renderEquipmentList(); // Garante que a lista está atualizada
        modal.classList.remove('hidden');
    } else {
        console.error("Modal de gerenciamento de equipamentos não encontrado.");
        alert("Erro: O modal de equipamentos não pôde ser aberto.");
    }
}

// Atualiza o resumo exibido na seção do formulário principal
function updateEquipmentSummaryInForm() {
    const countElement = document.getElementById('equipment-count-form');
    const rateElement = document.getElementById('monthly-depreciation-form');

    if (!countElement || !rateElement) {
        // console.warn("Elementos de resumo de equipamento no formulário não encontrados."); // Pode acontecer antes da injeção
        return;
    }

    const totalCount = equipamentosDuraveis.length;
    const totalRate = equipamentosDuraveis.reduce((sum, equip) => sum + (equip.taxaMensal || 0), 0);

    countElement.textContent = totalCount;
    rateElement.textContent = formatCurrency(totalRate);
}

// Calcula o custo de depreciação para a peça atual
function calculateEquipmentCostForPiece(workDaysForPiece, usageFactor, workDaysPerMonth) {
    const totalMonthlyRate = equipamentosDuraveis.reduce((sum, equip) => sum + (equip.taxaMensal || 0), 0);

    // Usa valores padrão se não fornecidos ou inválidos
    const daysInMonth = (workDaysPerMonth && workDaysPerMonth > 0) ? workDaysPerMonth : 20; // Default 20 dias/mês
    const daysForPiece = parseFloat(workDaysForPiece) || 0;
    const factor = (parseFloat(usageFactor) || 0) / 100; // Converte % para decimal

    let equipmentCost = 0;
    if (totalMonthlyRate > 0 && daysInMonth > 0 && daysForPiece > 0 && factor > 0) {
        const dailyDepreciationRate = totalMonthlyRate / daysInMonth;
        equipmentCost = dailyDepreciationRate * daysForPiece * factor;
    }

    // Atualiza o elemento na UI
    const pieceCostElement = document.getElementById('piece-equipment-cost');
    if (pieceCostElement) {
        pieceCostElement.textContent = formatCurrency(equipmentCost);
    } else {
        // console.warn("Elemento 'piece-equipment-cost' não encontrado para atualizar custo.");
    }

    return equipmentCost; // Retorna o valor calculado
}

// --- Importar/Exportar Dados ---
function exportEquipmentData() {
    if (equipamentosDuraveis.length === 0) {
        alert("Nenhum equipamento cadastrado para exportar.");
        return;
    }
    try {
        const dataStr = JSON.stringify(equipamentosDuraveis, null, 2); // Formato legível
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = 'meus_equipamentos_joias.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.style.display = 'none'; // Link invisível
        document.body.appendChild(linkElement);

        linkElement.click(); // Simula clique para baixar

        document.body.removeChild(linkElement); // Limpa o link
    } catch (e) {
        console.error("Erro ao exportar dados de equipamentos:", e);
        alert("Ocorreu um erro ao tentar exportar os dados.");
    }
}

function importEquipmentData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // Validação básica do formato importado
            if (Array.isArray(importedData) && importedData.every(item =>
                item && typeof item.nome === 'string' && typeof item.valor === 'number' && typeof item.vidaUtil === 'number'
            )) {
                if (confirm(`Importar ${importedData.length} equipamentos? A lista atual será substituída.`)) {
                    equipamentosDuraveis = importedData;
                    // Re-processa os dados importados
                    equipamentosDuraveis.forEach(equip => {
                        equip.taxaMensal = (equip.vidaUtil > 0) ? (equip.valor / equip.vidaUtil) : 0;
                        if (!equip.id) equip.id = Date.now() + Math.random(); // Garante ID
                    });
                    finalizeEquipmentAction('Equipamentos importados com sucesso!');
                    alert('Equipamentos importados!');
                }
            } else {
                alert('Erro: O arquivo selecionado não contém dados de equipamentos em formato JSON válido.');
            }
        } catch (error) {
            console.error("Erro ao ler ou processar JSON importado:", error);
            alert(`Erro ao ler o arquivo JSON: ${error.message}`);
        } finally {
            event.target.value = null; // Limpa o input file para permitir re-importação do mesmo arquivo
        }
    };
    reader.onerror = function() {
        alert(`Erro ao ler o arquivo: ${reader.error}`);
        event.target.value = null;
    };
    reader.readAsText(file);
}

// --- Função Utilitária ---
function formatCurrency(value) {
    const number = parseFloat(value);
    if (isNaN(number)) return "R$ 0,00";
    // Usa Intl.NumberFormat para formatação robusta (opcional, mas recomendado)
    // return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    // Ou a versão mais simples:
    return `R$ ${number.toFixed(2).replace('.', ',')}`;
}

// --- Função de Exemplo (se necessário) ---
function addDisposableMaterialsSection() {
    console.warn("Funcionalidade de Materiais Descartáveis (addDisposableMaterialsSection) não implementada.");
    // Aqui você poderia injetar uma seção similar à de equipamentos, mas para materiais
    // que são consumidos por peça (ex: lixas, gás, pastas de polimento)
}