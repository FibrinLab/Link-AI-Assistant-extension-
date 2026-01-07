This Markdown document is designed to be saved as a `.md` file (e.g., `NHS-AI-Spec.md`). It outlines the technical and security requirements for building your Chrome extension.

---

# Project Specification: NHS-Link AI Assistant

## 1. Project Overview

**NHS-Link AI** is a specialized Chrome Extension designed for the **Outlook Web App (OWA)**. Its purpose is to assist NHS staff by analyzing email content and generating professional, context-aware reply drafts using the OpenAI GPT-4o API.

---

## 2. Technical Stack

* **Framework:** Chrome Extension Manifest V3.
* **Frontend:** React.js or Vanilla JS with Tailwind CSS for UI components.
* **Permissions:** * `storage`: To save the API key locally.
* `activeTab` / `scripting`: To read the DOM of the email.
* `hostPermissions`: Restricted to `https://outlook.office.com/*` and `https://*.nhs.net/*`.


* **LLM Integration:** Direct Client-side fetch to `https://api.openai.com/v1/chat/completions`.

---

## 3. Core Functional Requirements

### A. Email Context Extraction

* The extension must identify the "Compose" or "Reply" container in the Outlook DOM.
* It must scrape the **Subject** and the **Body** of the email thread being replied to.

### B. AI Generation Interface

* **Injected Button:** A "Draft with AI" button added to the Outlook formatting ribbon.
* **Prompt Presets:** Users can select tones: *Clinical, Administrative, Patient-Facing,* or *Concise*.
* **API Key Input:** A secure settings popup for the user to paste their OpenAI API key.

### C. Response Management

* The generated text should not overwrite the current draft immediately but appear in a "Review" box first.
* An **"Insert into Email"** button to paste the final text into the Outlook compose window.

---

## 4. Information Governance (NHS Security)

> **Important:** Handling NHS data requires strict adherence to Information Governance (IG) standards.

| Feature | Implementation |
| --- | --- |
| **Local Storage** | API Keys must be stored in `chrome.storage.local` (never on an external database). |
| **PII Scrubbing** | A client-side Regex filter to detect and redact NHS Numbers (10 digits) and UK Postcodes before sending the prompt to OpenAI. |
| **No-Train Clause** | The API calls should ideally be configured to ensure data is not used for model training (Standard for OpenAI API, but must be verified in headers). |
| **Ephemeral Processing** | No email content should be logged or saved by the extension after the reply is generated. |

---

## 5. User Interface (UI) Design

* **Sidebar Overlay:** A sliding panel on the right side of the browser.
* **Visual Integration:** Use "NHS Blue" (`#005EB8`) and "NHS White" for the UI to provide a native feel.
* **Status Indicators:**
* 🟢 API Key Valid
* 🟡 Analyzing Thread...
* 🔴 Error: No Email Context Found



---

## 6. Development Roadmap

### Phase 1: Foundation

* Setup `manifest.json` with V3 standards.
* Create a content script that detects when the user is on `outlook.office.com`.

### Phase 2: DOM Injection

* Identify CSS selectors for Outlook’s "New Message" window.
* Inject the "Draft with AI" button into the UI.

### Phase 3: Logic & API

* Build the function to pull text from the `.ms-Welcome` or `.Placeholder` classes in Outlook.
* Implement the `fetch` call to OpenAI with the user's local API key.

### Phase 4: Security Layer

* Add the PII scrubbing logic.
* Add "Clear Data" button to wipe the API key and local history.

---

## 7. Example Prompt Template

The extension will wrap the email content in the following system prompt:

> "You are a professional NHS administrative assistant. Draft a reply to the following email. Maintain a professional, empathetic, and clinical tone. Ensure you do not include any fictional patient names. Email context: [SCRAPED_CONTENT]"

---

**Would you like me to generate the actual `manifest.json` and the `contentScript.js` files based on this spec to get you started?**
