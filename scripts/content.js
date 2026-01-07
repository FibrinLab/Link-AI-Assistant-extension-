// NHS-Link AI Assistant - Content Script

console.log('NHS-Link AI: Content script loaded.');

// --- Configuration ---
const CONFIG = {
  selectors: {
    composeWindow: '[role="dialog"], [aria-label="New message"], .region-main', 
    editor: 'div[role="textbox"][aria-label*="Body"], .od-Editor-main',
    toolbar: '[aria-label="Command toolbar"], .ck-toolbar, [role="toolbar"]',
    subject: '[aria-label="Add a subject"], input[aria-label="Subject"]',
    emailBody: '.wide-content-host, .allowTextSelection, [aria-label="Message body"]' 
  },
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4o'
};

// --- State ---
let sidebarVisible = false;
let currentEditor = null; 
let sidebarElement = null;

// --- Initialization ---
function init() {
  injectSidebar();
  observeDOM();
}

// --- UI Injection: Sidebar ---
function injectSidebar() {
  if (document.getElementById('nhs-link-sidebar')) return;

  const sidebar = document.createElement('div');
  sidebar.id = 'nhs-link-sidebar';
  sidebar.innerHTML = `
    <div class="nhs-header">
      <h2>NHS-Link AI</h2>
      <button class="nhs-close-btn">&times;</button>
    </div>
    <div class="nhs-content">
      <div class="nhs-select-group">
        <label class="nhs-label">Tone</label>
        <select id="nhs-tone-select" class="nhs-select">
          <option value="Professional and Empathetic">Professional & Empathetic</option>
          <option value="Clinical and Precise">Clinical & Precise</option>
          <option value="Administrative and Formal">Administrative & Formal</option>
          <option value="Concise and Direct">Concise & Direct</option>
        </select>
      </div>

      <div class="nhs-select-group">
        <label class="nhs-label">Additional Instructions</label>
        <textarea id="nhs-instructions" class="nhs-select" rows="3" placeholder="e.g., 'Ask for their NHS number'"></textarea>
      </div>

      <button id="nhs-generate-btn" class="nhs-btn nhs-btn-primary">Generate Draft</button>
      
      <div id="nhs-status" class="nhs-status"></div>

      <label class="nhs-label">Draft Preview</label>
      <div id="nhs-preview" class="nhs-preview-box" contenteditable="true"></div>

      <button id="nhs-insert-btn" class="nhs-btn nhs-btn-secondary" disabled>Insert into Email</button>
    </div>
  `;

  document.body.appendChild(sidebar);
  sidebarElement = sidebar;

  sidebar.querySelector('.nhs-close-btn').addEventListener('click', toggleSidebar);
  sidebar.querySelector('#nhs-generate-btn').addEventListener('click', handleGenerate);
  sidebar.querySelector('#nhs-insert-btn').addEventListener('click', handleInsert);
}

function toggleSidebar() {
  sidebarVisible = !sidebarVisible;
  const sidebar = document.getElementById('nhs-link-sidebar');
  if (sidebarVisible) {
    sidebar.classList.add('open');
  } else {
    sidebar.classList.remove('open');
  }
}

