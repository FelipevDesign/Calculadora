// menu.js - Cria e gerencia o menu principal de ações

function initializeMenu() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) { console.error("Elemento .header-actions não encontrado."); return; }
    if (headerActions.querySelector('.menu-button')) return; // Já inicializado

    const menuButton = document.createElement('button');
    menuButton.type = 'button'; menuButton.className = 'menu-button';
    menuButton.innerHTML = '<i class="fas fa-bars"></i>'; menuButton.title = 'Menu';
    headerActions.appendChild(menuButton);

    let menuDropdown = document.querySelector('.menu-dropdown');
    if (!menuDropdown) {
        menuDropdown = document.createElement('div');
        menuDropdown.className = 'menu-dropdown hidden'; // Começa escondido
        menuDropdown.innerHTML = `
            <ul class="menu-list">
                <li class="menu-item" data-action="equipment"><i class="fas fa-tools fa-fw"></i> Gerenciar Equipamentos</li>
                <li class="menu-item" data-action="theme"><i class="fas fa-palette fa-fw"></i> Alterar Tema</li>
                <li class="menu-item" data-action="settings"><i class="fas fa-cog fa-fw"></i> Configurações</li>
                <li class="menu-item" data-action="help"><i class="fas fa-question-circle fa-fw"></i> Ajuda / Documentação</li>
            </ul>`;
        document.body.appendChild(menuDropdown);
    }

    menuButton.addEventListener('click', function(event) {
        event.stopPropagation();
        const isHidden = menuDropdown.classList.contains('hidden');
        closeOtherDropdowns(menuDropdown);

        if (isHidden) {
            // Passo 1: Torna o elemento parte do layout, mas invisível e fora da tela
            menuDropdown.style.position = 'absolute';
            menuDropdown.style.visibility = 'hidden';
            menuDropdown.style.opacity = '0';
            menuDropdown.style.display = 'block';
            menuDropdown.style.left = '-9999px';
            menuDropdown.style.top = '-9999px';
            menuDropdown.classList.remove('hidden'); // Remove hidden ANTES de pedir frame

            // Passo 2: Usa requestAnimationFrame para calcular e aplicar posição
            requestAnimationFrame(() => {
                // ---- CORREÇÃO APLICADA AQUI ----
                applyFinalPosition(menuButton, menuDropdown);
                // ---------------------------------
            });

        } else {
            menuDropdown.classList.add('hidden'); // Para fechar
        }
    });

    // Listener global para fechar o menu ao clicar fora
    document.addEventListener('click', function(event) {
        if (!menuDropdown.classList.contains('hidden')) {
            if (!menuButton.contains(event.target) && !menuDropdown.contains(event.target)) {
                menuDropdown.classList.add('hidden');
            }
        }
    });

    // Adiciona listeners às ações do menu (como antes)
    menuDropdown.querySelectorAll('.menu-item').forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        newItem.addEventListener('click', function() {
            handleMenuAction(this.dataset.action);
            menuDropdown.classList.add('hidden');
        });
    });
}

// Fecha outros dropdowns
function closeOtherDropdowns(currentDropdown) {
    document.querySelectorAll('.menu-dropdown').forEach(dropdown => {
        if (dropdown !== currentDropdown && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
        }
    });
}

