/**
 * ============================
 * SCRIPT PRINCIPAL DO MODELO DE RESUMOS MÉDICOS
 * ============================
 * 
 * Este script contém toda a lógica necessária para:
 * - Carregamento dinâmico de modais e rodapé
 * - Criação dinâmica de elementos de interface
 * - Geração automática do sumário
 * - Controle da sidebar retrátil
 * - Barra de progresso de leitura
 * - Cache bust de imagens
 * - Modal para visualização de imagens do corpo do texto
 * - Responsividade e acessibilidade
 * - Assistente IA com seleção de texto e integração ChatGPT/OpenEvidence/Consensus/Perplexity
 * - Menu flutuante com sub-botões
 * - Modais de contato, edição e ferramentas
 * - Modo claro/escuro
 * - Ajuste de tamanho de fonte
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
// URLS DAS PLATAFORMAS DE IA
// ============================

const AI_PLATFORMS = {
  chatgpt: 'https://chat.openai.com/',
  openevidence: 'https://openevidence.com',
  consensus: 'https://consensus.app',
  perplexity: 'https://www.perplexity.ai'
};

// ============================
// PERGUNTAS PRÉ-FORMULADAS
// ============================

const PREDEFINED_QUESTIONS = [
  {
    short: "Explique este conteúdo de forma simples para uma criança de 10 anos",
    detailed: "Explique este conteúdo médico como se estivesse ensinando a uma criança de 10 anos, usando analogias simples, mantendo os conceitos corretos, de forma extremamente clara e didática. Foque na compreensão básica sem jargão técnico."
  },
  {
    short: "Resuma o conteúdo em um parágrafo para revisão rápida (nível doutorado)",
    detailed: "Explique este conteúdo médico em um único parágrafo como resumo de aula de doutorado. Inclua pontos essenciais de fisiopatologia, epidemiologia, manifestações clínicas, diagnóstico diferencial, exames relevantes, tratamento ou prognóstico. Ressalte aspectos práticos e correlações anatômicas ou clínicas importantes."
  },
  {
    short: "Explique o conteúdo completo detalhado (nível doutorado)",
    detailed: "Explique este conteúdo médico detalhadamente, como em uma aula de doutorado. Inclua fisiopatologia, epidemiologia, manifestações clínicas, diagnóstico diferencial, exames laboratoriais e de imagem, tratamento, prognóstico e condutas práticas. Faça correlações anatômicas, fisiológicas ou clínicas quando relevante, priorizando informações práticas e objetivas."
  },
  {
    short: "Crie um caso clínico educativo baseado em evidências",
    detailed: "Com base nas evidências disponíveis, crie um caso clínico educativo, incluindo história clínica, exame físico, achados laboratoriais e exames de imagem. Destaque pontos de decisão clínica, diagnóstico diferencial e manejo, visando aprendizado prático para residência médica."
  },
  {
    short: "Faça um resumo objetivo do conteúdo para estudo prático",
    detailed: "Faça um resumo conciso do conteúdo médico, destacando sinais e sintomas chave, condutas iniciais, exames relevantes ou conceitos importantes para tomada de decisão clínica rápida, conforme o contexto apresentado."
  },
  {
    short: "Mostre a aplicação prática clínica do conteúdo",
    detailed: "Explique como os conceitos deste conteúdo médico se aplicam à prática clínica, incluindo sinais, sintomas, exames laboratoriais e condutas iniciais. Foque em informações práticas e objetivas, sem se aprofundar em aspectos teóricos irrelevantes."
  },
  {
    short: "Gere uma pergunta de revisão sobre este conteúdo",
    detailed: "Gere uma pergunta de revisão sobre este conteúdo médico, incluindo múltipla escolha ou dissertativa curta, abordando fisiopatologia, diagnóstico, manejo clínico ou condutas urgentes. Foque em pontos práticos aplicáveis na residência médica."
  },
  {
    short: "Quais protocolos clínicos se aplicam a este conteúdo?",
    detailed: "Liste e explique os protocolos clínicos, guidelines ou condutas baseadas em evidência para este conteúdo médico. Enfatize condutas práticas, urgentes ou de rotina, e pontos críticos para tomada de decisão na clínica do paciente."
  },
  {
    short: "Quais são as evidências de tratamento mais recentes?",
    detailed: "Liste e explique as evidências científicas mais recentes relacionadas ao tratamento desta condição. Inclua comparações de condutas terapêuticas, eficácia, riscos, efeitos adversos e recomendações práticas baseadas em guidelines reconhecidas."
  },
  {
    short: "Como diagnosticar esta condição com base em evidências?",
    detailed: "Quais são os principais achados clínicos, laboratoriais e de imagem indicados pelas evidências para o diagnóstico desta condição? Destaque exames de maior sensibilidade e especificidade, critérios diagnósticos aceitos e recomendações práticas."
  },
  {
    short: "Explique a fisiopatologia desta condição",
    detailed: "Explique a fisiopatologia desta condição com base nas evidências disponíveis, incluindo mecanismos moleculares, alterações anatômicas e correlações clínicas relevantes, de forma objetiva e prática para aplicação em estudos clínicos ou residência médica."
  },
  {
    short: "Crie um flashcard cloze deletion deste conceito",
    detailed: "Com base no texto fornecido, crie um flashcard em formato de frase única afirmativa, no estilo cloze deletion, utilizando a formatação {{c1::termo}}. Oclua apenas o termo chave mais importante do conceito ou definição central do conteúdo, garantindo objetividade e foco prático, adequado para aprendizado médico e revisão rápida."
  }
];

// ============================
// VARIÁVEIS GLOBAIS DO ASSISTENTE IA
// ============================

let selectedText = '';
let currentPlatform = 'chatgpt';

// ============================
// NOVAS VARIÁVEIS GLOBAIS
// ============================

let isFloatingMenuOpen = false;
let currentFontSize = 20;
let isDarkMode = false;

// ============================
// CACHE BUST AUTOMÁTICO DE IMAGENS
// ============================

/**
 * Aplica cache bust automático em todas as imagens
 * Garante que sempre seja carregada a versão mais recente
 */
