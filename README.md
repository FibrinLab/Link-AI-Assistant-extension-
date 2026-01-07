# Link-AI Assistant

**Link-AI Assistant** is a specialized Chrome Extension designed for healthcare professionals using the **Outlook Web App (OWA)**. It streamlines communication by analyzing email content and generating professional, context-aware reply drafts using the OpenAI GPT-4o API.

## 🚀 Features

*   **Context-Aware Drafting:** Automatically scrapes the subject and body of the email thread to generate relevant replies.
*   **Privacy-First Design:**
    *   **PII Scrubbing:** Automatically detects and redacts sensitive 10-digit identification numbers and UK postcodes before sending data to the AI.
    *   **Local Storage:** Your API key is stored securely in your browser's local storage, never on an external database.
*   **Customizable Tones:** Choose from presets like *Professional & Empathetic*, *Clinical & Precise*, or *Concise & Direct*.
*   **Seamless Integration:** Adds a "Draft with AI" button directly into the Outlook formatting ribbon.
*   **Review Before Sending:** Drafts appear in a preview panel for editing before insertion.

## 🛠️ Installation

1.  Clone this repository or download the source code.
2.  Open **Google Chrome** and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** using the toggle in the top right corner.
4.  Click **Load unpacked**.
5.  Select the directory containing this project's files.

## 📖 Usage

1.  **Setup:** Click the extension icon in your browser toolbar and enter your OpenAI API Key.
2.  **Open Outlook:** Navigate to `outlook.office.com`.
3.  **Draft:** Open an email to reply to (or start a new message).
4.  **Generate:** Click the **"✨ Draft with AI"** button in the toolbar.
5.  **Refine:** Select your desired tone, add any specific instructions (e.g., "Ask for appointment availability"), and click **Generate Draft**.
6.  **Insert:** Review the text and click **Insert into Email**.

## 🔒 Security & Privacy

*   **No Training:** We recommend using an OpenAI API key configured to opt-out of model training for maximum privacy.
*   **Ephemeral Processing:** No email content is logged or saved by the extension after the reply is generated.
*   **Client-Side Filtering:** Sensitive data patterns are redacted on your device before the request leaves your browser.

## 📄 License

This project is open-source.
