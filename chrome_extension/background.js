
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get({
      enabled: true,
      apiUrl: 'http://127.0.0.1:8000/check-content',
      censorChar: '*'
    }, function(items) {
      
      chrome.storage.sync.set({
        enabled: items.enabled,
        apiUrl: items.apiUrl,
        censorChar: items.censorChar
      });
    });
  });
  
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateSettings') {
      chrome.tabs.query({}, (tabs) => {
        for (let tab of tabs) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateSettings',
            settings: request.settings
          }).catch(err => {
            console.log(`Could not update settings on tab ${tab.id}: ${err.message}`);
          });
        }
      });
      
      sendResponse({ success: true });
      return true;
    }
  });
  
  chrome.contextMenus.create({
    id: 'moderateSelectedText',
    title: 'Moderate Selected Text',
    contexts: ['selection']
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'moderateSelectedText') {
      chrome.storage.sync.get({
        apiUrl: 'http://localhost:8000/check-content',
        censorChar: '*'
      }, function(items) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'moderateSelection',
          text: info.selectionText,
          apiUrl: items.apiUrl,
          censorChar: items.censorChar
        });
      });
    }
  });