function applyCacheBustToAllImages() {
  console.log('Aplicando cache bust automático em todas as imagens...');
  
  const allImages = document.querySelectorAll('img');
  const timestamp = new Date().getTime();
  
  allImages.forEach((img, index) => {
    if (img.src && !img.src.includes('?t=')) {
      const separator = img.src.includes('?') ? '&' : '?';
      img.src = img.src + separator + 't=' + timestamp;
      console.log(`Cache bust aplicado à imagem ${index + 1}:`, img.src);
    }
  });
  
  console.log(`Cache bust aplicado em ${allImages.length} imagens`);
}

// ============================
// MODAL PARA VISUALIZAÇÃO DE IMAGENS
// ============================

/**
 * Cria o modal para visualização de imagens em tela cheia
 */
function createImageModal() {
  // Verifica se já existe
  if (document.getElementById('image-modal-overlay')) {
    return;
  }
  
  console.log('Criando modal para visualização de imagens...');
  
  // Cria overlay
  const overlay = document.createElement('div');
  overlay.id = 'image-modal-overlay';
  overlay.className = 'image-modal-overlay';
  overlay.setAttribute('aria-label', 'Modal de visualização de imagem');
  
  // Cria modal
  const modal = document.createElement('div');
  modal.id = 'image-modal';
  modal.className = 'image-modal';
  
  // Cria imagem do modal
  const modalImg = document.createElement('img');
  modalImg.id = 'modal-image';
  modalImg.alt = 'Imagem em tela cheia';
  
  modal.appendChild(modalImg);
  document.body.appendChild(overlay);
  document.body.appendChild(modal);
  
  // Event listeners para fechar modal
  overlay.addEventListener('click', closeImageModal);
  modal.addEventListener('click', closeImageModal);
  
  // ESC para fechar modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeImageModal();
    }
  });
  
  console.log('Modal de imagem criado com sucesso');
}

/**
 * Abre o modal de visualização de imagem
 */
function openImageModal(imageSrc, imageAlt) {
  const overlay = document.getElementById('image-modal-overlay');
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-image');
  
  if (!overlay || !modal || !modalImg) {
    console.error('Elementos do modal de imagem não encontrados');
    return;
  }
  
  // Aplica cache bust na imagem do modal também
  const timestamp = new Date().getTime();
  const separator = imageSrc.includes('?') ? '&' : '?';
  const cacheBustedSrc = imageSrc + separator + 't=' + timestamp;
  
  modalImg.src = cacheBustedSrc;
  modalImg.alt = imageAlt || 'Imagem em tela cheia';
  
  // Mostra modal
  overlay.style.display = 'block';
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  setTimeout(() => {
    overlay.classList.add('active');
    modal.classList.add('active');
  }, 10);
  
  console.log('Modal de imagem aberto:', cacheBustedSrc);
}

