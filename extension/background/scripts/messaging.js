import { log } from './utils.js';

export const Messaging = {
  connectedPorts: [],
  contentScriptAlive: false, 
  websocketManager: null, // Track WebSocket manager

  init() {
    this.setupPortListener();
    this.setupMessageListener();
  },

  setupPortListener() {
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'options') {
        this.addPort(port);
        this.sendStatusUpdate();
        port.onDisconnect.addListener(() => this.removePort(port));
      }
    });
  },

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      log('Message received:', message, sender);

      const handlers = {
        NEW_SNIPPETS: () => {
          this.handleNewSnippets(message.snippets)
          sendResponse({ status: 'received' }); 
        },
        NEW_ASSISTANT_RESPONSES: () => {
          this.handleAssistantResponse(message.responses[0]);
          sendResponse({ status: 'received' });
        },
        SYNC: () => {
          log('Received sync request from options page.');
          this.handleSyncRequest();
          sendResponse({ status: 'received' });
        },
        SEND_TO_CHAT: () => {
          this.handleSendToChat(message.content);
          sendResponse({ status: 'received' });
        },
        ALIVE: () => {
          this.contentScriptAlive = true;
          this.sendStatusUpdate();
          sendResponse({ status: 'ALIVE received' });
        },
      };

      if (handlers[message.type]) {
        handlers[message.type]();
      }
    });
  },

  addPort(port) {
    this.connectedPorts.push(port);
    log('Options page connected.');
  },

  removePort(port) {
    this.connectedPorts = this.connectedPorts.filter((p) => p !== port);
    log('Options page disconnected.');
    this.sendStatusUpdate();
  },

  handleAssistantResponse(response) {
    const { id, content } = response;
    log('Received assistant response:', id);
    chrome.storage.sync.get(['destination'], (data) => {
      const { destination } = data;
      if (!destination) {
        log('Destination not set.');
        return;
      }
      this.sendSnippetToWebSocket({
        kind: 'assistant',
        filePath: destination,
        content,
        id,
      });
    });
  },

  handleNewSnippets(snippets) {
    log(`Handling ${snippets.length} new snippets.`);
    chrome.storage.sync.get(['destination'], (data) => {
      const { destination } = data;
      if (!destination) {
        log('Destination not set.');
        return;
      }
      snippets.forEach((snippet) => this.processSnippet(snippet, destination));
    });
  },

  handleSyncRequest() {
    chrome.storage.sync.get(['destination'], (data) => {
      const { destination } = data;
      if (!destination) {
        log('Destination not set.');
        return;
      }
      this.sendSyncRequest(destination);
    });
  },

  sendSyncRequest(destination) {
    if (this.websocketManager?.socket?.readyState === WebSocket.OPEN) {
      this.websocketManager.send({ type: 'SYNC', destination });
    } else {
      log('WebSocket is not connected. Cannot send message.');
    }
  },

  processSnippet(snippet, destination) {
    const { relativePath, codeContent } = this.extractSnippetDetails(snippet);
    const fullPath = `${relativePath || `./tmp/${snippet.id}.txt`}`;

    this.sendMessageToOptions({
      type: 'DISPLAY_SNIPPET',
      snippet: { id: snippet.id, filePath: fullPath, content: codeContent },
    });

    this.sendSnippetToWebSocket({
      kind: 'snippet',
      filePath: fullPath,
      content: codeContent,
      id: snippet.id,
    });
  },

  extractSnippetDetails(snippet) {
    const lines = snippet.content.split('\n');
    const filePathMatch = lines[0].match(/\s*([A-Za-z]:[\\/](.+)\.(.+))/);
    const relativePath = filePathMatch ? filePathMatch[1].trim() : '';
    const codeContent = lines.join('\n');
    log(`Snippet ID ${snippet.id} has file path: ${relativePath || 'No file path found'}`);
    return { relativePath, codeContent };
  },

  sendSnippetToWebSocket(message) {
    if (this.websocketManager?.socket?.readyState === WebSocket.OPEN) {
      this.websocketManager.send(message);
    } else {
      log('WebSocket is not connected. Cannot send message.');
    }
  },

  handleSendToChat(content) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.url?.startsWith('https://chatgpt.com/')) {
          chrome.tabs.sendMessage(tab.id, { type: 'APPEND_PROMPT', message: content });
        }
      });
    });
  },

  sendStatusUpdate(status = {}) {
    const overallStatus = {
      tab: this.contentScriptAlive ? 'connected' : 'disconnected',
      background: 'active',
      websocket: status.websocket || 'disconnected',
    };
    this.connectedPorts.forEach((port) => port.postMessage({ type: 'STATUS_UPDATE', status: overallStatus }));
  },

  sendMessageToOptions(message) {
    log('sendMessageToOptions called with message:', message);
    log('Connected ports:', this.connectedPorts.length);
    this.connectedPorts.forEach((port) => {
      log('Sending message to port:', port);
      port.postMessage(message);
    });
  },

  setWebSocketManager(websocketManager) {
    this.websocketManager = websocketManager;
  },
};