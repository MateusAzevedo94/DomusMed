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
 * - Modal de imagens em tela cheia
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
 * Garante que sempre carregue a versão mais recente do Google Drive
 */
function applyCacheBustToAllImages() {
  const timestamp = new Date().getTime();
  
  // Aplica cache bust na capa
  const capaImg = document.getElementById('capa');
  if (capaImg && capaImg.src) {
    const separator = capaImg.src.includes('?') ? '&' : '?';
    capaImg.src = capaImg.src.split('?')[0] + separator + 't=' + timestamp;
    console.log('Cache bust aplicado à imagem de capa');
  }
  
  // Aplica cache bust nas imagens do corpo do texto
  const estudoImgs = document.querySelectorAll('.estudo-img');
  estudoImgs.forEach((img, index) => {
    if (img.src) {
      const separator = img.src.includes('?') ? '&' : '?';
      img.src = img.src.split('?')[0] + separator + 't=' + (timestamp + index);
      console.log(`Cache bust aplicado à imagem estudo-img ${index + 1}`);
    }
  });
}

// ============================
// MODAL DE IMAGEM EM TELA CHEIA
// ============================

/**
 * Cria o modal de imagem em tela cheia
 */
function createImageModal() {
  // Verifica se já existe
  if (document.getElementById('image-modal')) {
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'image-modal';
  modal.className = 'image-modal';
  
  const img = document.createElement('img');
  img.id = 'modal-image';
  
  modal.appendChild(img);
  document.body.appendChild(modal);
  
  // Event listener para fechar ao clicar
  modal.addEventListener('click', closeImageModal);
  
  console.log('Modal de imagem criado');
}

/**
 * Abre imagem em tela cheia
 */
function openImageModal(imageSrc, imageAlt) {
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-image');
  
  if (modal && modalImg) {
    modalImg.src = imageSrc;
    modalImg.alt = imageAlt || 'Imagem em tela cheia';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Fecha o modal de imagem
 */
function closeImageModal() {
  const modal = document.getElementById('image-modal');
  
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Configura event listeners para imagens com modal
 */
function setupImageModalListeners() {
  // Adiciona event listeners apenas para imagens com class="estudo-img"
  const estudoImgs = document.querySelectorAll('.estudo-img');
  
  estudoImgs.forEach(img => {
    img.addEventListener('click', () => {
      openImageModal(img.src, img.alt);
    });
    
    // Adiciona cursor pointer para indicar que é clicável
    img.style.cursor = 'pointer';
  });
  
  // Event listener para ESC fechar modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('image-modal');
      if (modal && modal.classList.contains('active')) {
        closeImageModal();
      }
    }
  });
  
  console.log(`Event listeners configurados para ${estudoImgs.length} imagens estudo-img`);
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
function showNotification(message) {
  // Remove notificação existente
  const existingNotification = document.querySelector('.ai-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = 'ai-notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  // Remove após 3 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

/**
 * Lida com seleção de texto na página
 */
function handleTextSelection() {
  const selection = window.getSelection();
  const text = selection.toString().trim();
  
  if (text.length > 0) {
    selectedText = text;
    updateSelectedTextDisplay();
  }
}

/**
 * Atualiza a exibição do texto selecionado no modal
 */
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

/**
 * Alterna entre plataformas
 */
function switchPlatform(platform) {
  currentPlatform = platform;
  
  // Atualiza botões de plataforma
  const platformButtons = document.querySelectorAll('.platform-btn');
  platformButtons.forEach(btn => {
    const btnPlatform = btn.getAttribute('data-platform');
    btn.classList.toggle('active', btnPlatform === platform);
  });
}

/**
 * Processa pergunta (pré-formulada ou personalizada)
 */
function processQuestion(question) {
  openAIPlatform(currentPlatform, question);
}

/**
 * Cria botões de plataformas de IA
 */
function createPlatformButtons() {
  const container = document.querySelector('.platform-buttons');
  if (!container) return;

  container.innerHTML = '';

  const platforms = [
    { id: 'chatgpt', name: 'ChatGPT' },
    { id: 'openevidence', name: 'OpenEvidence' },
    { id: 'consensus', name: 'Consensus' },
    { id: 'perplexity', name: 'Perplexity' }
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

/**
 * Cria botões de perguntas pré-formuladas
 */
function createPredefinedQuestionButtons() {
  const container = document.getElementById('questions-container');
  if (!container) return;

  container.innerHTML = '';

  PREDEFINED_QUESTIONS.forEach((question, index) => {
    const button = document.createElement('button');
    button.className = 'question-btn';
    button.textContent = question.short;
    button.title = question.detailed;
    
    button.addEventListener('click', () => {
      processQuestion(question.detailed);
    });
    
    container.appendChild(button);
  });
}

/**
 * Abre o modal do assistente IA
 */
function openAIModal() {
  const modal = document.getElementById('ai-modal');
  const overlay = document.getElementById('ai-modal-overlay');
  
  if (modal && overlay) {
    modal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Atualiza texto selecionado
    updateSelectedTextDisplay();
    
    setTimeout(() => {
      modal.classList.add('active');
      overlay.classList.add('active');
    }, 10);
  }
}

/**
 * Fecha o modal do assistente IA
 */
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

/**
 * Configura event listeners do assistente IA
 */
function setupAIEventListeners() {
  // Botão principal do assistente IA
  const aiBtn = document.getElementById('ai-assistant-btn');
  if (aiBtn) {
    aiBtn.addEventListener('click', openAIModal);
  }

  // Botão para fechar modal
  const closeBtn = document.getElementById('ai-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeAIModal);
  }

  // Overlay para fechar modal
  const overlay = document.getElementById('ai-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeAIModal);
  }

  // Botão de enviar pergunta personalizada
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

  // Enter no textarea para enviar
  const customQuestion = document.getElementById('custom-question');
  if (customQuestion) {
    customQuestion.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const sendBtn = document.getElementById('send-custom-btn');
        if (sendBtn) sendBtn.click();
      }
    });
  }

  // Seleção de texto na página
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keyup', handleTextSelection);

  // ESC para fechar modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('ai-modal');
      if (modal && modal.classList.contains('active')) {
        closeAIModal();
      }
    }
  });
}