/**
 * Fecha o modal de visualização de imagem
 */
function closeImageModal() {
  const overlay = document.getElementById('image-modal-overlay');
  const modal = document.getElementById('image-modal');
  
  if (!overlay || !modal) return;
  
  overlay.classList.remove('active');
  modal.classList.remove('active');
  
  setTimeout(() => {
    overlay.style.display = 'none';
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }, 300);
  
  console.log('Modal de imagem fechado');
}

/**
 * Configura event listeners para imagens do corpo do texto
 * CORRIGIDO: Apenas imagens com classe .estudo-img ativam o modal
 */
function setupImageModalListeners() {
  console.log('Configurando event listeners para imagens do corpo do texto...');
  
  // Seleciona APENAS imagens com classe .estudo-img (não a capa)
  const estudoImages = document.querySelectorAll('.estudo-img');
  
  estudoImages.forEach((img, index) => {
    img.addEventListener('click', () => {
      openImageModal(img.src, img.alt);
    });
    
    // Adiciona cursor pointer e título
    img.style.cursor = 'pointer';
    img.title = 'Clique para visualizar em tela cheia';
    
    console.log(`Event listener adicionado à imagem ${index + 1}`);
  });
  
  console.log(`Event listeners configurados para ${estudoImages.length} imagens do corpo do texto`);
}

// ============================
// DETECÇÃO DINÂMICA DE CAMINHOS
// ============================

/**
 * Detecta o caminho base do projeto automaticamente
 * Funciona tanto localmente quanto no GitHub Pages
 */
