// settings.js - Gerenciamento de Configurações

const defaultSettings = {
    calculation: { defaultHourlyRate: 20.00, defaultProfitMargin: 100, defaultSalesTax: 0, defaultPlatformFee: 0, defaultPaymentFee: 0, defaultRounding: '10' },
    interface: { visibleSections: { pieceInfo: true, materials: true, labor: true, expenses: true, taxes: true, profit: true, artistic: true, finalPrice: true, chart: true }, startPage: 'new' },
    storage: { autoSave: false, maxSavedCalculations: 50 }
};
let currentSettings = {};

function initializeSettingsManager() { /* ... (código como antes) ... */ console.log("Inicializando Gerenciador de Configurações..."); loadSettingsFromStorage(); createSettingsModal(); setupSettingsEventListeners(); applyCurrentSettings(); console.log("Gerenciador de Configurações Inicializado."); }
function loadSettingsFromStorage() { /* ... (código como antes) ... */ const savedSettings = localStorage.getItem('calculatorSettings'); if (savedSettings) { try { const parsedSettings = JSON.parse(savedSettings); currentSettings = mergeDeep(JSON.parse(JSON.stringify(defaultSettings)), parsedSettings); } catch (e) { console.error('Erro ao carregar config:', e); currentSettings = JSON.parse(JSON.stringify(defaultSettings)); } } else { currentSettings = JSON.parse(JSON.stringify(defaultSettings)); } }
function saveSettingsToStorage() { /* ... (código como antes) ... */ try { localStorage.setItem('calculatorSettings', JSON.stringify(currentSettings)); console.log("Configurações salvas."); } catch (e) { console.error("Erro ao salvar config:", e); alert("Erro ao salvar configurações."); } }

