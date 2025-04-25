// themes.js - Gerenciamento de temas

let currentTheme = 'light';
let customThemeColors = { primary: '#b87333', secondary: '#2c3e50', accent: '#3498db' };

function initializeThemeManager() {
    // console.log("Inicializando Gerenciador de Temas..."); // Log Opcional
    loadThemeFromStorage();
    applyTheme(currentTheme);
    addThemeStylesToHead(); // Adiciona CSS PRIMEIRO para que as classes existam
    createThemeModal(); // Cria ou atualiza o HTML do modal DEPOIS do CSS
    setupThemeEventListeners(); // Adiciona listeners AO MODAL CRIADO/ATUALIZADO
    // console.log("Gerenciador de Temas Inicializado."); // Log Opcional
}
function loadThemeFromStorage() {
    const savedTheme = localStorage.getItem('calculatorTheme');
    if (savedTheme) currentTheme = savedTheme;
    const savedColors = localStorage.getItem('customThemeColors');
    if (savedColors) {
        try { customThemeColors = JSON.parse(savedColors); } catch (e) { console.error("Erro ao carregar cores customizadas:", e); }
    }
}
function saveThemeToStorage() {
    localStorage.setItem('calculatorTheme', currentTheme);
    if (currentTheme === 'custom') localStorage.setItem('customThemeColors', JSON.stringify(customThemeColors));
    else localStorage.removeItem('customThemeColors');
}