function detectBasePath() {
  const currentPath = window.location.pathname;
  
  // Se estamos no GitHub Pages, o caminho pode incluir o nome do repositório
  // Ex: /nome-repositorio/resumo/especialidades/cardiologia/arquivo.html
  
  // Procura pela pasta 'configuracoes' subindo na hierarquia
  const pathParts = currentPath.split('/').filter(part => part !== '');
  
  // Remove o arquivo HTML do final se existir
  if (pathParts.length > 0 && pathParts[pathParts.length - 1].includes('.html')) {
    pathParts.pop();
  }
  
  // Constrói o caminho relativo para a pasta configuracoes
  let relativePath = '';
  let levelsUp = 0;
  
  // Conta quantos níveis precisamos subir para chegar à raiz do projeto
  for (let i = pathParts.length - 1; i >= 0; i--) {
    if (pathParts[i] === 'configuracoes') {
      // Se já estamos na pasta configuracoes
      relativePath = './';
      break;
    } else {
      levelsUp++;
      relativePath += '../';
    }
  }
  
  // Se não encontrou a pasta configuracoes na hierarquia,
  // assume que está na raiz ou usa caminho relativo padrão
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
 * Funciona com qualquer estrutura de pastas
 */
async function loadModals() {
  try {
    console.log('Carregando modais e rodapé...');
    
    // Detecta o caminho base automaticamente
    const basePath = detectBasePath();
    
    // Lista de caminhos possíveis para tentar
    const possiblePaths = [
      basePath,                    // Caminho detectado automaticamente
      './configuracoes/',          // Relativo à pasta atual
      '../configuracoes/',         // Um nível acima
      '../../configuracoes/',      // Dois níveis acima
      '../../../configuracoes/',   // Três níveis acima
      './modals.html',             // Na mesma pasta (fallback)
      '../modals.html',            // Um nível acima (fallback)
      '../../modals.html',         // Dois níveis acima (fallback)
      '../../../modals.html'       // Três níveis acima (fallback)
    ];
    
    // Remove duplicatas mantendo a ordem
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
// FUNCIONALIDADES DO ASSISTENTE IA
// ============================

/**
 * Copia texto para a área de transferência
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Texto copiado para a área de transferência');
    return true;
  } catch (err) {
    console.error('Erro ao copiar texto:', err);
    // Fallback para navegadores mais antigos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackErr) {
      console.error('Erro no fallback de cópia:', fallbackErr);
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * Abre uma plataforma de IA em nova aba com a pergunta e texto selecionado
 */
function openAIPlatform(platform, question) {
  const fullPrompt = selectedText ? `${question}\n\nTexto selecionado:\n${selectedText}` : question;
  copyToClipboard(fullPrompt);
  
  const url = AI_PLATFORMS[platform];
  if (url) {
    window.open(url, '_blank');
    showNotification(`Pergunta copiada! Cole no ${getPlatformDisplayName(platform)}.`);
  } else {
    console.error('Plataforma não encontrada:', platform);
  }
}

/**
 * Retorna o nome de exibição da plataforma
 */
function getPlatformDisplayName(platform) {
  const names = {
    chatgpt: 'ChatGPT',
    openevidence: 'OpenEvidence',
    consensus: 'Consensus',
    perplexity: 'Perplexity'
  };
  return names[platform] || platform;
}

/**
 * Mostra notificação temporária
 */
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

/**
 * Captura seleção de texto
 */
function captureTextSelection() {
  const selection = window.getSelection();
  selectedText = selection.toString().trim();
  console.log('Texto selecionado capturado:', selectedText);
}

/**
 * Configura event listeners para seleção de texto
 */
function setupTextSelectionListeners() {
  document.addEventListener('mouseup', captureTextSelection);
  document.addEventListener('keyup', captureTextSelection);
  console.log('Event listeners de seleção de texto configurados');
}

// ============================
// GERAÇÃO AUTOMÁTICA DO SUMÁRIO
// ============================

/**
 * Gera automaticamente o sumário baseado nos títulos da página
 */
function generateTableOfContents() {
  console.log('Gerando sumário automaticamente...');
  
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const sidebar = document.getElementById('sidebar');
  
  if (!sidebar || headings.length === 0) {
    console.log('Sidebar não encontrada ou nenhum título encontrado');
    return;
  }
  
  // Cria lista do sumário
  const tocList = document.createElement('ul');
  
  headings.forEach((heading, index) => {
    // Cria ID único se não existir
    if (!heading.id) {
      heading.id = `heading-${index}`;
    }
    
    // Cria item da lista
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    link.style.paddingLeft = `${(parseInt(heading.tagName.charAt(1)) - 1) * 15}px`;
    
    // Smooth scroll
    link.addEventListener('click', (e) => {
      e.preventDefault();
      heading.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    });
    
    listItem.appendChild(link);
    tocList.appendChild(listItem);
  });
  
  // Limpa conteúdo anterior e adiciona novo sumário
  sidebar.innerHTML = '';
  sidebar.appendChild(tocList);
  
  console.log(`Sumário gerado com ${headings.length} itens`);
}

// ============================
// CONTROLE DA SIDEBAR
// ============================

/**
 * Cria o botão de toggle da sidebar
 */
function createToggleButton() {
  console.log('Criando botão de toggle da sidebar...');
  
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'toggle-btn';
  toggleBtn.setAttribute('aria-label', 'Abrir/fechar sumário');
  
  const icon = document.createElement('span');
  icon.className = 'icon';
  icon.textContent = '☰';
  
  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = 'Sumário';
  
  toggleBtn.appendChild(icon);
  toggleBtn.appendChild(label);
  
  // Event listener
  toggleBtn.addEventListener('click', toggleSidebar);
  
  document.body.appendChild(toggleBtn);
  console.log('Botão de toggle criado');
}

/**
 * Alterna visibilidade da sidebar
 */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const body = document.body;
  
  if (!sidebar) return;
  
  const isActive = sidebar.classList.contains('active');
  
  if (isActive) {
    sidebar.classList.remove('active');
    body.style.marginLeft = '';
    console.log('Sidebar fechada');
  } else {
    sidebar.classList.add('active');
    if (!isMobile()) {
      body.style.marginLeft = '320px';
    }
    console.log('Sidebar aberta');
  }
}

/**
 * Cria a sidebar
 */
function createSidebar() {
  console.log('Criando sidebar...');
  
  const sidebar = document.createElement('div');
  sidebar.id = 'sidebar';
  sidebar.setAttribute('aria-label', 'Sumário da página');
  
  document.body.appendChild(sidebar);
  console.log('Sidebar criada');
}

// ============================
// BARRA DE PROGRESSO DE LEITURA
// ============================

/**
 * Calcula tempo estimado de leitura
 */
function calculateReadingTime() {
  const textContent = document.body.innerText || document.body.textContent || '';
  const words = textContent.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / CONFIG.WPM);
  return minutes;
}

/**
 * Cria a barra de progresso de leitura
 */
function createProgressBar() {
  console.log('Criando barra de progresso de leitura...');
  
  const progressContainer = document.createElement('div');
  progressContainer.id = 'progress-container';
  
  const readingTime = document.createElement('div');
  readingTime.id = 'reading-time';
  const estimatedTime = calculateReadingTime();
  readingTime.textContent = `Tempo estimado: ${estimatedTime} min`;
  
  const progressBar = document.createElement('div');
  progressBar.id = 'progress-bar';
  progressBar.textContent = '0%';
  
  progressContainer.appendChild(readingTime);
  progressContainer.appendChild(progressBar);
  
  document.body.appendChild(progressContainer);
  
  console.log(`Barra de progresso criada. Tempo estimado: ${estimatedTime} minutos`);
}

/**
 * Atualiza a barra de progresso baseada no scroll
 */
function updateProgressBar() {
  const progressBar = document.getElementById('progress-bar');
  if (!progressBar) return;
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = Math.min(Math.round((scrollTop / scrollHeight) * 100), 100);
  
  progressBar.style.width = `${progress}%`;
  progressBar.textContent = `${progress}%`;
  
  // Marca como completo quando chega a 100%
  if (progress >= 100) {
    progressBar.classList.add('complete');
    progressBar.textContent = 'Concluído!';
  } else {
    progressBar.classList.remove('complete');
  }
}

/**
 * Configura event listeners para a barra de progresso
 */
function setupProgressBarListeners() {
  const throttledUpdate = throttle(updateProgressBar, CONFIG.SCROLL_THROTTLE);
  window.addEventListener('scroll', throttledUpdate);
  window.addEventListener('resize', throttledUpdate);
  console.log('Event listeners da barra de progresso configurados');
}

// ============================
// MENU FLUTUANTE PRINCIPAL
// ============================

/**
 * Cria o menu flutuante principal
 */
function createFloatingMenu() {
  console.log('Criando menu flutuante principal...');
  
  const floatingMenu = document.createElement('div');
  floatingMenu.id = 'floating-menu';
  
  // Botão principal
  const mainBtn = document.createElement('button');
  mainBtn.id = 'main-floating-btn';
  mainBtn.innerHTML = '✨';
  mainBtn.setAttribute('aria-label', 'Menu principal');
  
  // Container dos sub-botões
  const subButtons = document.createElement('div');
  subButtons.id = 'sub-buttons';
  
  // Sub-botões
  const buttons = [
    { id: 'ai-assistant-btn', icon: '🤖', label: 'Assistente IA' },
    { id: 'contact-btn', icon: '📧', label: 'Contato' },
    { id: 'edit-btn', icon: '✏️', label: 'Editar' },
    { id: 'tools-btn', icon: '🛠️', label: 'Ferramentas' }
  ];
  
  buttons.forEach(btnData => {
    const btn = document.createElement('button');
    btn.id = btnData.id;
    btn.className = 'sub-btn';
    btn.innerHTML = btnData.icon;
    btn.setAttribute('aria-label', btnData.label);
    subButtons.appendChild(btn);
  });
  
  floatingMenu.appendChild(subButtons);
  floatingMenu.appendChild(mainBtn);
  
  document.body.appendChild(floatingMenu);
  
  // Event listeners
  mainBtn.addEventListener('click', toggleFloatingMenu);
  
  console.log('Menu flutuante principal criado');
}

/**
 * Alterna o menu flutuante
 */
function toggleFloatingMenu() {
  const mainBtn = document.getElementById('main-floating-btn');
  const subButtons = document.getElementById('sub-buttons');
  
  if (!mainBtn || !subButtons) return;
  
  isFloatingMenuOpen = !isFloatingMenuOpen;
  
  if (isFloatingMenuOpen) {
    mainBtn.classList.add('active');
    subButtons.classList.add('active');
  } else {
    mainBtn.classList.remove('active');
    subButtons.classList.remove('active');
  }
  
  console.log('Menu flutuante:', isFloatingMenuOpen ? 'aberto' : 'fechado');
}

/**
 * Configura event listeners dos sub-botões
 */
function setupFloatingMenuListeners() {
  const aiBtn = document.getElementById('ai-assistant-btn');
  const contactBtn = document.getElementById('contact-btn');
  const editBtn = document.getElementById('edit-btn');
  const toolsBtn = document.getElementById('tools-btn');
  
  if (aiBtn) aiBtn.addEventListener('click', () => openModal('ai-modal'));
  if (contactBtn) contactBtn.addEventListener('click', () => openModal('contact-modal'));
  if (editBtn) editBtn.addEventListener('click', () => openModal('edit-modal'));
  if (toolsBtn) toolsBtn.addEventListener('click', () => openModal('tools-modal'));
  
  console.log('Event listeners dos sub-botões configurados');
}

// ============================
// SISTEMA DE MODAIS
// ============================

/**
 * Abre um modal específico
 */
function openModal(modalId) {
  const overlay = document.querySelector(`#${modalId} .modal-overlay`);
  const modal = document.querySelector(`#${modalId} .modal`);
  
  if (!overlay || !modal) {
    console.error(`Modal ${modalId} não encontrado`);
    return;
  }
  
  overlay.style.display = 'block';
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  setTimeout(() => {
    overlay.classList.add('active');
    modal.classList.add('active');
  }, 10);
  
  console.log(`Modal ${modalId} aberto`);
}

/**
 * Fecha um modal específico
 */
function closeModal(modalId) {
  const overlay = document.querySelector(`#${modalId} .modal-overlay`);
  const modal = document.querySelector(`#${modalId} .modal`);
  
  if (!overlay || !modal) return;
  
  overlay.classList.remove('active');
  modal.classList.remove('active');
  
  setTimeout(() => {
    overlay.style.display = 'none';
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }, 300);
  
  console.log(`Modal ${modalId} fechado`);
}

/**
 * Configura event listeners dos modais
 */
function setupModalListeners() {
  // Event listeners para fechar modais
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) {
      const modal = e.target.closest('[id$="-modal"]');
      if (modal) {
        closeModal(modal.id);
      }
    }
  });
  
  // ESC para fechar modais
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal.active');
      if (activeModal) {
        const modalContainer = activeModal.closest('[id$="-modal"]');
        if (modalContainer) {
          closeModal(modalContainer.id);
        }
      }
    }
  });
  
  console.log('Event listeners dos modais configurados');
}