function createSettingsModal() {
    if (document.getElementById('settings-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'settings-modal'; modal.className = 'modal hidden';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header"> <h2>Configurações</h2> <span class="close-modal" data-modal-id="settings-modal">×</span> </div>
            <div class="modal-body">
                <div class="settings-tabs">
                    <button type="button" class="tab-button active" data-tab="calculation">Cálculos Padrão</button>
                    <button type="button" class="tab-button" data-tab="interface">Interface</button>
                    <button type="button" class="tab-button" data-tab="storage">Armazenamento</button>
                </div>
                <div class="tab-content">
                    <!-- Aba Cálculos -->
                    <div id="calculation-tab" class="tab-pane active">
                        <h3>Valores Padrão para Novos Cálculos</h3>
                        <div class="form-group"> <label for="setting-hourly-rate">Valor Hora (R$):</label> <input type="number" id="setting-hourly-rate" min="0" step="0.01"> </div>
                        <div class="form-group"> <label for="setting-profit-margin">Margem Lucro (%):</label> <input type="number" id="setting-profit-margin" min="0"> </div>
                        <div class="form-group"> <label for="setting-sales-tax">Imposto Venda (%):</label> <input type="number" id="setting-sales-tax" min="0" max="100" step="0.1"> </div>
                        <div class="form-group"> <label for="setting-platform-fee">Taxa Plataforma (%):</label> <input type="number" id="setting-platform-fee" min="0" max="100" step="0.1"> </div>
                        <div class="form-group"> <label for="setting-payment-fee">Taxa Pagamento (%):</label> <input type="number" id="setting-payment-fee" min="0" max="100" step="0.1"> </div>
                        <div class="form-group"> <label for="setting-rounding">Arredondamento:</label> <select id="setting-rounding"> <option value="none">Não arredondar</option> <option value="0.5">R$ 0,50</option> <option value="1">R$ 1,00</option> <option value="5">R$ 5,00</option> <option value="10">R$ 10,00</option> <option value="50">R$ 50,00</option> <option value="100">R$ 100,00</option> </select> </div>
                    </div>
                    <!-- Aba Interface -->
                    <div id="interface-tab" class="tab-pane">
                        <h3>Visibilidade das Seções</h3>
                        <div class="section-toggles">
                            ${Object.keys(defaultSettings.interface.visibleSections).map(key => ` <div class="form-group checkbox"> <input type="checkbox" id="setting-show-${key}"> <label for="setting-show-${key}">${getSectionLabel(key)}</label> </div> `).join('')}
                        </div>
                        <hr>
                        <!-- Seção 'Ordem das Seções' REMOVIDA -->
                         <h3>Comportamento Inicial</h3>
                         <div class="form-group"> <label for="setting-start-page">Ao abrir:</label> <select id="setting-start-page"> <option value="new">Novo cálculo</option> <option value="last">Último cálculo</option> <option value="saved">Lista de salvos</option> </select> </div>
                    </div>
                    <!-- Aba Armazenamento -->
                    <div id="storage-tab" class="tab-pane">
                        <h3>Cálculos Salvos</h3>
                        <div class="form-group checkbox"> <input type="checkbox" id="setting-auto-save"> <label for="setting-auto-save">Salvar ao fechar (Não Recomendado)</label> </div>
                        <div class="form-group"> <label for="setting-max-saved">Máximo de cálculos salvos:</label> <input type="number" id="setting-max-saved" min="5" max="200" step="5"> </div>
                         <hr>
                        <h3>Backup e Restauração</h3>
                        <p>Inclui configurações, cálculos salvos e equipamentos.</p>
                        <div class="backup-options">
                            <button type="button" id="export-all-data" class="action-button"><i class="fas fa-file-export"></i> Exportar Tudo</button>
                            <button type="button" id="import-all-data" class="action-button"><i class="fas fa-file-import"></i> Importar Tudo</button>
                            <input type="file" id="import-all-input" accept=".json" style="display:none;">
                        </div>
                         <hr>
                        <h3>Limpeza Geral</h3>
                         <!-- Botão Limpar com classes action-button e error -->
                         <button type="button" id="clear-all-data" class="action-button error">
                            <i class="fas fa-trash"></i> Limpar TODOS os Dados
                        </button>
                        <p style="font-size: 0.9em; color: var(--error-color); margin-top: 5px;"><strong>Atenção:</strong> Ação irreversível.</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" id="reset-all-settings" class="secondary-button"> <i class="fas fa-undo"></i> Restaurar Padrões </button>
                <button type="button" id="save-settings" class="action-button"> <i class="fas fa-save"></i> Salvar e Aplicar </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function setupSettingsEventListeners() { /* ... (código como antes) ... */ const modal = document.getElementById('settings-modal'); if (!modal) return; modal.querySelector('.close-modal')?.addEventListener('click', () => modal.classList.add('hidden')); modal.querySelectorAll('.tab-button').forEach(button => button.addEventListener('click', () => switchSettingsTab(button.dataset.tab))); modal.querySelector('#save-settings')?.addEventListener('click', saveSettingsChanges); modal.querySelector('#reset-all-settings')?.addEventListener('click', resetAllSettings); modal.querySelector('#export-all-data')?.addEventListener('click', exportAllData); modal.querySelector('#import-all-data')?.addEventListener('click', () => modal.querySelector('#import-all-input')?.click()); modal.querySelector('#import-all-input')?.addEventListener('change', importAllData); modal.querySelector('#clear-all-data')?.addEventListener('click', clearAllData); }
function showSettingsManager() { /* ... (código como antes) ... */ const modal = document.getElementById('settings-modal'); if (modal) { populateSettingsModal(); switchSettingsTab('calculation'); modal.classList.remove('hidden'); } }
function populateSettingsModal() { /* ... (código como antes) ... */ setInputValue('setting-hourly-rate', currentSettings.calculation.defaultHourlyRate); setInputValue('setting-profit-margin', currentSettings.calculation.defaultProfitMargin); setInputValue('setting-sales-tax', currentSettings.calculation.defaultSalesTax); setInputValue('setting-platform-fee', currentSettings.calculation.defaultPlatformFee); setInputValue('setting-payment-fee', currentSettings.calculation.defaultPaymentFee); setSelectValue('setting-rounding', currentSettings.calculation.defaultRounding); for (const key in currentSettings.interface.visibleSections) { const checkbox = document.getElementById(`setting-show-${key}`); if (checkbox) checkbox.checked = currentSettings.interface.visibleSections[key]; } setSelectValue('setting-start-page', currentSettings.interface.startPage); const autoSaveCheckbox = document.getElementById('setting-auto-save'); if(autoSaveCheckbox) autoSaveCheckbox.checked = currentSettings.storage.autoSave; setInputValue('setting-max-saved', currentSettings.storage.maxSavedCalculations); }
function switchSettingsTab(tabName) { /* ... (código como antes) ... */ const modal = document.getElementById('settings-modal'); if (!modal) return; modal.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active')); modal.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active')); modal.querySelector(`.tab-button[data-tab="${tabName}"]`)?.classList.add('active'); modal.querySelector(`#${tabName}-tab`)?.classList.add('active'); }
function saveSettingsChanges() { /* ... (código como antes) ... */ console.log("Salvando configurações..."); currentSettings.calculation.defaultHourlyRate = getInputNumber('setting-hourly-rate'); currentSettings.calculation.defaultProfitMargin = getInputNumber('setting-profit-margin'); currentSettings.calculation.defaultSalesTax = getInputNumber('setting-sales-tax'); currentSettings.calculation.defaultPlatformFee = getInputNumber('setting-platform-fee'); currentSettings.calculation.defaultPaymentFee = getInputNumber('setting-payment-fee'); currentSettings.calculation.defaultRounding = getSelectValue('setting-rounding'); for (const key in currentSettings.interface.visibleSections) { const checkbox = document.getElementById(`setting-show-${key}`); if (checkbox) currentSettings.interface.visibleSections[key] = checkbox.checked; } currentSettings.interface.startPage = getSelectValue('setting-start-page'); const autoSaveCheckbox = document.getElementById('setting-auto-save'); if(autoSaveCheckbox) currentSettings.storage.autoSave = autoSaveCheckbox.checked; currentSettings.storage.maxSavedCalculations = getInputNumber('setting-max-saved', 50); saveSettingsToStorage(); applyCurrentSettings(); document.getElementById('settings-modal')?.classList.add('hidden'); alert("Configurações salvas e aplicadas!"); if (typeof runCalculationsAndUpdateUI === 'function') runCalculationsAndUpdateUI(); }
function resetAllSettings() { /* ... (código como antes) ... */ if (confirm("Restaurar configurações padrão?")) { currentSettings = JSON.parse(JSON.stringify(defaultSettings)); populateSettingsModal(); alert("Padrões restaurados. Clique 'Salvar' para confirmar."); } }
function applyCurrentSettings() { /* ... (código como antes) ... */ console.log("Aplicando configurações..."); const sectionsContainer = document.getElementById('price-calculator'); if (sectionsContainer) { for (const key in currentSettings.interface.visibleSections) { const sectionElement = sectionsContainer.querySelector(`.form-section[data-section="${key}"]`); const chartElement = sectionsContainer.querySelector(`.chart-container[data-section="chart"]`); if (sectionElement) sectionElement.style.display = currentSettings.interface.visibleSections[key] ? '' : 'none'; else if (key === 'chart' && chartElement) chartElement.style.display = currentSettings.interface.visibleSections[key] ? '' : 'none'; } } if (typeof applySettingsToInputs === 'function') applySettingsToInputs(); console.log("Configurações aplicadas."); }
function exportAllData() { /* ... (código como antes) ... */ try { const allData = { version: "1.0", exportDate: new Date().toISOString(), settings: currentSettings, savedCalculations: savedCalculations || [], equipment: equipamentosDuraveis || [] }; const dataStr = JSON.stringify(allData, null, 2); const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr); const exportFileDefaultName = `calculadora_joias_backup_${new Date().toISOString().slice(0,10)}.json`; const linkElement = document.createElement('a'); linkElement.setAttribute('href', dataUri); linkElement.setAttribute('download', exportFileDefaultName); document.body.appendChild(linkElement); linkElement.click(); document.body.removeChild(linkElement); alert("Backup exportado!"); } catch (error) { console.error("Erro ao exportar:", error); alert("Erro ao exportar dados."); } }
function importAllData(event) { /* ... (código como antes) ... */ const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(e) { try { const importedAllData = JSON.parse(e.target.result); if (!importedAllData || !importedAllData.settings || !importedAllData.savedCalculations || !importedAllData.equipment) throw new Error("Formato inválido."); if (confirm("IMPORTANTE: Substituir TODOS os dados atuais?")) { currentSettings = mergeDeep(JSON.parse(JSON.stringify(defaultSettings)), importedAllData.settings); savedCalculations = importedAllData.savedCalculations || []; equipamentosDuraveis = importedAllData.equipment || []; equipamentosDuraveis.forEach(equip => { equip.taxaMensal = (equip.vidaUtil > 0) ? (equip.valor / equip.vidaUtil) : 0; if (!equip.id) equip.id = Date.now() + Math.random(); }); saveSettingsToStorage(); if(typeof saveCalculationsToStorage === 'function') saveCalculationsToStorage(); if(typeof saveEquipmentToStorage === 'function') saveEquipmentToStorage(); applyCurrentSettings(); if (typeof updateEquipmentSummaryInForm === 'function') updateEquipmentSummaryInForm(); if (typeof renderSavedCalculationsList === 'function') renderSavedCalculationsList(); if (typeof renderEquipmentList === 'function') renderEquipmentList(); if (typeof runCalculationsAndUpdateUI === 'function') runCalculationsAndUpdateUI(); alert("Dados importados!"); } } catch (error) { alert(`Erro ao importar: ${error.message}`); } finally { event.target.value = null; } }; reader.onerror = function() { alert(`Erro ao ler arquivo: ${reader.error}`); event.target.value = null; }; reader.readAsText(file); }
function clearAllData() { /* ... (código como antes) ... */ if (confirm("!!! ATENÇÃO !!!\n\nApagar TODOS os dados (configurações, cálculos, equipamentos)?\n\nAção IRREVERSÍVEL.")) { try { localStorage.removeItem('calculatorSettings'); localStorage.removeItem('savedCalculations'); localStorage.removeItem('equipamentosDuraveis'); localStorage.removeItem('calculatorTheme'); localStorage.removeItem('customThemeColors'); currentSettings = JSON.parse(JSON.stringify(defaultSettings)); savedCalculations = []; equipamentosDuraveis = []; applyCurrentSettings(); if (typeof updateEquipmentSummaryInForm === 'function') updateEquipmentSummaryInForm(); if (typeof renderSavedCalculationsList === 'function') renderSavedCalculationsList(); if (typeof renderEquipmentList === 'function') renderEquipmentList(); if (typeof resetForm === 'function') resetForm(); alert("Todos os dados apagados."); location.reload(); } catch (error) { alert("Erro ao limpar dados."); } } }
function getSectionLabel(key) { /* ... (código como antes) ... */ const labels = { pieceInfo: "Info Peça", materials: "Materiais", labor: "Mão Obra", expenses: "Despesas", taxes: "Taxas", profit: "Lucro", artistic: "Artístico", finalPrice: "Resumo", chart: "Gráfico" }; return labels[key] || key; }
function mergeDeep(target, source) { /* ... (código como antes) ... */ const isObject = (obj) => obj && typeof obj === 'object'; if (!isObject(target) || !isObject(source)) return source; Object.keys(source).forEach(key => { const targetValue = target[key]; const sourceValue = source[key]; if (Array.isArray(targetValue) && Array.isArray(sourceValue)) target[key] = sourceValue; else if (isObject(targetValue) && isObject(sourceValue)) target[key] = mergeDeep(Object.assign({}, targetValue), sourceValue); else target[key] = sourceValue; }); return target; }
function setInputValue(id, value) { const el = document.getElementById(id); if (el) el.value = value ?? ''; }
function getSelectValue(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setSelectValue(id, value) { const el = document.getElementById(id); if (el) el.value = value; }
function getInputNumber(id, defaultValue = 0) { const el = document.getElementById(id); const val = parseFloat(el ? el.value : defaultValue); return isNaN(val) ? defaultValue : val; }