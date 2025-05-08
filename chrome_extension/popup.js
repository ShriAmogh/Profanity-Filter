document.addEventListener('DOMContentLoaded', function() {

    const enabledToggle = document.getElementById('enabled');
    const apiUrlInput = document.getElementById('apiUrl');
    const censorCharInput = document.getElementById('censorChar');
    const saveBtn = document.getElementById('saveBtn');
    const moderateBtn = document.getElementById('moderateBtn');
    const statusDiv = document.getElementById('status');

    chrome.storage.sync.get({
      enabled: true,
      apiUrl: 'http://localhost:8000/check-content',
      censorChar: '*'
    }, function(items) {
      enabledToggle.checked = items.enabled;
      apiUrlInput.value = items.apiUrl;
      censorCharInput.value = items.censorChar;
    });

    saveBtn.addEventListener('click', function() {

      if (censorCharInput.value.length !== 1) {
        showStatus('Censoring character must be a single character', 'error');
        return;
      }

      if (!apiUrlInput.value.trim()) {
        showStatus('API URL cannot be empty', 'error');
        return;
      }

      chrome.storage.sync.set({
        enabled: enabledToggle.checked,
        apiUrl: apiUrlInput.value.trim(),
        censorChar: censorCharInput.value
      }, function() {
        showStatus('Settings saved');
 
        chrome.runtime.sendMessage({ 
          action: 'updateSettings',
          settings: {
            enabled: enabledToggle.checked,
            apiUrl: apiUrlInput.value.trim(),
            censorChar: censorCharInput.value
          }
        });
      });
    });

    moderateBtn.addEventListener('click', function() {
      if (!enabledToggle.checked) {
        showStatus('Moderation is disabled. Enable it first.', 'error');
        return;
      }
      
      showStatus('Moderating page content...', 'info');

      fetch(apiUrlInput.value.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: 'test',
          censoring_char: censorCharInput.value
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (!tabs || !tabs[0]) {
            showStatus('No active tab found.', 'error');
            return;
          }
          
          chrome.tabs.sendMessage(
            tabs[0].id, 
            { 
              action: 'moderatePage',
              censorChar: censorCharInput.value,
              apiUrl: apiUrlInput.value.trim()
            }, 
            function(response) {

              if (chrome.runtime.lastError) {
                showStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
                return;
              }

              if (response && typeof response === 'object') {
                if (response.success) {
                  showStatus(`Moderation complete! Found ${response.count || 0} instances of profanity.`);
                } else {
                  showStatus(response.message || 'Failed to moderate page content.', 'error');
                }
              } else {
                showStatus('Invalid response from content script.', 'error');
              }
            }
          );
        });
      })
      .catch(error => {
        console.error('API Connection Error:', error);
        showStatus(`API Error: ${error.message}`, 'error');
      });
    });
    
    function showStatus(message, type = 'success') {
      statusDiv.textContent = message;

      if (type === 'error') {
        statusDiv.style.color = '#d93025';  
      } else if (type === 'info') {
        statusDiv.style.color = '#1a73e8'; 
      } else {
        statusDiv.style.color = '#188038'; 
      }

      if (type !== 'error') {
        setTimeout(function() {
          statusDiv.textContent = '';
        }, 3000);
      }
    }
  });