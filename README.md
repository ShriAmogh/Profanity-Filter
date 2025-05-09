# Profanity-Filter

Profanity Filter for Safe Browsing is a Chrome extension powered by the in-built library known as better_profanity that detects and censors offensive or inappropriate content in real-time across web pages. Designed with children's online safety in mind, it uses natural language processing (NLP) to identify profane text and replaces it with a customizable censor character.

Features
✅ Real-time detection and censorship of offensive language.
🔁 Dynamic moderation as pages load new content (Mutation Observer)
🌐 Works across all websites via content scripts.
⚙️ Fully customizable censor character and backend API URL.
🧩 Easy toggle on/off via extension popup.
📡 Secure API integration using FastAPI.

Tech Stack
Frontend: JavaScript, Chrome Extensions API (content scripts, popup, options)
Backend: Python, FastAPI
Storage: chrome.storage.sync for settings persistence
Communication: chrome.runtime, chrome.tabs messaging for coordination

**How to get started**
1. git clone https://github.com/ShriAmogh/Profanity-Filter.git

   cd Profanity-Filter

2. pip install fastapi uvicorn 
   uvicorn backend:app --reload

3. Load the Chrome Extension
  Open Chrome and go to chrome://extensions  
  Enable Developer mode  
  Click Load unpacked  
  Select the extension/ folder inside this repo  
  The extension icon should appear in your browser bar

4. API Payload(for checking API)
  {
  "text": "some potentially profane content",
  "censoring_char": "*"
}


  



