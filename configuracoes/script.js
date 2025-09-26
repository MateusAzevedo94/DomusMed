/**
 * ============================
 * SCRIPT PRINCIPAL DO MODELO DE RESUMOS MÉDICOS
 * ============================
 * 
 * Este script contém toda a lógica necessária para:
 * - Cache bust automático de imagens
 * - Modal de imagens do corpo do texto
 * - Carregamento dinâmico de modais e rodapé
 * - Geração automática do sumário
 * - Controle da sidebar retrátil
 * - Barra de progresso de leitura
 * - Responsividade e acessibilidade
 */

// ============================
// CONFIGURAÇÕES GLOBAIS
// ============================

const CONFIG = {
  WPM: 150, // Palavras por minuto para cálculo de tempo de leitura
  MOBILE_BREAKPOINT: 768, // Breakpoint para dispositivos móveis
  SCROLL_THROTTLE: 16, // Throttle para eventos de scroll (60fps)
  SIDEBAR_ANIMATION_DURATION: 300 // Duração da animação da sidebar em ms
};

// ============================
// VARIÁVEIS GLOBAIS
// ============================

let sidebarOpen = false;
let currentImageModal = null;

// ============================
// UTILITÁRIOS
// ============================

/**
 * Função para throttle de eventos
 */
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Verifica se é dispositivo móvel
 */
function isMobile() {
  return window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
}

/**
 * Adiciona classe com animação fade-in
 */
function addFadeInClass(element) {
  if (element) {
    element.classList.add('fade-in');
  }
}

// ============================
// CACHE BUST DE IMAGENS
// ============================

/**
 * Aplica cache bust automático a todas as imagens
 * Adiciona timestamp para forçar recarregamento
 */
function applyCacheBustToImages() {
  console.log('Aplicando cache bust às imagens...');
  
  const timestamp = new Date().getTime();
  
  // Cache bust para imagem de capa
  const capaImg = document.getElementById('capa');
  if (capaImg && capaImg.src) {
    const originalSrc = capaImg.src.split('?')[0]; // Remove query params existentes
    capaImg.src = `${originalSrc}?t=${timestamp}`;
    console.log('Cache bust aplicado à capa:', capaImg.src);
  }
  
  // Cache bust para imagens do corpo do texto
  const estudoImgs = document.querySelectorAll('.estudo-img');
  estudoImgs.forEach((img, index) => {
    if (img.src) {
      const originalSrc = img.src.split('?')[0]; // Remove query params existentes
      img.src = `${originalSrc}?t=${timestamp}&i=${index}`;
      console.log(`Cache bust aplicado à imagem ${index + 1}:`, img.src);
    }
  });
}

// ============================
// MODAL DE IMAGENS
// ============================

/**
 * Cria e exibe modal para imagem em tela cheia
 */
function createImageModal(imgSrc, imgAlt) {
  // Remove modal existente se houver
  if (currentImageModal) {
    currentImageModal.remove();
    currentImageModal = null;
  }
  
  // Cria novo modal
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.innerHTML = `<img src="${imgSrc}" alt="${imgAlt}">`;
  
  // Adiciona evento para fechar ao clicar
  modal.addEventListener('click', closeImageModal);
  
  // Adiciona ao DOM e exibe
  document.body.appendChild(modal);
  modal.style.display = 'block';
  
  // Previne scroll do body
  document.body.style.overflow = 'hidden';
  
  currentImageModal = modal;
  
  console.log('Modal de imagem criado para:', imgAlt);
}

/**
 * Fecha o modal de imagem
 */
function closeImageModal() {
  if (currentImageModal) {
    currentImageModal.style.display = 'none';
    currentImageModal.remove();
    currentImageModal = null;
    
    // Restaura scroll do body
    document.body.style.overflow = '';
    
    console.log('Modal de imagem fechado');
  }
}

/**
 * Adiciona eventos de clique às imagens do corpo do texto
 */
function setupImageClickEvents() {
  const estudoImgs = document.querySelectorAll('.estudo-img');
  
  estudoImgs.forEach((img, index) => {
    img.addEventListener('click', function() {
      createImageModal(this.src, this.alt || `Imagem ${index + 1}`);
    });
    
    // Adiciona cursor pointer via JavaScript para garantir
    img.style.cursor = 'pointer';
    
    console.log(`Evento de clique adicionado à imagem ${index + 1}`);
  });
}

// ============================
// GERAÇÃO AUTOMÁTICA DO SUMÁRIO
// ============================

/**
 * Gera automaticamente o sumário baseado nos títulos da página
 */