function createThemeModal() {
    let modal = document.getElementById('theme-modal');
    if (!modal) { modal = document.createElement('div'); modal.id = 'theme-modal'; modal.className = 'modal hidden'; document.body.appendChild(modal); }

    // Recria o conteúdo interno - ADICIONANDO classes de tema às previews
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Selecionar Tema</h2>
                <span class="close-modal" data-modal-id="theme-modal">×</span>
            </div>
            <div class="modal-body">
                <h3>Temas Pré-definidos</h3>
                <div class="theme-options">
                    <div class="theme-option" data-theme="light" title="Tema Claro">
                        <div class="theme-preview light-theme"></div> <!-- Classe light-theme adicionada -->
                        <span>Claro</span>
                    </div>
                    <div class="theme-option" data-theme="dark" title="Tema Escuro">
                        <div class="theme-preview dark-theme"></div> <!-- Classe dark-theme adicionada -->
                        <span>Escuro</span>
                    </div>
                    <div class="theme-option" data-theme="copper" title="Tema Cobre">
                        <div class="theme-preview copper-theme"></div> <!-- Classe copper-theme adicionada -->
                        <span>Cobre</span>
                    </div>
                    <div class="theme-option" data-theme="oxidized" title="Tema Cobre Oxidado">
                        <div class="theme-preview oxidized-theme"></div> <!-- Classe oxidized-theme adicionada -->
                        <span>Oxidado</span>
                    </div>
                </div>
                <hr>
                <div class="custom-colors-toggle form-group checkbox">
                    <input type="checkbox" id="toggle-custom-colors">
                    <label for="toggle-custom-colors">Personalizar Cores</label>
                </div>
                <div class="color-customization">
                    <div class="form-group">
                        <label for="primary-color">Cor Principal:</label>
                        <input type="color" id="primary-color">
                    </div>
                    <div class="form-group">
                        <label for="secondary-color">Cor Secundária:</label>
                        <input type="color" id="secondary-color">
                    </div>
                    <div class="form-group">
                        <label for="accent-color">Cor de Destaque:</label>
                        <input type="color" id="accent-color">
                    </div>
                    <div class="form-group">
                        <button type="button" id="apply-custom-colors" class="action-button">Aplicar Cores</button>
                        <button type="button" id="reset-colors" class="secondary-button">Restaurar Padrões</button>
                    </div>
                    <p style="font-size: 0.85em; margin-top: 5px;"><i>Aplicar cores definirá o tema como "Personalizado".</i></p>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="action-button close-modal-button" data-modal-id="theme-modal">
                    <i class="fas fa-check"></i> Fechar
                </button>
            </div>
        </div>
    `;
    setupThemeEventListeners(); // Re-adiciona listeners
}

// Event Listeners (Com fechamento específico)
function setupThemeEventListeners() {
    const modal = document.getElementById('theme-modal');
    if (!modal) return;

    // Fechar modal
    modal.querySelector('.close-modal')?.addEventListener('click', () => modal.classList.add('hidden'));
    modal.querySelector('.close-modal-button')?.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.add('hidden'); });

    // Outros listeners
    modal.querySelectorAll('.theme-option').forEach(option => option.addEventListener('click', () => selectTheme(option.dataset.theme)));
    modal.querySelector('#apply-custom-colors')?.addEventListener('click', applyAndSelectCustomTheme);
    modal.querySelector('#reset-colors')?.addEventListener('click', resetColorPickersToDefault);
    modal.querySelector('#primary-color')?.addEventListener('input', (e) => previewCustomColor('--primary-color', e.target.value));
    modal.querySelector('#secondary-color')?.addEventListener('input', (e) => previewCustomColor('--secondary-color', e.target.value));
    modal.querySelector('#accent-color')?.addEventListener('input', (e) => previewCustomColor('--accent-color', e.target.value));
    modal.querySelector('#toggle-custom-colors')?.addEventListener('change', (e) => {
        const customizationDiv = modal.querySelector('.color-customization');
        if (customizationDiv) customizationDiv.style.display = e.target.checked ? 'block' : 'none';
        // Ao marcar, atualiza os pickers com as cores customizadas atuais
        if (e.target.checked) {
            const primary = customThemeColors.primary || '#b87333';
            const secondary = customThemeColors.secondary || '#2c3e50';
            const accent = customThemeColors.accent || '#3498db';
            modal.querySelector('#primary-color').value = primary;
            modal.querySelector('#secondary-color').value = secondary;
            modal.querySelector('#accent-color').value = accent;
        }
    });
}

function showThemeSelector() {
       const modal = document.getElementById('theme-modal');
       if (modal) {
           // Atualiza os color pickers apenas se a personalização estiver ativa
           const toggleCheckbox = modal.querySelector('#toggle-custom-colors');
           toggleCheckbox.checked = (currentTheme === 'custom'); // Marca/desmarca o checkbox
           modal.querySelector('.color-customization').style.display = toggleCheckbox.checked ? 'block' : 'none';

           if (toggleCheckbox.checked) {
               const primary = customThemeColors.primary || '#b87333';
               const secondary = customThemeColors.secondary || '#2c3e50';
               const accent = customThemeColors.accent || '#3498db';
               modal.querySelector('#primary-color').value = primary;
               modal.querySelector('#secondary-color').value = secondary;
               modal.querySelector('#accent-color').value = accent;
           }

           // Marca o tema atual como selecionado
           modal.querySelectorAll('.theme-option').forEach(opt => {
               opt.classList.toggle('selected', opt.dataset.theme === currentTheme);
           });

           modal.classList.remove('hidden');
       }
 }
function selectTheme(themeName) {
        if (currentTheme !== themeName) {
            currentTheme = themeName;
            applyTheme(currentTheme); // Aplica o tema ao body
            saveThemeToStorage();

            // Atualiza a UI do modal
            const modal = document.getElementById('theme-modal');
            if(modal) {
                // Atualiza a seleção visual no modal
                modal.querySelectorAll('.theme-option').forEach(opt => {
                    opt.classList.toggle('selected', opt.dataset.theme === currentTheme);
                });
                // Desmarca e esconde a personalização se um tema pré-definido foi escolhido
                const toggleCheckbox = modal.querySelector('#toggle-custom-colors');
                const customizationDiv = modal.querySelector('.color-customization');
                if (toggleCheckbox && customizationDiv && themeName !== 'custom') {
                    toggleCheckbox.checked = false;
                    customizationDiv.style.display = 'none';
                }
            }
        }
 }
function applyAndSelectCustomTheme() {
        const primary = document.getElementById('primary-color').value;
        const secondary = document.getElementById('secondary-color').value;
        const accent = document.getElementById('accent-color').value;
        customThemeColors = { primary, secondary, accent };
        currentTheme = 'custom'; // Define o tema atual como customizado
        applyTheme(currentTheme); // Aplica as cores customizadas ao body
        saveThemeToStorage();

        // Atualiza a UI do modal
        const modal = document.getElementById('theme-modal');
        if(modal) {
            // Desmarca todos os temas pré-definidos
            modal.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('selected'));
            // Garante que o checkbox de personalização esteja marcado e a seção visível
            const toggleCheckbox = modal.querySelector('#toggle-custom-colors');
            if(toggleCheckbox) toggleCheckbox.checked = true;
            modal.querySelector('.color-customization').style.display = 'block';
            alert("Cores personalizadas aplicadas!");
        }
 }
function resetColorPickersToDefault() {
        const defaultPrimary = '#b87333';
        const defaultSecondary = '#2c3e50';
        const defaultAccent = '#3498db';
        document.getElementById('primary-color').value = defaultPrimary;
        document.getElementById('secondary-color').value = defaultSecondary;
        document.getElementById('accent-color').value = defaultAccent;
        // Dispara o evento 'input' para que a preview (se visível) atualize
        // document.getElementById('primary-color').dispatchEvent(new Event('input'));
        // document.getElementById('secondary-color').dispatchEvent(new Event('input'));
        // document.getElementById('accent-color').dispatchEvent(new Event('input'));
}
function applyTheme(theme) {
      const body = document.body;
      // Remove todas as classes de tema antes de adicionar a nova
      body.classList.remove('light-theme', 'dark-theme', 'copper-theme', 'oxidized-theme', 'custom-theme');

      // Limpa variáveis customizadas se não for tema customizado
      if (theme !== 'custom') {
          document.documentElement.style.removeProperty('--custom-primary');
          document.documentElement.style.removeProperty('--custom-primary-dark');
          document.documentElement.style.removeProperty('--custom-primary-light');
          document.documentElement.style.removeProperty('--custom-secondary');
          document.documentElement.style.removeProperty('--custom-accent');
          document.documentElement.style.removeProperty('--custom-bg');
          document.documentElement.style.removeProperty('--custom-card');
          document.documentElement.style.removeProperty('--custom-text');
          document.documentElement.style.removeProperty('--custom-border');
      }

      if (theme === 'custom') {
          body.classList.add('custom-theme');
          // Define as variáveis CSS customizadas globais
          document.documentElement.style.setProperty('--custom-primary', customThemeColors.primary);
          document.documentElement.style.setProperty('--custom-primary-dark', lightenDarkenColor(customThemeColors.primary, -40));
          document.documentElement.style.setProperty('--custom-primary-light', lightenDarkenColor(customThemeColors.primary, 40));
          document.documentElement.style.setProperty('--custom-secondary', customThemeColors.secondary);
          document.documentElement.style.setProperty('--custom-accent', customThemeColors.accent);

          // Determina cores de fundo/texto com base na luminância da cor primária
          const primaryLum = getLuminance(customThemeColors.primary);
          const isLightPrimary = primaryLum > 0.5;
          document.documentElement.style.setProperty('--custom-bg', isLightPrimary ? '#f8f8f8' : '#333333');
          document.documentElement.style.setProperty('--custom-card', isLightPrimary ? '#ffffff' : '#444444');
          document.documentElement.style.setProperty('--custom-text', isLightPrimary ? '#333333' : '#f0f0f0'); // Um pouco mais claro que branco puro
          document.documentElement.style.setProperty('--custom-border', isLightPrimary ? '#e0e0e0' : '#555555');
      } else if (['light','dark','copper','oxidized'].includes(theme)) {
          // Adiciona a classe do tema pré-definido
          body.classList.add(`${theme}-theme`);
      } else {
          // Fallback para o tema claro
          body.classList.add('light-theme');
      }
      console.log(`Tema aplicado ao body: ${theme}`);
}

// Função de preview (APENAS para o modo customizado)
function previewCustomColor(variableName, color) {
    // Esta função agora apenas aplica a cor customizada para visualização
    // enquanto o usuário interage com o color picker.
    // Ela NÃO muda o tema global permanentemente.
    // O tema 'custom' só é aplicado permanentemente com o botão 'Aplicar Cores'.
    document.documentElement.style.setProperty(variableName.replace('--','--custom-'), color);

    // Para a preview funcionar visualmente, força temporariamente a classe custom-theme no body,
    // mas SEM salvar ou alterar a variável 'currentTheme' globalmente aqui.
    // A ideia é que ao fechar o modal ou selecionar outro tema, a classe correta será restaurada.
    // document.body.classList.add('custom-theme');
}

function addThemeStylesToHead() {
    if (document.getElementById('theme-styles')) return;
    const styleElement = document.createElement('style');
    styleElement.id = 'theme-styles';

    // CSS com cores das previews CORRIGIDO
    styleElement.textContent = `
        :root { /* Defaults - Usados como fallback */
            --default-primary: #b87333; --default-primary-dark: #8c5823; --default-primary-light: #d4a76a;
            --default-secondary: #2c3e50; --default-accent: #3498db;
            --default-bg: #f9f9f9; --default-card: #ffffff; --default-text: #333333; --default-border: #e0e0e0;
        }

        /* Definições Base das Variáveis de Tema (para cada classe de tema) */
        .light-theme { --theme-primary: #b87333; --theme-primary-dark: #8c5823; --theme-primary-light: #d4a76a; --theme-secondary: #2c3e50; --theme-accent: #3498db; --theme-bg: #f9f9f9; --theme-card: #ffffff; --theme-text: #333333; --theme-border: #e0e0e0; }
        .dark-theme { --theme-primary: #d4a76a; --theme-primary-dark: #b87333; --theme-primary-light: #e1bd8a; --theme-secondary: #34495e; --theme-accent: #5dade2; --theme-bg: #2c3e50; --theme-card: #34495e; --theme-text: #ecf0f1; --theme-border: #4a6278; }
        .copper-theme { --theme-primary: #b87333; --theme-primary-dark: #8c5823; --theme-primary-light: #d4a76a; --theme-secondary: #5d4037; --theme-accent: #8d6e63; --theme-bg: #efebe9; --theme-card: #ffffff; --theme-text: #5d4037; --theme-border: #d7ccc8; }
        .oxidized-theme { --theme-primary: #00796b; --theme-primary-dark: #004d40; --theme-primary-light: #4db6ac; --theme-secondary: #a1887f; --theme-accent: #b87333; --theme-bg: #e0f2f1; --theme-card: #ffffff; --theme-text: #37474f; --theme-border: #b2dfdb; }
        /* Classe .custom-theme não define vars aqui, são setadas inline pelo JS */

        /* Aplica as variáveis ao Body (e globalmente) */
        body {
            /* Usa a variável customizada SE existir, senão a do tema, senão a default */
            --primary-color: var(--custom-primary, var(--theme-primary, var(--default-primary)));
            --primary-dark: var(--custom-primary-dark, var(--theme-primary-dark, var(--default-primary-dark)));
            --primary-light: var(--custom-primary-light, var(--theme-primary-light, var(--default-primary-light)));
            --secondary-color: var(--custom-secondary, var(--theme-secondary, var(--default-secondary)));
            --accent-color: var(--custom-accent, var(--theme-accent, var(--default-accent)));
            --background-color: var(--custom-bg, var(--theme-bg, var(--default-bg)));
            --card-color: var(--custom-card, var(--theme-card, var(--default-card)));
            --text-color: var(--custom-text, var(--theme-text, var(--default-text)));
            --border-color: var(--custom-border, var(--theme-border, var(--default-border)));
            /* ... outras vars que dependem do tema ... */

            background-color: var(--background-color);
            color: var(--text-color);
            transition: background-color 0.3s ease, color 0.3s ease; /* Suaviza transição de tema */
        }

        /* --- ESTILOS DAS PREVIEWS DE TEMA (CORRIGIDO) --- */
        .theme-preview {
            /* Estilos base da caixa de preview */
            width: 100px;
            height: 60px;
            border-radius: 8px;
            margin: 0 auto 10px auto;
            position: relative; /* Necessário para pseudo-elementos */
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow: hidden; /* Garante que os cantos arredondados funcionem */

            /* Aplica cores USANDO AS VARIÁVEIS DE TEMA PADRÃO */
            /* A classe específica (.light-theme, .dark-theme) no elemento */
            /* garantirá que as variáveis corretas sejam usadas AQUI */
            background-color: var(--theme-bg, var(--default-bg));
            border: 1px solid var(--theme-border, var(--default-border));
        }

        /* Pseudo-elemento para simular o cabeçalho */
        .theme-preview::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 15px; /* Altura do cabeçalho simulado */
            /* Usa a cor secundária do tema específico da preview */
            background-color: var(--theme-secondary, var(--default-secondary));
            border-bottom: 1px solid var(--theme-border, var(--default-border));
        }

        /* Pseudo-elemento para simular um bloco de destaque */
        .theme-preview::after {
            content: '';
            position: absolute;
            top: 25px; /* Posição abaixo do cabeçalho */
            left: 10px;
            width: 30px; /* Tamanho do bloco */
            height: 20px;
            border-radius: 4px;
            /* Usa a cor primária do tema específico da preview */
            background-color: var(--theme-primary, var(--default-primary));
        }
        /* Fim dos estilos das previews */
    `;
    document.head.appendChild(styleElement);
}

// Funções utilitárias de cor (mantidas como antes)
function lightenDarkenColor(col, amt) { let usePound=false; if(col[0]==="#"){col=col.slice(1);usePound=true;} const num=parseInt(col,16); let r=(num>>16)+amt; if(r>255)r=255; else if(r<0)r=0; let b=((num>>8)&0x00FF)+amt; if(b>255)b=255; else if(b<0)b=0; let g=(num&0x0000FF)+amt; if(g>255)g=255; else if(g<0)g=0; return (usePound?"#":"")+String("000000"+(r<<16|b<<8|g).toString(16)).slice(-6); }
function getLuminance(hex) { hex=hex.replace("#",""); let r=parseInt(hex.substring(0,2),16)/255; let g=parseInt(hex.substring(2,4),16)/255; let b=parseInt(hex.substring(4,6),16)/255; r=r<=0.03928?r/12.92:Math.pow((r+0.055)/1.055,2.4); g=g<=0.03928?g/12.92:Math.pow((g+0.055)/1.055,2.4); b=b<=0.03928?b/12.92:Math.pow((b+0.055)/1.055,2.4); return 0.2126*r+0.7152*g+0.0722*b; }