// ============================
// NOVAS FUNCIONALIDADES: MENU FLUTUANTE
// ============================

/**
 * Alterna o menu flutuante principal
 */
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

/**
 * Fecha o menu flutuante
 */
function closeFloatingMenu() {
  const submenu = document.getElementById('floating-submenu');
  const mainBtn = document.getElementById('main-floating-btn');
  
  if (!submenu || !mainBtn) return;
  
  isFloatingMenuOpen = false;
  submenu.classList.remove('active');
  mainBtn.style.transform = 'rotate(0deg)';
}

/**
 * Configura event listeners do menu flutuante
 */
function setupFloatingMenuListeners() {
  // Botão principal do menu flutuante
  const mainBtn = document.getElementById('main-floating-btn');
  if (mainBtn) {
    mainBtn.addEventListener('click', toggleFloatingMenu);
  }

  // Sub-botão do assistente IA
  const aiSubmenuBtn = document.getElementById('ai-submenu-btn');
  if (aiSubmenuBtn) {
    aiSubmenuBtn.addEventListener('click', () => {
      closeFloatingMenu();
      openAIModal();
    });
  }

  // Sub-botão de contato
  const contactBtn = document.getElementById('contact-btn');
  if (contactBtn) {
    contactBtn.addEventListener('click', () => {
      closeFloatingMenu();
      openContactModal();
    });
  }

  // Sub-botão de sugestão de edição
  const suggestEditBtn = document.getElementById('suggest-edit-btn');
  if (suggestEditBtn) {
    suggestEditBtn.addEventListener('click', () => {
      closeFloatingMenu();
      openEditModal();
    });
  }

  // Sub-botão do GitHub
  const githubBtn = document.getElementById('github-btn');
  if (githubBtn) {
    githubBtn.addEventListener('click', () => {
      closeFloatingMenu();
      openGitHubModal();
    });
  }

  // Sub-botão de ferramentas
  const toolsBtn = document.getElementById('tools-btn');
  if (toolsBtn) {
    toolsBtn.addEventListener('click', () => {
      closeFloatingMenu();
      openToolsModal();
    });
  }

  // Sub-botão "Quero fazer parte"
  const joinTeamBtn = document.getElementById('join-team-btn');
  if (joinTeamBtn) {
    joinTeamBtn.addEventListener('click', () => {
      closeFloatingMenu();
      openJoinTeamModal();
    });
  }

  // Fechar menu ao clicar fora
  document.addEventListener('click', (e) => {
    const floatingMenu = document.getElementById('floating-menu');
    if (floatingMenu && !floatingMenu.contains(e.target) && isFloatingMenuOpen) {
      closeFloatingMenu();
    }
  });
}

// ============================
// NOVAS FUNCIONALIDADES: MODAIS
// ============================

/**
 * Abre modal de contato
 */
