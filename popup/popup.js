document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const statusDiv = document.getElementById('status');

  // Load saved key
  chrome.storage.local.get(['openaiApiKey'], (result) => {
    if (result.openaiApiKey) {
      apiKeyInput.value = result.openaiApiKey;
      showStatus('API Key loaded.', 'success');
    }
  });

  // Save key
  saveBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      showStatus('Please enter a valid API key.', 'error');
      return;
    }

    if (!key.startsWith('sk-')) {
      showStatus('Warning: Key should usually start with "sk-".', 'error');
      // We allow it anyway in case format changes, but warn.
    }

    chrome.storage.local.set({ openaiApiKey: key }, () => {
      showStatus('Configuration saved securely.', 'success');
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 2000);
    });
  });

  // Clear key
  clearBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['openaiApiKey'], () => {
      apiKeyInput.value = '';
      showStatus('Data cleared from local storage.', 'success');
    });
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
  }
});
