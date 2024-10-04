// background/scripts/messaging.js

import { log } from './utils.js';

export const Messaging = {
  connectedPorts: [],

  init() {
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'options') {
        this.connectedPorts.push(port);
        log('Options page connected.');
        this.sendStatusUpdate();

        port.onDisconnect.addListener(() => {
          this.connectedPorts = this.connectedPorts.filter((p) => p !== port);
          log('Options page disconnected.');
          this.sendStatusUpdate();
        });
      }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      log('Message received:', message, sender);

      if (message.type === 'NEW_SNIPPETS') {
        this.handleNewSnippets(message.snippets, message.isDebug);
      }
      if (message.type === 'SYNC') {
        log('Received sync request from options page.');
        this.handleSyncRequest();
        sendResponse({ status: 'received' });
      }
    });
  },

  async handleNewSnippets(snippets, isDebug) {
    log(`Handling ${snippets.length} new snippets. Debug mode: ${isDebug}`);

    // Retrieve user settings
    chrome.storage.sync.get(['destination'], (data) => {
      const { destination } = data;

      if (!destination) {
        log('Destination not set.');
        return;
      }

      snippets.forEach((snippet) => {
        this.processSnippet(snippet, destination);
      });
    });
  },

  handleSyncRequest() {
    chrome.storage.sync.get(['destination'], (data) => {
      const { destination } = data;

      if (!destination) {
        log('Destination not set.');
        return;
      }

      if (this.websocketManager && this.websocketManager.socket.readyState === WebSocket.OPEN) {
        // send sync request to server with destination
        this.websocketManager.send({ type: 'SYNC', destination });
      } else {
        log('WebSocket is not connected. Cannot send message.');
      }
    });
  },

  processSnippet(snippet, destination) {
    const lines = snippet.content.split('\n');
    let relativePath = '';
    let codeContent = '';

    const filePathComment = lines[0];
    const filePathMatch = filePathComment.match(/(\/\/|#)\s*((.+)\.(.+))/);
    if (filePathMatch) {
      relativePath = filePathMatch[2].trim();
      codeContent = lines.slice(1).join('\n');
      log(`Snippet ID ${snippet.id} has file path: ${relativePath}`);
    }

    if (!relativePath) {
      // Fallback to using the snippet ID as the filename
      relativePath = `${snippet.id}.txt`;
      codeContent = snippet.content;
      log(`Snippet ID ${snippet.id} does not have a file path. Using fallback filename: ${relativePath}`);
    }

    const fullPath = `${destination}/${relativePath}`; // Use forward slash for cross-platform compatibility

    const message = {
      filePath: fullPath,
      content: codeContent,
      id: snippet.id,
    };

    // Send message to options page to display the snippet
    this.sendMessageToOptions({
      type: 'DISPLAY_SNIPPET',
      snippet: {
        id: snippet.id,
        content: codeContent,
      },
    });
    log(`Sending snippet ID ${snippet.id} to WebSocket server.`);

    if (this.websocketManager && this.websocketManager.socket.readyState === WebSocket.OPEN) {
      this.websocketManager.send(message);
    } else {
      log('WebSocket is not connected. Cannot send message.');
    }
  },

  sendStatusUpdate(status = {}) {
    const overallStatus = {
      tab: this.connectedPorts.length > 0 ? 'connected' : 'disconnected',
      background: 'active', // Assuming background is always active if this script is running
      websocket: status.websocket || 'disconnected',
    };
    this.connectedPorts.forEach((port) => {
      port.postMessage({ type: 'STATUS_UPDATE', status: overallStatus });
    });
  },

  sendMessageToOptions(message) {
    this.connectedPorts.forEach((port) => {
      port.postMessage(message);
    });
  },

  setWebSocketManager(websocketManager) {
    this.websocketManager = websocketManager;
  },
};