function openContactModal() {
  const modal = document.getElementById('contact-modal');
  const overlay = document.getElementById('modal-overlay');
  
  if (modal && overlay) {
    modal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      modal.classList.add('active');
      overlay.classList.add('active');
    }, 10);
  }
}

/**
 * Abre modal de edição
 */
function openEditModal() {
  const modal = document.getElementById('edit-modal');
  const overlay = document.getElementById('modal-overlay');
  
  if (modal && overlay) {
    modal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      modal.classList.add('active');
      overlay.classList.add('active');
    }, 10);
  }
}

/**
 * Abre modal de sugestão via GitHub
 */
function openGitHubModal() {
  const modal = document.getElementById('github-modal');
  const overlay = document.getElementById('modal-overlay');
  
  if (modal && overlay) {
    // Atualiza texto selecionado no modal do GitHub
    updateGitHubSelectedTextDisplay();
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      modal.classList.add('active');
      overlay.classList.add('active');
    }, 10);
  }
}

/**
 * Atualiza a exibição do texto selecionado no modal do GitHub
 */
function updateGitHubSelectedTextDisplay() {
  const container = document.getElementById('github-selected-text-container');
  const textDiv = document.getElementById('github-selected-text');
  
  if (container && textDiv) {
    if (selectedText) {
      textDiv.textContent = selectedText;
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  }
}

/**
 * Envia sugestão para GitHub Discussion
 */
function sendGitHubSuggestion() {
  const suggestionTextarea = document.getElementById('github-suggestion');
  if (!suggestionTextarea) return;
  
  const suggestion = suggestionTextarea.value.trim();
  if (!suggestion) {
    showNotification('Por favor, digite sua sugestão.');
    return;
  }
  
  const pageTitle = document.title || 'Página sem título';
  const pageUrl = window.location.href;
  
  // Compila as informações
  let compiledText = `**Sugestão de Edição**\n\n`;
  compiledText += `**Arquivo:** ${pageTitle}\n`;
  compiledText += `**Link:** ${pageUrl}\n\n`;
  
  if (selectedText) {
    compiledText += `**Texto selecionado:**\n\`\`\`\n${selectedText}\n\`\`\`\n\n`;
  }
  
  compiledText += `**Sugestão de alteração:**\n${suggestion}\n\n`;
  compiledText += `**Fonte bibliográfica da alteração sugerida:**\n[Preencher aqui a referência no formato Vancouver e com print/foto do texto/fonte]\n\n`;
  compiledText += `---\n*Sugestão enviada automaticamente via interface DomusMed*`;
  
  // Copia para área de transferência
  copyToClipboard(compiledText);
  
  // Abre GitHub Discussion
  const githubUrl = 'https://github.com/DomusMed/Materiais/discussions/1';
  window.open(githubUrl, '_blank');
  
  suggestionTextarea.value = '';
  closeAllModals();
  showNotification('Informações copiadas! Cole no GitHub Discussion.');
}

/**
 * Abre modal "Quero fazer parte"
 */
function openJoinTeamModal() {
  const modal = document.getElementById('join-team-modal');
  const overlay = document.getElementById('modal-overlay');
  
  if (modal && overlay) {
    modal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      modal.classList.add('active');
      overlay.classList.add('active');
    }, 10);
  }
}

/**
 * Controla a exibição do campo de semestre baseado no status acadêmico
 */
function handleStatusChange() {
  const statusSelect = document.getElementById('join-status');
  const semesterGroup = document.getElementById('semester-group');
  
  if (statusSelect && semesterGroup) {
    const isStudent = statusSelect.value === 'estudante';
    semesterGroup.style.display = isStudent ? 'block' : 'none';
    
    // Limpa o valor do semestre se não for estudante
    if (!isStudent) {
      const semesterSelect = document.getElementById('join-semester');
      if (semesterSelect) {
        semesterSelect.value = '';
      }
    }
  }
}

/**
 * Envia formulário "Quero fazer parte"
 */