// ============================
// ASSISTENTE IA - FUNCIONALIDADES ESPECÍFICAS
// ============================

/**
 * Configura o modal do assistente IA
 */
function setupAIAssistant() {
  // Atualiza informações de seleção
  const updateSelectionInfo = () => {
    const selectionInfo = document.querySelector('#ai-modal .selection-info');
    const selectedTextDiv = document.querySelector('#ai-modal .selected-text');
    
    if (selectionInfo && selectedTextDiv) {
      if (selectedText) {
        selectionInfo.style.display = 'block';
        selectedTextDiv.textContent = selectedText;
      } else {
        selectionInfo.style.display = 'none';
      }
    }
  };
  
  // Event listeners para seleção de plataforma
  const platformButtons = document.querySelectorAll('#ai-modal .platform-btn');
  platformButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      platformButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPlatform = btn.dataset.platform;
      console.log('Plataforma selecionada:', currentPlatform);
    });
  });
  
  // Event listeners para perguntas pré-formuladas
  const questionButtons = document.querySelectorAll('#ai-modal .question-btn');
  questionButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const question = PREDEFINED_QUESTIONS[index].detailed;
      openAIPlatform(currentPlatform, question);
      closeModal('ai-modal');
    });
  });
  
  // Event listener para pergunta customizada
  const customQuestionBtn = document.querySelector('#ai-modal .btn-primary');
  if (customQuestionBtn) {
    customQuestionBtn.addEventListener('click', () => {
      const customTextarea = document.querySelector('#ai-modal .custom-question textarea');
      if (customTextarea && customTextarea.value.trim()) {
        openAIPlatform(currentPlatform, customTextarea.value.trim());
        closeModal('ai-modal');
      }
    });
  }
  
  // Atualiza informações quando o modal abre
  const aiBtn = document.getElementById('ai-assistant-btn');
  if (aiBtn) {
    aiBtn.addEventListener('click', updateSelectionInfo);
  }
  
  console.log('Assistente IA configurado');
}

