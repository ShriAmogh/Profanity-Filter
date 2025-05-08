
console.log("Content script starting !!!!!!!!!!!!!!!!!!")
const processedNodes = new WeakMap();
let isEnabled = true;
let apiUrl = 'http://localhost:8000/check-content';
let censorChar = '*';

chrome.storage.sync.get({
  enabled: true,
  apiUrl: 'http://localhost:8000/check-content',
  censorChar: '*'
}, function (items) {
  isEnabled = items.enabled;
  apiUrl = items.apiUrl;
  censorChar = items.censorChar;

  if (isEnabled) {
    setTimeout(moderatePageContent, 1000); 
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'moderatePage') {
    censorChar = request.censorChar;
    apiUrl = request.apiUrl;
    moderatePageContent().then(result => sendResponse(result));
    return true; 
  }

  if (request.action === 'updateSettings') {
    isEnabled = request.settings.enabled;
    apiUrl = request.settings.apiUrl;
    censorChar = request.settings.censorChar;

    if (isEnabled) {
      moderatePageContent();
    }
    sendResponse({ success: true });
    return true;
  }
});

async function moderatePageContent() {
  if (!isEnabled) return { success: false, error: 'Moderation is disabled' };

  let totalProfanityCount = 0;

  try {
    const textNodes = getTextNodes(document.body);
    const batchSize = 10;

    for (let i = 0; i < textNodes.length; i += batchSize) {
      const batch = textNodes.slice(i, i + batchSize);
      const count = await processBatch(batch);
      totalProfanityCount += count;
    }

    return { success: true, count: totalProfanityCount };
  } catch (error) {
    console.error('Error moderating page:', error);
    return { success: false, error: error.message };
  }
}

async function processBatch(nodes) {
  let batchProfanityCount = 0;

  const promises = nodes.map(async node => {
    if (!node.textContent || node.textContent.trim().length < 2 || !node.parentElement) return 0;

    const style = window.getComputedStyle(node.parentElement);
    if (style && (style.visibility === "hidden" || style.display === "none")) return 0;

    const nodeKey = node.textContent;
    const savedData = processedNodes.get(node);

    if (savedData && savedData.original === nodeKey && savedData.censorChar === censorChar) {
      return savedData.profanityFound ? 1 : 0;
    }

    try {
      const result = await moderateText(node.textContent);

      if (result.moderated_text !== node.textContent) {
        processedNodes.set(node, {
          original: nodeKey,
          censorChar: censorChar,
          profanityFound: true
        });

        requestAnimationFrame(() => {
          node.textContent = result.moderated_text;
        });

        return 1;
      } else {
        processedNodes.set(node, {
          original: nodeKey,
          censorChar: censorChar,
          profanityFound: false
        });
        return 0;
      }
    } catch (error) {
      console.error('Error processing node:', error);
      return 0;
    }
  });

  const results = await Promise.all(promises);
  return results.reduce((sum, count) => sum + count, 0);
}

async function moderateText(text) {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text, censoring_char: censorChar })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling moderation API:', error);
    return { moderated_text: text };
  }
}

function getTextNodes(node) {
  const textNodes = [];

  if (node.nodeType === Node.ELEMENT_NODE) {
    const style = window.getComputedStyle(node);
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return textNodes;

    const tagName = node.tagName.toLowerCase();
    if (['script', 'style', 'noscript', 'iframe', 'canvas'].includes(tagName)) return textNodes;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    textNodes.push(node);
  }

  const children = node.childNodes;
  for (let i = 0; i < children.length; i++) {
    textNodes.push(...getTextNodes(children[i]));
  }

  return textNodes;
}

const observer = new MutationObserver(mutations => {
  if (!isEnabled) return;

  let shouldModerate = false;

  for (const mutation of mutations) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && node.textContent && node.textContent.length > 3) {
          shouldModerate = true;
          break;
        }
      }
    }
  }

  if (shouldModerate) {
    clearTimeout(observer.timeout);
    observer.timeout = setTimeout(() => {
      moderatePageContent();
    }, 500);
  }
});

observer.observe(document.body, { childList: true, subtree: true });