function sendJoinTeamForm() {
  // Coleta os dados do formulário
  const name = document.getElementById('join-name')?.value.trim() || '';
  const email = document.getElementById('join-email')?.value.trim() || '';
  const phone = document.getElementById('join-phone')?.value.trim() || '';
  const status = document.getElementById('join-status')?.value || '';
  const semester = document.getElementById('join-semester')?.value || '';
  const motivation = document.getElementById('join-motivation')?.value.trim() || '';
  
  // Validação básica
  if (!name || !email || !status || !motivation) {
    showNotification('Por favor, preencha todos os campos obrigatórios.');
    return;
  }
  
  // Validação de e-mail básica
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showNotification('Por favor, digite um e-mail válido.');
    return;
  }
  
  // Monta o corpo do e-mail
  const subject = 'Quero fazer parte da DomusMed';
  let body = `Nome completo: ${name}\n\n`;
  body += `E-mail de contato: ${email}\n\n`;
  body += `Telefone de contato: ${phone || 'Não informado'}\n\n`;
  body += `Status acadêmico: ${status === 'estudante' ? 'Estudante de medicina' : 'Médico formado'}\n\n`;
  
  if (status === 'estudante' && semester) {
    body += `Semestre atual: ${semester}º semestre\n\n`;
  }
  
  body += `Motivação para se juntar ao projeto:\n${motivation}\n\n`;
  body += `---\nFormulário enviado via interface DomusMed`;
  
  // Abre cliente de e-mail
  const mailtoUrl = `mailto:contato@domusmed.site?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
  
  // Limpa o formulário
  clearJoinTeamForm();
  closeAllModals();
  showNotification('Cliente de e-mail aberto!');
}

/**
 * Limpa o formulário "Quero fazer parte"
 */
function clearJoinTeamForm() {
  const fields = ['join-name', 'join-email', 'join-phone', 'join-status', 'join-semester', 'join-motivation'];
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.value = '';
    }
  });
  
  // Esconde o campo de semestre
  const semesterGroup = document.getElementById('semester-group');
  if (semesterGroup) {
    semesterGroup.style.display = 'none';
  }
}

/**
 * Abre modal de ferramentas
 */
function openToolsModal() {
  const modal = document.getElementById('tools-modal');
  const overlay = document.getElementById('modal-overlay');
  
  if (modal && overlay) {
    modal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      modal.classList.add('active');
      overlay.classList.add('active');
    }, 10);
  }
}

/**
 * Fecha todos os modais
 */
function closeAllModals() {
  const modals = ['contact-modal', 'edit-modal', 'github-modal', 'join-team-modal', 'tools-modal'];
  const overlay = document.getElementById('modal-overlay');
  
  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    }
  });
  
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }, 300);
  }
}

/**
 * Abre discussão no GitHub
 */
function openGitHubDiscussion() {
  const url = 'https://github.com/DomusMed/Materiais/discussions/1';
  window.open(url, '_blank');
  showNotification('Abrindo discussão no GitHub...');
}

/**
 * Envia e-mail de contato
 */
function sendContactEmail() {
  const messageTextarea = document.getElementById('contact-message');
  if (!messageTextarea) return;
  
  const message = messageTextarea.value.trim();
  if (!message) {
    showNotification('Por favor, digite uma mensagem.');
    return;
  }
  
  const pageTitle = document.title || 'Página sem título';
  const pageUrl = window.location.href;
  
  const subject = 'DomusMed - Contato';
  const body = `Mensagem: ${message}\n\nPágina: ${pageTitle}\nLink: ${pageUrl}`;
  
  const mailtoUrl = `mailto:contato@domusmed.site?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
  
  messageTextarea.value = '';
  closeAllModals();
  showNotification('Cliente de e-mail aberto!');
}

/**
 * Envia sugestão de edição via e-mail
 */