// ============================
// FERRAMENTAS - MODO ESCURO E FONTE
// ============================

/**
 * Alterna modo escuro
 */
function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  
  // Salva preferência
  localStorage.setItem('darkMode', isDarkMode);
  
  showNotification(`Modo ${isDarkMode ? 'escuro' : 'claro'} ativado`);
  console.log('Modo escuro:', isDarkMode ? 'ativado' : 'desativado');
}

/**
 * Ajusta tamanho da fonte
 */
function adjustFontSize(change) {
  currentFontSize += change;
  currentFontSize = Math.max(14, Math.min(28, currentFontSize)); // Limita entre 14px e 28px
  
  document.body.style.fontSize = `${currentFontSize}px`;
  
  // Salva preferência
  localStorage.setItem('fontSize', currentFontSize);
  
  showNotification(`Tamanho da fonte: ${currentFontSize}px`);
  console.log('Tamanho da fonte ajustado para:', currentFontSize);
}

/**
 * Configura ferramentas
 */
function setupTools() {
  // Event listeners para ferramentas
  const darkModeBtn = document.querySelector('#tools-modal [data-tool="dark-mode"]');
  const fontIncreaseBtn = document.querySelector('#tools-modal [data-tool="font-increase"]');
  const fontDecreaseBtn = document.querySelector('#tools-modal [data-tool="font-decrease"]');
  
  if (darkModeBtn) darkModeBtn.addEventListener('click', toggleDarkMode);
  if (fontIncreaseBtn) fontIncreaseBtn.addEventListener('click', () => adjustFontSize(2));
  if (fontDecreaseBtn) fontDecreaseBtn.addEventListener('click', () => adjustFontSize(-2));
  
  // Carrega preferências salvas
  const savedDarkMode = localStorage.getItem('darkMode');
  const savedFontSize = localStorage.getItem('fontSize');
  
  if (savedDarkMode === 'true') {
    isDarkMode = true;
    document.body.classList.add('dark-mode');
  }
  
  if (savedFontSize) {
    currentFontSize = parseInt(savedFontSize);
    document.body.style.fontSize = `${currentFontSize}px`;
  }
  
  console.log('Ferramentas configuradas');
}