function generateTableOfContents() {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  if (headings.length === 0) {
    console.log('Nenhum título encontrado para gerar sumário');
    return;
  }
  
  let tocHTML = '<ul>';
  
  headings.forEach((heading, index) => {
    // Cria ID único se não existir
    if (!heading.id) {
      heading.id = `heading-${index}`;
    }
    
    const level = parseInt(heading.tagName.charAt(1));
    const text = heading.textContent.trim();
    
    // Adiciona indentação baseada no nível do título
    const indent = '  '.repeat(level - 1);
    
    tocHTML += `${indent}<li><a href="#${heading.id}">${text}</a></li>`;
  });
  
  tocHTML += '</ul>';
  
  // Cria sidebar se não existir
  let sidebar = document.getElementById('sidebar');
  if (!sidebar) {
    sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    document.body.appendChild(sidebar);
  }
  
  sidebar.innerHTML = tocHTML;
  
  console.log('Sumário gerado com', headings.length, 'títulos');
}

// ============================
// CONTROLE DA SIDEBAR
// ============================

/**
 * Cria botão de toggle da sidebar
 */
function createToggleButton() {
  let toggleBtn = document.getElementById('toggle-btn');
  
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-btn';
    toggleBtn.innerHTML = '<span class="icon">☰</span><span class="label">Sumário</span>';
    document.body.appendChild(toggleBtn);
  }
  
  toggleBtn.addEventListener('click', toggleSidebar);
  
  console.log('Botão de toggle criado');
}

/**
 * Alterna visibilidade da sidebar
 */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (!sidebar) return;
  
  sidebarOpen = !sidebarOpen;
  
  if (sidebarOpen) {
    sidebar.classList.add('active');
    
    // Cria overlay para mobile se não existir
    if (isMobile() && !overlay) {
      const newOverlay = document.createElement('div');
      newOverlay.id = 'sidebar-overlay';
      newOverlay.addEventListener('click', closeSidebar);
      document.body.appendChild(newOverlay);
      
      setTimeout(() => newOverlay.classList.add('active'), 10);
    } else if (overlay) {
      overlay.classList.add('active');
    }
    
    console.log('Sidebar aberta');
  } else {
    closeSidebar();
  }
}

/**
 * Fecha a sidebar
 */
function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (sidebar) {
    sidebar.classList.remove('active');
  }
  
  if (overlay) {
    overlay.classList.remove('active');
  }
  
  sidebarOpen = false;
  
  console.log('Sidebar fechada');
}

// ============================
// BARRA DE PROGRESSO DE LEITURA
// ============================

/**
 * Cria barra de progresso de leitura
 */
function createProgressBar() {
  let progressContainer = document.getElementById('progress-container');
  
  if (!progressContainer) {
    progressContainer = document.createElement('div');
    progressContainer.id = 'progress-container';
    progressContainer.innerHTML = `
      <div id="reading-time">Tempo estimado: calculando...</div>
      <div id="progress-bar">0%</div>
    `;
    document.body.appendChild(progressContainer);
  }
  
  // Calcula tempo de leitura
  calculateReadingTime();
  
  // Adiciona listener de scroll
  window.addEventListener('scroll', throttle(updateProgressBar, CONFIG.SCROLL_THROTTLE));
  
  console.log('Barra de progresso criada');
}

/**
 * Calcula tempo estimado de leitura
 */
function calculateReadingTime() {
  const textContent = document.body.textContent || document.body.innerText || '';
  const wordCount = textContent.trim().split(/\s+/).length;
  const readingTimeMinutes = Math.ceil(wordCount / CONFIG.WPM);
  
  const readingTimeElement = document.getElementById('reading-time');
  if (readingTimeElement) {
    readingTimeElement.textContent = `Tempo estimado: ${readingTimeMinutes} min`;
  }
  
  console.log(`Tempo de leitura calculado: ${readingTimeMinutes} minutos (${wordCount} palavras)`);
}

/**
 * Atualiza barra de progresso baseada no scroll
 */
function updateProgressBar() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = (scrollTop / scrollHeight) * 100;
  
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    const clampedPercent = Math.min(Math.max(scrollPercent, 0), 100);
    progressBar.style.width = `${clampedPercent}%`;
    progressBar.textContent = `${Math.round(clampedPercent)}%`;
    
    // Adiciona classe 'complete' quando chega a 100%
    if (clampedPercent >= 100) {
      progressBar.classList.add('complete');
    } else {
      progressBar.classList.remove('complete');
    }
  }
}

// ============================
// DETECÇÃO DINÂMICA DE CAMINHOS
// ============================

