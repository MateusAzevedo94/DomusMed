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
    short: "Resuma o conteúdo em um parágrafo para revisão rápida (nível doutorado )",
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
// VARIÁVEIS GLOBAIS
// ============================

let selectedText = '';
let currentPlatform = 'chatgpt';
let isFloatingMenuOpen = false;
let currentFontSize = 20;
let isDarkMode = false;

// ============================
// CACHE BUST AUTOMÁTICO DE IMAGENS
// ============================

function applyCacheBustToAllImages() {
  console.log('Aplicando cache bust automático em todas as imagens...');
  const allImages = document.querySelectorAll('img');
  const timestamp = new Date().getTime();
  allImages.forEach((img) => {
    if (img.src && !img.src.includes('?t=')) {
      const separator = img.src.includes('?') ? '&' : '?';
      img.src = img.src + separator + 't=' + timestamp;
    }
  });
  console.log(`Cache bust aplicado em ${allImages.length} imagens`);
}

// ============================
// MODAL PARA VISUALIZAÇÃO DE IMAGENS
// ============================

function createImageModal() {
  if (document.getElementById('image-modal-overlay')) return;
  console.log('Criando modal para visualização de imagens...');
  
  const overlay = document.createElement('div');
  overlay.id = 'image-modal-overlay';
  overlay.className = 'image-modal-overlay';
  overlay.setAttribute('aria-label', 'Modal de visualização de imagem');
  
  const modal = document.createElement('div');
  modal.id = 'image-modal';
  modal.className = 'image-modal';
  
  const modalImg = document.createElement('img');
  modalImg.id = 'modal-image';
  modalImg.alt = 'Imagem em tela cheia';
  
  modal.appendChild(modalImg);
  document.body.appendChild(overlay);
  document.body.appendChild(modal);
  
  overlay.addEventListener('click', closeImageModal);
  modal.addEventListener('click', closeImageModal);
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('image-modal-overlay')?.classList.contains('active')) {
      closeImageModal();
    }
  });
  console.log('Modal de imagem criado com sucesso');
}

function openImageModal(imageSrc, imageAlt) {
  const overlay = document.getElementById('image-modal-overlay');
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-image');
  
  if (!overlay || !modal || !modalImg) {
    console.error('Elementos do modal de imagem não encontrados');
    return;
  }
  
  const timestamp = new Date().getTime();
  const separator = imageSrc.includes('?') ? '&' : '?';
  const cacheBustedSrc = imageSrc.split('?')[0] + separator + 't=' + timestamp;
  
  modalImg.src = cacheBustedSrc;
  modalImg.alt = imageAlt || 'Imagem em tela cheia';
  
  overlay.style.display = 'block';
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  setTimeout(() => {
    overlay.classList.add('active');
    modal.classList.add('active');
  }, 10);
  console.log('Modal de imagem aberto:', cacheBustedSrc);
}

function closeImageModal() {
  const overlay = document.getElementById('image-modal-overlay');
  const modal = document.getElementById('image-modal');
  
  if (!overlay || !modal || !overlay.classList.contains('active')) return;
  
  overlay.classList.remove('active');
  modal.classList.remove('active');
  
  setTimeout(() => {
    overlay.style.display = 'none';
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }, 300);
  console.log('Modal de imagem fechado');
}

function setupImageModalListeners() {
  console.log('Configurando event listeners para imagens do corpo do texto...');
  const estudoImages = document.querySelectorAll('.estudo-img');
  
  estudoImages.forEach((img) => {
    // Previne múltiplos listeners clonando o nó
    const newImg = img.cloneNode(true);
    img.parentNode.replaceChild(newImg, img);

    newImg.addEventListener('click', () => {
      openImageModal(newImg.src, newImg.alt);
    });
    newImg.style.cursor = 'pointer';
    newImg.title = 'Clique para visualizar em tela cheia';
  });
  console.log(`Event listeners configurados para ${estudoImages.length} imagens do corpo do texto`);
}

// ============================
// DETECÇÃO DINÂMICA DE CAMINHOS E CARREGAMENTO
// ============================

