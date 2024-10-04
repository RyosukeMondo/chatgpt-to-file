// scripts/messaging.js

import { log } from './utils.js';
import { UI } from './ui.js';
import { Storage } from './storage.js';

export const Messaging = {
  init(port, displaySnippetCallback, saveFileCallback) {
    port.onMessage.addListener((msg) => {
      if (msg.type === 'STATUS_UPDATE') {
        const { tab, background, websocket } = msg.status;
        UI.updateIndicator(UI.initElements().tabStatusIndicator, tab);
        UI.updateIndicator(UI.initElements().backgroundStatusIndicator, background);
        UI.updateIndicator(UI.initElements().websocketStatusIndicator, websocket);
        log('Received status update:', msg.status);
      } else if (msg.type === 'DISPLAY_SNIPPET') {
        displaySnippetCallback(msg.snippet);
      } else if (msg.type === 'DISPLAY_FILE') {
        saveFileCallback(msg.filePath, msg.content);
      }
    });
  },

  sendMessage(message) {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        log('Error sending message:', chrome.runtime.lastError);
      } else {
        log('Message sent:', message, 'Response:', response);
      }
    });
  },

  connectPort(name, onMessageCallback) {
    const port = chrome.runtime.connect({ name });
    port.onMessage.addListener(onMessageCallback);
    return port;
  },
};