/**
 * Detecta o caminho base do projeto automaticamente
 */
function detectBasePath() {
  const currentPath = window.location.pathname;
  const pathParts = currentPath.split('/').filter(part => part !== '');
  
  if (pathParts.length > 0 && pathParts[pathParts.length - 1].includes('.html')) {
    pathParts.pop();
  }
  
  let relativePath = '';
  let levelsUp = 0;
  
  for (let i = pathParts.length - 1; i >= 0; i--) {
    if (pathParts[i] === 'configuracoes') {
      relativePath = './';
      break;
    } else {
      levelsUp++;
      relativePath += '../';
    }
  }
  
  if (relativePath === '') {
    relativePath = './configuracoes/';
  } else if (!relativePath.endsWith('configuracoes/')) {
    relativePath += 'configuracoes/';
  }
  
  console.log('Caminho base detectado:', relativePath);
  return relativePath;
}

/**
 * Tenta carregar um arquivo de múltiplos caminhos possíveis
 */
async function tryLoadFromPaths(filename, possiblePaths) {
  for (const path of possiblePaths) {
    try {
      const fullPath = path + filename;
      console.log(`Tentando carregar: ${fullPath}`);
      
      const response = await fetch(fullPath);
      if (response.ok) {
        console.log(`Sucesso ao carregar: ${fullPath}`);
        return await response.text();
      }
    } catch (error) {
      console.log(`Falha ao carregar de ${path}${filename}:`, error.message);
    }
  }
  
  throw new Error(`Não foi possível carregar ${filename} de nenhum caminho testado`);
}

// ============================
// CARREGAMENTO DINÂMICO DE MODAIS
// ============================

/**
 * Carrega dinamicamente o conteúdo do arquivo modals.html
 */
async function loadModals() {
  try {
    console.log('Carregando modais e rodapé...');
    
    const basePath = detectBasePath();
    
    const possiblePaths = [
      basePath,
      './configuracoes/',
      '../configuracoes/',
      '../../configuracoes/',
      '../../../configuracoes/',
      './modals.html',
      '../modals.html',
      '../../modals.html',
      '../../../modals.html'
    ];
    
    const uniquePaths = [...new Set(possiblePaths)];
    
    const modalsHTML = await tryLoadFromPaths('modals.html', uniquePaths);
    const modalsContainer = document.getElementById('modals-container');
    
    if (modalsContainer) {
      modalsContainer.innerHTML = modalsHTML;
      console.log('Modais e rodapé carregados com sucesso!');
      return true;
    } else {
      console.error('Container de modais não encontrado');
      return false;
    }
  } catch (error) {
    console.error('Erro ao carregar modais:', error);
    return false;
  }
}

// ============================
// EVENTOS DE TECLADO
// ============================

/**
 * Configura eventos de teclado para acessibilidade
 */
function setupKeyboardEvents() {
  document.addEventListener('keydown', function(event) {
    // ESC fecha modal de imagem
    if (event.key === 'Escape' && currentImageModal) {
      closeImageModal();
    }
    
    // ESC fecha sidebar
    if (event.key === 'Escape' && sidebarOpen) {
      closeSidebar();
    }
  });
  
  console.log('Eventos de teclado configurados');
}

// ============================
// RESPONSIVIDADE
// ============================

/**
 * Configura eventos de redimensionamento
 */
function setupResponsiveEvents() {
  window.addEventListener('resize', throttle(function() {
    // Fecha sidebar em desktop se estiver aberta
    if (!isMobile() && sidebarOpen) {
      closeSidebar();
    }
    
    // Recalcula progresso
    updateProgressBar();
  }, 100));
  
  console.log('Eventos de responsividade configurados');
}

// ============================
// INICIALIZAÇÃO
// ============================

/**
 * Inicializa todas as funcionalidades quando o DOM estiver carregado
 */
function initializeApp() {
  console.log('Inicializando aplicação...');
  
  // Aplica cache bust às imagens
  applyCacheBustToImages();
  
  // Configura modal de imagens
  setupImageClickEvents();
  
  // Gera sumário
  generateTableOfContents();
  
  // Cria elementos da interface
  createToggleButton();
  createProgressBar();
  
  // Configura eventos
  setupKeyboardEvents();
  setupResponsiveEvents();
  
  // Carrega modais externos (opcional)
  loadModals().catch(error => {
    console.log('Modais externos não carregados (opcional):', error.message);
  });
  
  console.log('Aplicação inicializada com sucesso!');
}

// ============================
// PONTO DE ENTRADA
// ============================

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