function detectBasePath() {
  const currentPath = window.location.pathname;
  const pathParts = currentPath.split('/').filter(part => part !== '');
  if (pathParts.length > 0 && pathParts[pathParts.length - 1].includes('.html')) {
    pathParts.pop();
  }
  let relativePath = '';
  for (let i = pathParts.length - 1; i >= 0; i--) {
    if (pathParts[i] === 'configuracoes') {
      relativePath = './';
      break;
    } else {
      relativePath += '../';
    }
  }
  if (relativePath === '') {
    relativePath = './configuracoes/';
  } else if (!relativePath.endsWith('configuracoes/')) {
    relativePath += 'configuracoes/';
  }
  return relativePath;
}

async function tryLoadFromPaths(filename, possiblePaths) {
  for (const path of possiblePaths) {
    try {
      const fullPath = path + filename;
      const response = await fetch(fullPath);
      if (response.ok) {
        console.log(`Sucesso ao carregar: ${fullPath}`);
        return await response.text();
      }
    } catch (error) {
      // Silencioso, apenas tenta o próximo
    }
  }
  throw new Error(`Não foi possível carregar ${filename} de nenhum caminho testado`);
}

async function loadModals() {
  try {
    console.log('Carregando modais e rodapé...');
    const basePath = detectBasePath();
    const possiblePaths = [
      basePath, './configuracoes/', '../configuracoes/', '../../configuracoes/',
      '../../../configuracoes/', './modals.html', '../modals.html', '../../modals.html', '../../../modals.html'
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
// UTILITÁRIOS E FUNCIONALIDADES GERAIS
// ============================

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

function isMobile() {
  return window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
}

function addFadeInClass(element) {
  if (element) element.classList.add('fade-in');
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Texto copiado para a área de transferência');
    return true;
  } catch (err) {
    console.error('Erro ao copiar texto:', err);
    return false;
  }
}

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

function getPlatformDisplayName(platform) {
  const names = { chatgpt: 'ChatGPT', openevidence: 'OpenEvidence', consensus: 'Consensus', perplexity: 'Perplexity' };
  return names[platform] || platform;
}

function showNotification(message) {
  const existingNotification = document.querySelector('.ai-notification');
  if (existingNotification) existingNotification.remove();
  const notification = document.createElement('div');
  notification.className = 'ai-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    if (notification.parentNode) notification.remove();
  }, 3000);
}

function handleTextSelection() {
  const selection = window.getSelection();
  const text = selection.toString().trim();
  if (text.length > 0) {
    selectedText = text;
    updateSelectedTextDisplay();
    updateGitHubSelectedTextDisplay();
  }
}

// ... (O restante das suas funções originais permanecem aqui, inalteradas)
// Por exemplo: updateSelectedTextDisplay, switchPlatform, processQuestion, etc.
function updateSelectedTextDisplay() {
  const container = document.getElementById('selected-text-container');
  const textDiv = document.getElementById('selected-text');
  if (container && textDiv) {
    if (selectedText) {
      textDiv.textContent = selectedText;
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  }
}

function switchPlatform(platform) {
  currentPlatform = platform;
  const platformButtons = document.querySelectorAll('.platform-btn');
  platformButtons.forEach(btn => {
    const btnPlatform = btn.getAttribute('data-platform');
    btn.classList.toggle('active', btnPlatform === platform);
  });
}

function processQuestion(question) {
  openAIPlatform(currentPlatform, question);
}

function createPlatformButtons() {
  const container = document.querySelector('.platform-buttons');
  if (!container) return;
  container.innerHTML = '';
  const platforms = [
    { id: 'chatgpt', name: 'ChatGPT' }, { id: 'openevidence', name: 'OpenEvidence' },
    { id: 'consensus', name: 'Consensus' }, { id: 'perplexity', name: 'Perplexity' }
  ];
  platforms.forEach(platform => {
    const button = document.createElement('button');
    button.className = 'platform-btn';
    button.setAttribute('data-platform', platform.id);
    button.textContent = platform.name;
    button.addEventListener('click', () => switchPlatform(platform.id));
    container.appendChild(button);
  });
}

function createPredefinedQuestionButtons() {
  const container = document.getElementById('questions-container');
  if (!container) return;
  container.innerHTML = '';
  PREDEFINED_QUESTIONS.forEach((question) => {
    const button = document.createElement('button');
    button.className = 'question-btn';
    button.textContent = question.short;
    button.title = question.detailed;
    button.addEventListener('click', () => processQuestion(question.detailed));
    container.appendChild(button);
  });
}

function openAIModal() {
  const modal = document.getElementById('ai-modal');
  const overlay = document.getElementById('ai-modal-overlay');
  if (modal && overlay) {
    modal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    updateSelectedTextDisplay();
    setTimeout(() => {
      modal.classList.add('active');
      overlay.classList.add('active');
    }, 10);
  }
}

function closeAIModal() {
  const modal = document.getElementById('ai-modal');
  const overlay = document.getElementById('ai-modal-overlay');
  if (modal && overlay) {
    modal.classList.remove('active');
    overlay.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }, 300);
  }
}