function sendEditSuggestion() {
  const messageTextarea = document.getElementById('edit-message');
  if (!messageTextarea) return;
  
  const message = messageTextarea.value.trim();
  if (!message) {
    showNotification('Por favor, descreva sua sugestão.');
    return;
  }
  
  const pageTitle = document.title || 'Página sem título';
  const pageUrl = window.location.href;
  
  const subject = 'Sugestão de edição - DomusMed';
  let body = `Texto selecionado:\n${selectedText || 'Nenhum texto selecionado'}\n\n`;
  body += `Sugestão de alteração:\n${message}\n\n`;
  body += `Fonte bibliográfica da alteração sugerida:\n[Preencher aqui a referência no formato Vancouver e com print/foto do texto/fonte]\n\n`;
  body += `Nome do usuário:\n[Preencher aqui seu nome completo]\n\n`;
  body += `Contato do usuário (celular):\n[(xx) 9 xxxx xxxx]\n\n`;
  body += `Contato do usuário (e-mail):\n[Preencher aqui]\n\n`;
  body += `Página: ${pageTitle}\nLink: ${pageUrl}`;
  
  const mailtoUrl = `mailto:contato@domusmed.site?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
  
  messageTextarea.value = '';
  closeAllModals();
  showNotification('Cliente de e-mail aberto!');
}

/**
 * Configura event listeners dos modais
 */
function setupModalListeners() {
  // Botões de fechar modais
  const closeButtons = document.querySelectorAll('.modal-close');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  // Overlay para fechar modais
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeAllModals);
  }

  // Botão de enviar contato
  const sendContactBtn = document.getElementById('send-contact-btn');
  if (sendContactBtn) {
    sendContactBtn.addEventListener('click', sendContactEmail);
  }

  // Botão de enviar edição
  const sendEditBtn = document.getElementById('send-edit-btn');
  if (sendEditBtn) {
    sendEditBtn.addEventListener('click', sendEditSuggestion);
  }

  // Botão de enviar edição via GitHub
  const sendGitHubBtn = document.getElementById('send-github-btn');
  if (sendGitHubBtn) {
    sendGitHubBtn.addEventListener('click', sendGitHubSuggestion);
  }

  // Botão de fechar modal do GitHub
  const githubModalClose = document.getElementById('github-modal-close');
  if (githubModalClose) {
    githubModalClose.addEventListener('click', closeAllModals);
  }

  // Botão de enviar formulário "Quero fazer parte"
  const sendJoinTeamBtn = document.getElementById('send-join-team-btn');
  if (sendJoinTeamBtn) {
    sendJoinTeamBtn.addEventListener('click', sendJoinTeamForm);
  }

  // Botão de fechar modal "Quero fazer parte"
  const joinTeamModalClose = document.getElementById('join-team-modal-close');
  if (joinTeamModalClose) {
    joinTeamModalClose.addEventListener('click', closeAllModals);
  }

  // Event listener para mudança de status acadêmico
  const statusSelect = document.getElementById('join-status');
  if (statusSelect) {
    statusSelect.addEventListener('change', handleStatusChange);
  }

  // ESC para fechar modais
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.contact-modal.active, .edit-modal.active, .github-modal.active, .join-team-modal.active, .tools-modal.active');
      if (activeModal) {
        closeAllModals();
      }
    }
  });
}

// ============================
// NOVAS FUNCIONALIDADES: MODO ESCURO
// ============================

/**
 * Alterna modo escuro
 */
function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  
  // Atualiza botões de tema
  updateThemeButtons();
  
  // Salva preferência
  localStorage.setItem('darkMode', isDarkMode);
  
  showNotification(`Modo ${isDarkMode ? 'escuro' : 'claro'} ativado!`);
}

/**
 * Ativa modo claro
 */
function setLightMode() {
  isDarkMode = false;
  document.body.classList.remove('dark-mode');
  updateThemeButtons();
  localStorage.setItem('darkMode', false);
  showNotification('Modo claro ativado!');
}

/**
 * Ativa modo escuro
 */
function setDarkMode() {
  isDarkMode = true;
  document.body.classList.add('dark-mode');
  updateThemeButtons();
  localStorage.setItem('darkMode', true);
  showNotification('Modo escuro ativado!');
}

/**
 * Atualiza botões de tema
 */
function updateThemeButtons() {
  const lightBtn = document.getElementById('light-mode-btn');
  const darkBtn = document.getElementById('dark-mode-btn');
  
  if (lightBtn && darkBtn) {
    lightBtn.classList.toggle('active', !isDarkMode);
    darkBtn.classList.toggle('active', isDarkMode);
  }
}

/**
 * Carrega preferência de tema salva
 */
function loadThemePreference() {
  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme !== null) {
    isDarkMode = savedTheme === 'true';
    document.body.classList.toggle('dark-mode', isDarkMode);
    updateThemeButtons();
  }
}

// ============================
// NOVAS FUNCIONALIDADES: AJUSTE DE FONTE
// ============================

/**
 * Atualiza tamanho da fonte
 */
function updateFontSize(size) {
  currentFontSize = size;
  document.body.style.fontSize = `${size}px`;
  
  // Atualiza valor exibido
  const fontSizeValue = document.getElementById('font-size-value');
  if (fontSizeValue) {
    fontSizeValue.textContent = size;
  }
  
  // Atualiza slider
  const slider = document.getElementById('font-size-slider');
  if (slider) {
    slider.value = size;
  }
  
  // Atualiza botões de preset
  updateFontPresetButtons();
  
  // Salva preferência
  localStorage.setItem('fontSize', size);
  
  showNotification(`Tamanho da fonte: ${size}px`);
}

/**
 * Atualiza botões de preset de fonte
 */
function updateFontPresetButtons() {
  const presetButtons = document.querySelectorAll('.font-preset-btn');
  presetButtons.forEach(btn => {
    const btnSize = parseInt(btn.getAttribute('data-size'));
    btn.classList.toggle('active', btnSize === currentFontSize);
  });
}

/**
 * Carrega preferência de fonte salva
 */
function loadFontPreference() {
  const savedSize = localStorage.getItem('fontSize');
  if (savedSize) {
    currentFontSize = parseInt(savedSize);
    updateFontSize(currentFontSize);
  }
}

/**
 * Configura event listeners das ferramentas
 */
function setupToolsListeners() {
  // Botões de tema
  const lightBtn = document.getElementById('light-mode-btn');
  const darkBtn = document.getElementById('dark-mode-btn');
  
  if (lightBtn) {
    lightBtn.addEventListener('click', setLightMode);
  }
  
  if (darkBtn) {
    darkBtn.addEventListener('click', setDarkMode);
  }

  // Slider de fonte
  const fontSlider = document.getElementById('font-size-slider');
  if (fontSlider) {
    fontSlider.addEventListener('input', (e) => {
      updateFontSize(parseInt(e.target.value));
    });
  }

  // Botões de preset de fonte
  const presetButtons = document.querySelectorAll('.font-preset-btn');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const size = parseInt(btn.getAttribute('data-size'));
      updateFontSize(size);
    });
  });
}

// ============================
// CRIAÇÃO DINÂMICA DE ELEMENTOS DE INTERFACE
// ============================

/**
 * Cria a barra de progresso de leitura
 */
function createProgressBar() {
  // Verifica se já existe
  if (document.getElementById('progress-container')) {
    return;
  }

  const progressContainer = document.createElement('div');
  progressContainer.id = 'progress-container';
  
  const readingTime = document.createElement('div');
  readingTime.id = 'reading-time';
  readingTime.textContent = 'Calculando tempo...';
  
  const progressBar = document.createElement('div');
  progressBar.id = 'progress-bar';
  progressBar.textContent = '0%';
  
  progressContainer.appendChild(readingTime);
  progressContainer.appendChild(progressBar);
  
  document.body.appendChild(progressContainer);
  addFadeInClass(progressContainer);
  
  console.log('Barra de progresso criada dinamicamente');
}

/**
 * Cria o botão flutuante do sumário
 */
function createToggleButton() {
  // Verifica se já existe
  if (document.getElementById('toggle-btn')) {
    return;
  }

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'toggle-btn';
  toggleBtn.setAttribute('aria-label', 'Abrir/Fechar Sumário');
  toggleBtn.setAttribute('title', 'Sumário');
  
  const icon = document.createElement('span');
  icon.className = 'icon';
  icon.textContent = '☰';
  
  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = 'Sumário';
  
  toggleBtn.appendChild(icon);
  toggleBtn.appendChild(label);
  
  document.body.appendChild(toggleBtn);
  addFadeInClass(toggleBtn);
  
  console.log('Botão de sumário criado dinamicamente');
  return toggleBtn;
}

/**
 * Cria a sidebar do sumário
 */
function createSidebar() {
  // Verifica se já existe
  if (document.getElementById('sidebar')) {
    return;
  }

  const sidebar = document.createElement('div');
  sidebar.id = 'sidebar';
  sidebar.setAttribute('aria-label', 'Sumário da página');
  
  const ul = document.createElement('ul');
  ul.id = 'lista-sumario';
  
  sidebar.appendChild(ul);
  document.body.appendChild(sidebar);
  
  // Cria overlay para mobile
  createSidebarOverlay();
  
  console.log('Sidebar criada dinamicamente');
  return sidebar;
}

/**
 * Cria overlay para sidebar em dispositivos móveis
 */
function createSidebarOverlay() {
  // Verifica se já existe
  if (document.getElementById('sidebar-overlay')) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'sidebar-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  
  document.body.appendChild(overlay);
  
  // Adiciona evento para fechar sidebar ao clicar no overlay
  overlay.addEventListener('click', closeSidebar);
  
  console.log('Overlay da sidebar criado');
  return overlay;
}

// ============================
// GERAÇÃO AUTOMÁTICA DO SUMÁRIO
// ============================

/**
 * Gera o sumário automaticamente baseado nos cabeçalhos da página
 */
function generateSummary() {
  const headers = document.querySelectorAll('h1, h2, h3, h4');
  const lista = document.getElementById('lista-sumario');
  
  if (!lista) {
    console.warn('Lista do sumário não encontrada');
    return;
  }

  // Limpa lista existente
  lista.innerHTML = '';
  
  let summaryCount = 0;
  
  headers.forEach((header, index) => {
    // Pula h1 se for o título principal
    if (header.tagName === 'H1' && index === 0) {
      return;
    }
    
    // Cria ID único se não existir
    if (!header.id) {
      header.id = `titulo-${index}`;
    }
    
    const li = document.createElement('li');
    const a = document.createElement('a');
    
    a.href = `#${header.id}`;
    a.textContent = header.textContent.trim();
    a.setAttribute('title', `Ir para: ${header.textContent.trim()}`);
    
    // Aplica indentação baseada no nível do cabeçalho
    const level = parseInt(header.tagName.charAt(1));
    if (level >= 1) {
      li.style.marginLeft = `${(level - 1) * 20}px`;
    }
    
    // Adiciona classe para estilização específica
    li.className = `summary-level-${level}`;
    
    // Evento de clique para scroll suave
    a.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToElement(header);
      
      // Fecha sidebar em mobile após clique
      if (isMobile()) {
        closeSidebar();
      }
    });
    
    li.appendChild(a);
    lista.appendChild(li);
    summaryCount++;
  });
  
  console.log(`Sumário gerado com ${summaryCount} itens`);
}