// --- Função que calcula e RETORNA a posição ---
function calculateDropdownPosition(button, dropdown) {
    console.log("--- Calculando Posição ---");
    const buttonRect = button.getBoundingClientRect();
    const marginPx = 5;
    const edgeMarginPx = 10;

    // Medir - Espera-se que display: block já esteja ativo
    let dropdownHeight = dropdown.offsetHeight;
    let dropdownWidth = dropdown.offsetWidth;

    console.log("Medidas - Dropdown W:", dropdownWidth, "H:", dropdownHeight);
    if (dropdownWidth === 0 || dropdownHeight === 0) {
        console.error("!!! ERRO: Dimensões do Dropdown são zero. Não é possível calcular posição.");
        return null;
    }

    // Calcular Posição Ideal (Relativa à Página)
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    console.log("Scroll (X,Y):", scrollX, scrollY);
    console.log("Botão Rect (Viewport):", buttonRect);

    let targetTop = buttonRect.bottom + scrollY + marginPx;
    let targetLeft = buttonRect.right + scrollX - dropdownWidth;
    console.log("Posição Ideal Calculada (Top,Left):", targetTop, targetLeft);

    // Ajustar para Caber na Tela
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    console.log("Viewport (W,H):", viewportWidth, viewportHeight);

    // Ajuste Vertical
    const viewBottomEdge = viewportHeight + scrollY - edgeMarginPx;
    if (targetTop + dropdownHeight > viewBottomEdge) {
        const newTop = buttonRect.top + scrollY - dropdownHeight - marginPx;
        console.log(`Ajuste Vertical: Não cabe embaixo (${targetTop + dropdownHeight} > ${viewBottomEdge}). Tentando acima: ${newTop}`);
        targetTop = Math.max(newTop, scrollY + edgeMarginPx);
    }

    // Ajuste Horizontal
    const viewRightEdge = viewportWidth + scrollX - edgeMarginPx;
    if (targetLeft + dropdownWidth > viewRightEdge) {
         const newLeft = viewRightEdge - dropdownWidth;
         console.log(`Ajuste Horizontal: Saiu pela direita (${targetLeft + dropdownWidth} > ${viewRightEdge}). Ajustando para: ${newLeft}`);
        targetLeft = newLeft;
    }
    const viewLeftEdge = scrollX + edgeMarginPx;
    if (targetLeft < viewLeftEdge) {
         console.log(`Ajuste Horizontal: Saiu pela esquerda (${targetLeft} < ${viewLeftEdge}). Ajustando para: ${viewLeftEdge}`);
        targetLeft = viewLeftEdge;
    }

    const finalPosition = {
        top: Math.round(targetTop),
        left: Math.round(targetLeft)
    };
    console.log("Posição Calculada Final (Top,Left):", finalPosition);
    return finalPosition;
}

// --- Função que APLICA a posição calculada ---
function applyFinalPosition(button, dropdown) {
     const position = calculateDropdownPosition(button, dropdown);
     if (position) {
         dropdown.style.top = `${position.top}px`;
         dropdown.style.left = `${position.left}px`;
         dropdown.style.right = 'auto'; // Garante que left prevaleça

         // Limpa estilos temporários DEPOIS de aplicar a posição
         // Isso permite que as transições de opacity/transform do CSS funcionem
         dropdown.style.visibility = '';
         dropdown.style.opacity = '';
         dropdown.style.display = '';
         console.log(`Posição ${position.top}px, ${position.left}px aplicada e estilos de medição limpos.`);
     } else {
         // Falha no cálculo, apenas remove estilos de medição
         dropdown.style.visibility = '';
         dropdown.style.opacity = '';
         dropdown.style.display = '';
         dropdown.style.left = ''; // Limpa posições anteriores
         dropdown.style.top = '';
         console.warn("Não foi possível aplicar posição pois o cálculo falhou. Estilos de medição limpos.");
     }
}


// --- Handle Menu Action ---
function handleMenuAction(action) {
    console.log("Ação do menu:", action);
    switch (action) {
        case 'equipment':
            if (typeof showEquipmentManager === 'function') showEquipmentManager();
            else console.error('Função showEquipmentManager não definida');
            break;
        case 'theme':
            if (typeof showThemeSelector === 'function') showThemeSelector();
            else console.error('Função showThemeSelector não definida');
            break;
        case 'settings':
            if (typeof showSettingsManager === 'function') showSettingsManager();
            else console.error('Função showSettingsManager não definida');
            break;
        case 'help':
            const helpWindow = window.open('documentacao_uso.md', '_blank');
            if (!helpWindow || helpWindow.closed || typeof helpWindow.closed == 'undefined') {
                alert("Não foi possível abrir a documentação em nova aba. Verifique se seu navegador bloqueou o pop-up.");
            }
            break;
        default:
            console.warn(`Ação de menu desconhecida: ${action}`);
    }
}