function setupAIEventListeners() {
  const aiBtn = document.getElementById('ai-assistant-btn');
  if (aiBtn) aiBtn.addEventListener('click', openAIModal);
  const closeBtn = document.getElementById('ai-modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeAIModal);
  const overlay = document.getElementById('ai-modal-overlay');
  if (overlay) overlay.addEventListener('click', closeAIModal);
  const sendCustomBtn = document.getElementById('send-custom-btn');
  if (sendCustomBtn) {
    sendCustomBtn.addEventListener('click', () => {
      const customQuestion = document.getElementById('custom-question');
      if (customQuestion && customQuestion.value.trim()) {
        processQuestion(customQuestion.value.trim());
        customQuestion.value = '';
      }
    });
  }
  const customQuestion = document.getElementById('custom-question');
  if (customQuestion) {
    customQuestion.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('send-custom-btn')?.click();
      }
    });
  }
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keyup', handleTextSelection);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('ai-modal')?.classList.contains('active')) {
      closeAIModal();
    }
  });
}

// ... E TODAS AS OUTRAS FUNÇÕES (MENU FLUTUANTE, MODAIS, MODO ESCURO, ETC) ...
// ... Elas permanecem exatamente como você as escreveu ...
function toggleFloatingMenu() {
  const submenu = document.getElementById('floating-submenu');
  const mainBtn = document.getElementById('main-floating-btn');
  if (!submenu || !mainBtn) return;
  isFloatingMenuOpen = !isFloatingMenuOpen;
  if (isFloatingMenuOpen) {
    submenu.classList.add('active');
    mainBtn.style.transform = 'rotate(45deg)';
  } else {
    submenu.classList.remove('active');
    mainBtn.style.transform = 'rotate(0deg)';
  }
}

function closeFloatingMenu() {
  const submenu = document.getElementById('floating-submenu');
  const mainBtn = document.getElementById('main-floating-btn');
  if (!submenu || !mainBtn) return;
  isFloatingMenuOpen = false;
  submenu.classList.remove('active');
  mainBtn.style.transform = 'rotate(0deg)';
}

function setupFloatingMenuListeners() {
  const mainBtn = document.getElementById('main-floating-btn');
  if (mainBtn) mainBtn.addEventListener('click', toggleFloatingMenu);
  const aiSubmenuBtn = document.getElementById('ai-submenu-btn');
  if (aiSubmenuBtn) aiSubmenuBtn.addEventListener('click', () => { closeFloatingMenu(); openAIModal(); });
  const contactBtn = document.getElementById('contact-btn');
  if (contactBtn) contactBtn.addEventListener('click', () => { closeFloatingMenu(); openContactModal(); });
  const suggestEditBtn = document.getElementById('suggest-edit-btn');
  if (suggestEditBtn) suggestEditBtn.addEventListener('click', () => { closeFloatingMenu(); openEditModal(); });
  const githubBtn = document.getElementById('github-btn');
  if (githubBtn) githubBtn.addEventListener('click', () => { closeFloatingMenu(); openGitHubModal(); });
  const toolsBtn = document.getElementById('tools-btn');
  if (toolsBtn) toolsBtn.addEventListener('click', () => { closeFloatingMenu(); openToolsModal(); });
  const joinTeamBtn = document.getElementById('join-team-btn');
  if (joinTeamBtn) joinTeamBtn.addEventListener('click', () => { closeFloatingMenu(); openJoinTeamModal(); });
  document.addEventListener('click', (e) => {
    const floatingMenu = document.getElementById('floating-menu');
    if (floatingMenu && !floatingMenu.contains(e.target) && isFloatingMenuOpen) {
      closeFloatingMenu();
    }
  });
}