/**
 * Scroll suave para elemento
 */
function scrollToElement(element) {
  if (element) {
    const offsetTop = element.offsetTop - 80; // Offset para não ficar colado no topo
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
  }
}

// ============================
// CONTROLE DA SIDEBAR
// ============================

/**
 * Alterna visibilidade da sidebar
 */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (!sidebar) return;
  
  const isActive = sidebar.classList.contains('active');
  
  if (isActive) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

/**
 * Abre a sidebar
 */
function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('toggle-btn');
  
  if (sidebar) {
    sidebar.classList.add('active');
    sidebar.setAttribute('aria-hidden', 'false');
  }
  
  if (overlay && isMobile()) {
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
  }
  
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', 'true');
  }
  
  // Previne scroll do body em mobile
  if (isMobile()) {
    document.body.style.overflow = 'hidden';
  }
  
  console.log('Sidebar aberta');
}

/**
 * Fecha a sidebar
 */
function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('toggle-btn');
  
  if (sidebar) {
    sidebar.classList.remove('active');
    sidebar.setAttribute('aria-hidden', 'true');
  }
  
  if (overlay) {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
  }
  
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', 'false');
  }
  
  // Restaura scroll do body
  document.body.style.overflow = '';
  
  console.log('Sidebar fechada');
}

