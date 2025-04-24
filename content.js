// MIT License - (c) 2025 Nodevantage
// https://github.com/nodevantage/ChatGPT-Table-of-Contents

  function createToC() {
    if (document.querySelector('#chatgpt-toc')) return;

    const toc = document.createElement('div');
    toc.id = 'chatgpt-toc';
    toc.innerHTML = `
      <h4 id="chatgpt-toc-toggle" class="px-3 py-3 cursor-pointer select-none flex justify-between items-center">
        Table of Contents
        <span id="toc-toggle-arrow" class="transition-transform duration-200">▼</span>
      </h4>
      <ol class="toc-list transition-all duration-200 ease-in-out max-h-[1000px] overflow-y-auto"></ol>
    `;

    const layoutContainer = document.querySelector('main')?.parentElement;

    if (layoutContainer) {
      // 💡 Force flex layout if not already
      layoutContainer.style.display = 'flex';
      layoutContainer.style.flexDirection = 'row';
      layoutContainer.style.alignItems = 'stretch';

      // 💡 Make sure chat area resizes instead of pushing ToC down
      const main = layoutContainer.querySelector('main');
      if (main) {
        main.style.flex = '1';
        main.style.minWidth = '0'; // Allow shrinking
      }

      // 💡 Sidebar config
      toc.style.flexShrink = '0';
      toc.style.width = '260px';
      toc.style.minWidth = '240px';
      toc.style.display = 'flex';
      toc.style.flexDirection = 'column';
      toc.style.zIndex = '10';

      layoutContainer.appendChild(toc);
    } else {
      // fallback
      document.body.appendChild(toc);
    }
  }

  document.addEventListener('click', (e) => {
    if (e.target.id === 'chatgpt-toc-toggle' || e.target.closest('#chatgpt-toc-toggle')) {
      const list = document.querySelector('#chatgpt-toc ol');
      const arrow = document.getElementById('toc-toggle-arrow');
      
      if (list.classList.contains('collapsed')) {
        list.classList.remove('collapsed');
        arrow.textContent = '▼';
      } else {
        list.classList.add('collapsed');
        arrow.textContent = '▲';
      }
    }
  });
  
  
  
  function updateToC() {
    const toc = document.getElementById('chatgpt-toc');
    const tocList = document.querySelector('#chatgpt-toc ol');
    if (!toc || !tocList) return;
  
    tocList.innerHTML = '';
  
    const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
  
    if (userMessages.length === 0) {
      toc.style.display = 'none'; // ⛔️ Hide if no user prompts
      return;
    } else {
      toc.style.display = 'block'; // ✅ Show when messages are found
    }
  
    userMessages.forEach((msg, i) => {
      const id = `toc-anchor-${i}`;
      msg.id = id;
  
      const rawText = msg.innerText || msg.textContent || '';
      const trimmed = rawText.trim().replace(/\s+/g, ' ');
      const displayText = trimmed.length > 40 ? trimmed.slice(0, 40) + '…' : trimmed;
  
      const listItem = document.createElement('li');
      listItem.innerHTML = `<a href="#${id}" data-target="${id}" class="flex items-center gap-2 px-3 py-2">${displayText}</a>`;
      tocList.appendChild(listItem);
    });
  
    // Scroll to bottom
    requestAnimationFrame(() => {
      tocList.scrollTop = tocList.scrollHeight;
    });
  
    // Apply intersection observer
    highlightActiveTocItem();
  }
  
  function highlightActiveTocItem() {
    const links = document.querySelectorAll('#chatgpt-toc a');
    const visibleMap = new Map();
    let debounceTimeout = null;
  
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const targetId = entry.target.id;
        const link = document.querySelector(`#chatgpt-toc a[data-target="${targetId}"]`);
        if (!link) return;
  
        if (entry.isIntersecting) {
          visibleMap.set(targetId, entry.intersectionRatio);
        } else {
          visibleMap.delete(targetId);
        }
      });
  
      // Debounce to wait for scroll/rendering to settle
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        let maxId = null;
        let maxRatio = 0;
  
        visibleMap.forEach((ratio, id) => {
          if (ratio > maxRatio) {
            maxId = id;
            maxRatio = ratio;
          }
        });
  
        if (maxId) {
          document.querySelectorAll('#chatgpt-toc a.toc-active').forEach(el => el.classList.remove('toc-active'));
          const bestLink = document.querySelector(`#chatgpt-toc a[data-target="${maxId}"]`);
          if (bestLink) bestLink.classList.add('toc-active');
        }
      }, 150); // Delay in ms (can be adjusted)
    }, {
      root: null,
      threshold: buildThresholdList()
    });
  
    const targets = document.querySelectorAll('[data-message-author-role="user"]');
    targets.forEach(el => observer.observe(el));
  }
  
  function buildThresholdList() {
    const thresholds = [];
    for (let i = 0; i <= 1.0; i += 0.05) {
      thresholds.push(i);
    }
    return thresholds;
  }
  
  
  // Smooth scroll
  document.addEventListener('click', (e) => {
    if (e.target.matches('#chatgpt-toc a')) {
      e.preventDefault();
      const id = e.target.getAttribute('href').substring(1);
      const target = document.getElementById(id);
  
      if (target) {
        // Detect the actual scrollable container inside ChatGPT
        const scrollContainer = document.querySelector('main div[class*="overflow-y-auto"]') 
          || document.querySelector('main div.overflow-y-auto') 
          || document.querySelector('main');
  
        if (!scrollContainer) return;
  
        const targetRect = target.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
  
        const offsetTop = targetRect.top - containerRect.top + scrollContainer.scrollTop;
        const yOffset = -40; // Adjust if needed to fine-tune vertical alignment
  
        scrollContainer.scrollTo({
          top: offsetTop + yOffset,
          behavior: 'smooth'
        });
      }
    }
  });
  
  
  
  
  function observeNewUserMessages() {
    const main = document.querySelector('main');
    if (!main) return;
  
    let knownCount = document.querySelectorAll('[data-message-author-role="user"]').length;
  
    const observer = new MutationObserver(() => {
      const currentCount = document.querySelectorAll('[data-message-author-role="user"]').length;
      if (currentCount > knownCount) {
        knownCount = currentCount;
        updateToC();
      }
    });
  
    observer.observe(main, {
      childList: true,
      subtree: true
    });
  }

  function autoCollapseToCOnMobile() {
    const list = document.querySelector('#chatgpt-toc ol');
    if (window.innerWidth < 1400 && list && !list.classList.contains('collapsed')) {
      list.classList.add('collapsed');
    }
  }
  
  window.addEventListener('resize', () => {
    autoCollapseToCOnMobile();
  });
  
  
  function init() {
    const interval = setInterval(() => {
      const main = document.querySelector('main');
      if (main) {
        clearInterval(interval);
        createToC();
        updateToC();
        observeNewUserMessages();
        autoCollapseToCOnMobile();
      }
    }, 300);
  }
  
  init();

  // Detect ChatGPT chat/session changes (no timer!)
  let lastUrl = location.pathname;

  const observer = new MutationObserver(() => {
    const currentUrl = location.pathname;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
  
      // Delay just enough for new content to render
      setTimeout(() => {
        updateToC();
        observeNewUserMessages();
        document.querySelectorAll('#chatgpt-toc a.toc-active').forEach(el => el.classList.remove('toc-active'));
      }, 500);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  let lastChatUrl = location.pathname;

const chatSessionObserver = new MutationObserver(() => {
  const currentUrl = location.pathname;

  const isChatPage = /^\/c\/[a-z0-9-]+$/i.test(currentUrl);

  if (currentUrl !== lastChatUrl && isChatPage) {
    lastChatUrl = currentUrl;

    // Wait a bit for the chat content to be rendered
    setTimeout(() => {
      createToC();              // Will skip if already created
      updateToC();              // Refresh ToC for new chat
      observeNewUserMessages(); // Reattach observers
    }, 500);
  }
});

chatSessionObserver.observe(document.body, {
  childList: true,
  subtree: true
});