function openContactModal() { /* ... seu código ... */ }
function openEditModal() { /* ... seu código ... */ }
function openGitHubModal() { /* ... seu código ... */ }
function updateGitHubSelectedTextDisplay() { /* ... seu código ... */ }
function sendGitHubSuggestion() { /* ... seu código ... */ }
function openJoinTeamModal() { /* ... seu código ... */ }
function handleStatusChange() { /* ... seu código ... */ }
function sendJoinTeamForm() { /* ... seu código ... */ }
function clearJoinTeamForm() { /* ... seu código ... */ }
function openToolsModal() { /* ... seu código ... */ }
function closeAllModals() { /* ... seu código ... */ }
function openGitHubDiscussion() { /* ... seu código ... */ }
function sendContactEmail() { /* ... seu código ... */ }
function sendEditSuggestion() { /* ... seu código ... */ }
function setupModalListeners() { /* ... seu código ... */ }
function toggleDarkMode() { /* ... seu código ... */ }
function setLightMode() { /* ... seu código ... */ }
function setDarkMode() { /* ... seu código ... */ }
function updateThemeButtons() { /* ... seu código ... */ }
function loadThemePreference() { /* ... seu código ... */ }
function updateFontSize(size) { /* ... seu código ... */ }
function updateFontPresetButtons() { /* ... seu código ... */ }
function loadFontPreference() { /* ... seu código ... */ }
function setupToolsListeners() { /* ... seu código ... */ }

// ============================
// CRIAÇÃO DE INTERFACE E GERAÇÃO DE CONTEÚDO
// ============================

function createProgressBar() {
  if (document.getElementById('progress-container')) return;
  const progressContainer = document.createElement('div');
  progressContainer.id = 'progress-container';
  progressContainer.innerHTML = `<div id="reading-time">Calculando tempo...</div><div id="progress-bar">0%</div>`;
  document.body.appendChild(progressContainer);
  addFadeInClass(progressContainer);
}

function createToggleButton() {
  if (document.getElementById('toggle-btn')) return;
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'toggle-btn';
  toggleBtn.setAttribute('aria-label', 'Abrir/Fechar Sumário');
  toggleBtn.setAttribute('title', 'Sumário');
  toggleBtn.innerHTML = `<span class="icon">☰</span><span class="label">Sumário</span>`;
  document.body.appendChild(toggleBtn);
  addFadeInClass(toggleBtn);
}

function createSidebar() {
  if (document.getElementById('sidebar')) return;
  const sidebar = document.createElement('div');
  sidebar.id = 'sidebar';
  sidebar.setAttribute('aria-label', 'Sumário da página');
  sidebar.innerHTML = `<ul id="lista-sumario"></ul>`;
  document.body.appendChild(sidebar);
  createSidebarOverlay();
}