// ============================
// BARRA DE PROGRESSO DE LEITURA
// ============================

/**
 * Calcula e atualiza a barra de progresso de leitura
 */
function updateProgress() {
  const progressBar = document.getElementById('progress-bar');
  const readingTimeEl = document.getElementById('reading-time');
  
  if (!progressBar || !readingTimeEl) return;
  
  // Calcula progresso do scroll
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  const percent = Math.min(100, Math.round(progress));
  
  // Atualiza largura da barra
  const containerWidth = document.getElementById('progress-container')?.offsetWidth || 0;
  const readingTimeWidth = readingTimeEl.offsetWidth || 0;
  const barWidth = (containerWidth - readingTimeWidth) * (percent / 100);
  
  progressBar.style.width = `${barWidth}px`;
  progressBar.textContent = `${percent}%`;
  
  // Muda cor quando completo
  if (percent === 100) {
    progressBar.classList.add('complete');
  } else {
    progressBar.classList.remove('complete');
  }
  
  // Calcula tempo restante
  updateReadingTime(percent, readingTimeEl);
}

/**
 * Calcula e atualiza o tempo estimado de leitura
 */
function updateReadingTime(percent, readingTimeEl) {
  // Conta palavras do conteúdo principal
  const bodyText = document.body.innerText || document.body.textContent || '';
  const words = bodyText.trim().split(/\s+/).length;
  const totalMinutes = words / CONFIG.WPM;
  
  const minutesLeft = Math.max(0, Math.ceil(totalMinutes * (1 - percent / 100)));
  const hours = Math.floor(minutesLeft / 60);
  const mins = minutesLeft % 60;
  
  let timeText = 'Tempo restante estimado: ⏳ ';
  
  if (percent === 100) {
    timeText = 'Leitura concluída! ✅';
  } else if (hours > 0) {
    timeText += `${hours}h ${mins}m`;
  } else {
    timeText += `${mins}m`;
  }
  
  readingTimeEl.textContent = timeText;
}

// ============================
// EVENTOS E INICIALIZAÇÃO
// ============================

/**
 * Configura todos os event listeners
 */