// --- DOM Observation ---
function observeDOM() {
  const observer = new MutationObserver(() => {
    checkForComposeWindow();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function checkForComposeWindow() {
  const toolbars = document.querySelectorAll(CONFIG.selectors.toolbar);
  toolbars.forEach(toolbar => {
    if (toolbar.querySelector('.nhs-inject-btn')) return;
    injectButton(toolbar);
  });
}

function injectButton(toolbar) {
  const btn = document.createElement('button');
  btn.className = 'nhs-inject-btn';
  btn.innerText = '✨ Draft with AI';
  btn.type = 'button';
  
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    currentEditor = findAssociatedEditor(e.target);
    toggleSidebar();
  });

  if (toolbar.firstChild) {
    toolbar.insertBefore(btn, toolbar.firstChild);
  } else {
    toolbar.appendChild(btn);
  }
}

function findAssociatedEditor(buttonNode) {
  let container = buttonNode.closest('[role="dialog"]') || buttonNode.closest('.region-main') || document.body;
  return container.querySelector(CONFIG.selectors.editor);
}

// --- Logic: Scrape & Scrub ---

function scrapeContext() {
  let subject = "No Subject";
  const subjectInput = document.querySelector(CONFIG.selectors.subject);
  if (subjectInput) subject = subjectInput.value || subjectInput.innerText;

  let bodyText = "";
  const readingPane = document.querySelector('[aria-label="Message body"], .wide-content-host');
  if (readingPane) {
    bodyText = readingPane.innerText;
  }

  return { subject, body: bodyText };
}

function scrubPII(text) {
  if (!text) return "";
  const nhsNumberRegex = /\b\d{3}\s?\d{3}\s?\d{4}\b/g;
  const postcodeRegex = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi;
  let scrubbed = text.replace(nhsNumberRegex, '[REDACTED_NHS_NO]');
  scrubbed = scrubbed.replace(postcodeRegex, '[REDACTED_POSTCODE]');
  return scrubbed;
}

// --- Logic: OpenAI Generation ---

async function handleGenerate() {
  const statusDiv = document.getElementById('nhs-status');
  const previewDiv = document.getElementById('nhs-preview');
  const insertBtn = document.getElementById('nhs-insert-btn');
  const tone = document.getElementById('nhs-tone-select').value;
  const instructions = document.getElementById('nhs-instructions').value;

  statusDiv.className = 'nhs-status visible loading';
  statusDiv.innerText = 'Scraping context...';
  previewDiv.innerText = '';
  insertBtn.disabled = true;
  
  const context = scrapeContext();
  const scrubbedBody = scrubPII(context.body);
  const scrubbedSubject = scrubPII(context.subject);

  if (!scrubbedBody && !scrubbedSubject && !instructions) {
    statusDiv.innerText = 'Error: No email context found.';
    statusDiv.className = 'nhs-status visible error';
    return;
  }

  const stored = await chrome.storage.local.get(['openaiApiKey']);
  const apiKey = stored.openaiApiKey;

  if (!apiKey) {
    statusDiv.innerText = 'Error: No API Key. Click the extension icon to set it.';
    statusDiv.className = 'nhs-status visible error';
    return;
  }

  statusDiv.innerText = 'Generating with OpenAI...';

  const promptContent = `You are a busy NHS staff member. Draft a reply to the email below.
  Tone: ${tone}.
  Additional Instructions: ${instructions}.
  
  CRITICAL RULES:
  1. **EXTREMELY CONCISE:** Keep it under 100 words.
  2. **HUMAN-LIKE:** write like a real person, not an AI. Use simple, direct English.
  3. **NO FLUFF:** Do NOT use phrases like "I hope this email finds you well". Just start the reply.
  4. **FACTS ONLY:** Do not invent details.
  
  Context Subject: ${scrubbedSubject}
  Context Body:
  ${scrubbedBody.substring(0, 3000)}
  `;

  try {
    const response = await fetch(CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.model,
        messages: [{ role: 'system', content: promptContent }],
        max_tokens: 150,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API Request Failed');
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    previewDiv.innerText = generatedText.trim();
    statusDiv.innerText = 'Draft generated successfully.';
    statusDiv.className = 'nhs-status visible';
    insertBtn.disabled = false;

  } catch (err) {
    console.error(err);
    statusDiv.innerText = `Error: ${err.message}`;
    statusDiv.className = 'nhs-status visible error';
  }
}

// --- Logic: Insert ---

function handleInsert() {
  const previewDiv = document.getElementById('nhs-preview');
  const textToInsert = previewDiv.innerText;

  if (!currentEditor || !document.contains(currentEditor)) {
    const editors = document.querySelectorAll(CONFIG.selectors.editor);
    if (editors.length > 0) currentEditor = editors[0];
  }

  if (currentEditor) {
    currentEditor.focus();
    const success = document.execCommand('insertText', false, textToInsert);
    
    if (!success) {
      const p = document.createElement('div');
      p.innerText = textToInsert;
      currentEditor.appendChild(p);
      currentEditor.dispatchEvent(new Event('input', { bubbles: true }));
    }
    toggleSidebar(); 
  } else {
    navigator.clipboard.writeText(textToInsert).then(() => {
      alert('Could not auto-insert. Text copied to clipboard. Press Ctrl+V to paste.');
    });
  }
}

init();