function createSidebarOverlay() {
  if (document.getElementById('sidebar-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'sidebar-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.appendChild(overlay);
  overlay.addEventListener('click', closeSidebar);
}

function generateSummary() {
  const headers = document.querySelectorAll('h1, h2, h3, h4');
  const lista = document.getElementById('lista-sumario');
  if (!lista) return;
  lista.innerHTML = '';
  headers.forEach((header, index) => {
    if (header.tagName === 'H1' && index === 0) return;
    if (!header.id) header.id = `titulo-${index}`;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${header.id}`;
    a.textContent = header.textContent.trim();
    a.setAttribute('title', `Ir para: ${header.textContent.trim()}`);
    const level = parseInt(header.tagName.charAt(1));
    if (level >= 1) li.style.marginLeft = `${(level - 1) * 20}px`;
    li.className = `summary-level-${level}`;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToElement(header);
      if (isMobile()) closeSidebar();
    });
    li.appendChild(a);
    lista.appendChild(li);
  });
}

function scrollToElement(element) {
  if (element) {
    const offsetTop = element.offsetTop - 80;
    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
  }
}

// ============================
// CONTROLE DA SIDEBAR E PROGRESSO
// ============================

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar?.classList.contains('active')) closeSidebar();
  else openSidebar();
}

function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.add('active');
  if (overlay && isMobile()) overlay.classList.add('active');
  if (isMobile()) document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function updateProgress() {
  const progressBar = document.getElementById('progress-bar');
  const readingTimeEl = document.getElementById('reading-time');
  if (!progressBar || !readingTimeEl) return;
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  const percent = Math.min(100, Math.round(progress));
  const containerWidth = document.getElementById('progress-container')?.offsetWidth || 0;
  const readingTimeWidth = readingTimeEl.offsetWidth || 0;
  const barWidth = (containerWidth - readingTimeWidth) * (percent / 100);
  progressBar.style.width = `${barWidth}px`;
  progressBar.textContent = `${percent}%`;
  if (percent === 100) progressBar.classList.add('complete');
  else progressBar.classList.remove('complete');
  updateReadingTime(percent, readingTimeEl);
}

function updateReadingTime(percent, readingTimeEl) {
  const bodyText = document.body.innerText || document.body.textContent || '';
  const words = bodyText.trim().split(/\s+/).length;
  const totalMinutes = words / CONFIG.WPM;
  const minutesLeft = Math.max(0, Math.ceil(totalMinutes * (1 - percent / 100)));
  const hours = Math.floor(minutesLeft / 60);
  const mins = minutesLeft % 60;
  let timeText = 'Tempo restante estimado: ⏳ ';
  if (percent === 100) timeText = 'Leitura concluída! ✅';
  else if (hours > 0) timeText += `${hours}h ${mins}m`;
  else timeText += `${mins}m`;
  readingTimeEl.textContent = timeText;
}

// ============================
// EVENTOS E INICIALIZAÇÃO
// ============================

function setupEventListeners() {
  const toggleBtn = document.getElementById('toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleSidebar);
    toggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSidebar();
      }
    });
  }
  const throttledUpdateProgress = throttle(updateProgress, CONFIG.SCROLL_THROTTLE);
  window.addEventListener('scroll', throttledUpdateProgress);
  window.addEventListener('resize', () => {
    updateProgress();
    if (!isMobile() && document.getElementById('sidebar-overlay')?.classList.contains('active')) {
      closeSidebar();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('sidebar')?.classList.contains('active')) {
      closeSidebar();
    }
  });
  console.log('Event listeners configurados');
}

async function initializeApp() {
  console.log('Inicializando aplicação...');
  try {
    // 1. Carrega recursos externos e aplica configurações iniciais
    const modalsLoaded = await loadModals();
    if (!modalsLoaded) console.warn('Modais não puderam ser carregados, continuando sem eles...');
    applyCacheBustToAllImages();

    // 2. Cria os elementos de interface que precisam existir no DOM
    createProgressBar();
    createToggleButton();
    createSidebar();
    createImageModal(); // <-- CORREÇÃO: Garantir que o modal seja criado antes de qualquer outra coisa.

    // 3. Gera conteúdo dinâmico que depende dos elementos acima
    generateSummary();

    // 4. Adiciona a interatividade (event listeners) aos elementos
    setupEventListeners();
    initializeAIAssistant();
    initializeNewFeatures();
    setupImageModalListeners(); // <-- CORREÇÃO: Chamar a configuração dos listeners DEPOIS que o modal e as imagens já existem.

    // 5. Executa uma atualização inicial
    updateProgress();

    console.log('Aplicação inicializada com sucesso!');
  } catch (error) {
    console.error('Erro durante a inicialização:', error);
  }
}

function initializeAIAssistant() {
  console.log('Inicializando assistente IA...');
  try {
    createPlatformButtons();
    createPredefinedQuestionButtons();
    setupAIEventListeners();
    switchPlatform('chatgpt');
    console.log('Assistente IA inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar assistente IA:', error);
  }
}

function initializeNewFeatures() {
  console.log('Inicializando novas funcionalidades...');