// ============================
// INICIALIZAÇÃO PRINCIPAL
// ============================

/**
 * Inicializa todas as funcionalidades quando o DOM estiver carregado
 */
async function initializeApp() {
  console.log('Inicializando aplicação...');
  
  try {
    // 1. Carrega modais e rodapé
    const modalsLoaded = await loadModals();
    
    // 2. Aplica cache bust nas imagens
    applyCacheBustToAllImages();
    
    // 3. Cria elementos da interface
    createSidebar();
    createToggleButton();
    createProgressBar();
    createImageModal();
    createFloatingMenu();
    
    // 4. Gera sumário
    generateTableOfContents();
    
    // 5. Configura event listeners
    setupProgressBarListeners();
    setupImageModalListeners();
    setupTextSelectionListeners();
    
    // 6. Configura funcionalidades avançadas se modais foram carregados
    if (modalsLoaded) {
      setupModalListeners();
      setupFloatingMenuListeners();
      setupAIAssistant();
      setupTools();
    }
    
    // 7. Atualização inicial da barra de progresso
    updateProgressBar();
    
    console.log('Aplicação inicializada com sucesso!');
    
  } catch (error) {
    console.error('Erro durante a inicialização:', error);
  }
}

// ============================
// EVENT LISTENERS PRINCIPAIS
// ============================

// Inicializa quando o DOM estiver carregado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM já carregado
  initializeApp();
}

// Fecha menu flutuante ao clicar fora
document.addEventListener('click', (e) => {
  const floatingMenu = document.getElementById('floating-menu');
  if (floatingMenu && !floatingMenu.contains(e.target) && isFloatingMenuOpen) {
    toggleFloatingMenu();
  }
});

// Responsividade da sidebar
window.addEventListener('resize', () => {
  const sidebar = document.getElementById('sidebar');
  const body = document.body;
  
  if (sidebar && sidebar.classList.contains('active') && isMobile()) {
    body.style.marginLeft = '';
  } else if (sidebar && sidebar.classList.contains('active') && !isMobile()) {
    body.style.marginLeft = '320px';
  }
});

console.log('Script principal carregado e pronto para execução');