function setupEventListeners() {
  // Botão de toggle da sidebar
  const toggleBtn = document.getElementById('toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleSidebar);
    
    // Suporte a teclado
    toggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSidebar();
      }
    });
  }
  
  // Eventos de scroll com throttle
  const throttledUpdateProgress = throttle(updateProgress, CONFIG.SCROLL_THROTTLE);
  window.addEventListener('scroll', throttledUpdateProgress);
  
  // Eventos de redimensionamento
  window.addEventListener('resize', () => {
    updateProgress();
    
    // Fecha sidebar em desktop se estiver aberta
    if (!isMobile()) {
      const overlay = document.getElementById('sidebar-overlay');
      if (overlay && overlay.classList.contains('active')) {
        closeSidebar();
      }
    }
  });
  
  // Tecla ESC para fechar sidebar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const sidebar = document.getElementById('sidebar');
      if (sidebar && sidebar.classList.contains('active')) {
        closeSidebar();
      }
    }
  });
  
  console.log('Event listeners configurados');
}

/**
 * Inicialização principal do script
 */
async function initializeApp() {
  console.log('Inicializando aplicação...');
  
  try {
    // 1. Carrega modais e rodapé dinamicamente
    const modalsLoaded = await loadModals();
    if (!modalsLoaded) {
      console.warn('Modais não puderam ser carregados, continuando sem eles...');
    }
    
    // 2. Aplica cache bust nas imagens
    applyCacheBustToAllImages();
    
    // 3. Cria modal de imagem
    createImageModal();
    
    // 4. Configura event listeners para imagens
    setupImageModalListeners();
    
    // 5. Cria elementos de interface dinamicamente
    createProgressBar();
    createToggleButton();
    createSidebar();
    
    // 6. Gera sumário automaticamente
    generateSummary();
    
    // 7. Configura event listeners
    setupEventListeners();
    
    // 8. Inicializa assistente IA
    initializeAIAssistant();
    
    // 9. Inicializa novas funcionalidades
    initializeNewFeatures();
    
    // 10. Atualiza progresso inicial
    updateProgress();
    
    console.log('Aplicação inicializada com sucesso!');
    
  } catch (error) {
    console.error('Erro durante a inicialização:', error);
  }
}

/**
 * Inicializa o assistente IA
 */
function initializeAIAssistant() {
  console.log('Inicializando assistente IA...');
  
  try {
    // Cria botões de plataformas
    createPlatformButtons();
    
    // Cria botões de perguntas pré-formuladas
    createPredefinedQuestionButtons();
    
    // Configura event listeners do assistente IA
    setupAIEventListeners();
    
    // Define plataforma inicial
    switchPlatform('chatgpt');
    
    console.log('Assistente IA inicializado com sucesso!');
    
  } catch (error) {
    console.error('Erro ao inicializar assistente IA:', error);
  }
}

/**
 * Inicializa as novas funcionalidades
 */
function initializeNewFeatures() {
  console.log('Inicializando novas funcionalidades...');
  
  try {
    // Configura event listeners do menu flutuante
    setupFloatingMenuListeners();
    
    // Configura event listeners dos modais
    setupModalListeners();
    
    // Configura event listeners das ferramentas
    setupToolsListeners();
    
    // Carrega preferências salvas
    loadThemePreference();
    loadFontPreference();
    
    console.log('Novas funcionalidades inicializadas com sucesso!');
    
  } catch (error) {
    console.error('Erro ao inicializar novas funcionalidades:', error);
  }
}

// ============================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================

// Aguarda o DOM estar pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM já está pronto
  initializeApp();
}

/**
 * Função de reinicialização para novos conteúdos
 * Útil quando o conteúdo da página é alterado dinamicamente
 */
function reinitialize() {
  console.log('Reinicializando aplicação...');
  
  // Regenera sumário
  generateSummary();
  
  // Atualiza progresso
  updateProgress();
  
  // Reaplica cache bust
  applyCacheBustToAllImages();
  
  // Reconfigura event listeners para imagens
  setupImageModalListeners();
  
  console.log('Aplicação reinicializada');
}

// Expõe funções globais para uso externo se necessário
window.MedicalResumeApp = {
  reinitialize,
  toggleSidebar,
  openSidebar,
  closeSidebar,
  updateProgress,
  generateSummary,
  toggleDarkMode,
  updateFontSize,
  openContactModal,
  openEditModal,
  openToolsModal,
  openImageModal,
  closeImageModal,
  applyCacheBustToAllImages
};

console.log('Script do modelo de resumos médicos carregado com funcionalidades de cache bust e modal de imagens');

