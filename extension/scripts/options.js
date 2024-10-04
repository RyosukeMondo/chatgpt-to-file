// scripts/options.js

import { log, normalizePath } from './utils.js';
import { Storage } from './storage.js';
import { UI } from './ui.js';
import { Messaging } from './messaging.js';

document.addEventListener('DOMContentLoaded', async () => {
  const elements = UI.initElements();
  const {
    destinationInput,
    saveButton,
    syncButton,
    statusDiv,
    capturedSnippetsDiv,
    fileListDiv,
  } = elements;

  // Load saved settings
  const data = await Storage.getSyncData(['destination']);
  if (data.destination) {
    destinationInput.value = data.destination;
    loadFilesForDestination(data.destination);
  }
  log('Settings loaded:', data);

  // Save settings handler
  saveButton.addEventListener('click', async () => {
    const destination = normalizePath(destinationInput.value.trim());
    if (!destination) {
      UI.displayStatus(statusDiv, 'Destination path is required.', 'error');
      log('Save failed: Missing destination.');
      return;
    }
    Storage.clearFilesForDestination(destination);
    await Storage.setSyncData({ destination });
    UI.displayStatus(statusDiv, 'Options saved successfully!', 'success');
    log('Settings saved:', { destination });
    loadFilesForDestination(destination);
    setTimeout(() => { UI.clearStatus(statusDiv); }, 3000);
  });

  // Sync button handler
  syncButton.addEventListener('click', () => {
    Messaging.sendMessage({ type: 'SYNC' });
    UI.displayStatus(statusDiv, 'Sync request sent.', 'success');
    log('Sent sync request to background script.');
    setTimeout(() => { UI.clearStatus(statusDiv); }, 3000);
  });

  // Initialize messaging
  const port = Messaging.connectPort('options', (msg) => {
    if (msg.type === 'STATUS_UPDATE') {
      const { tab, background, websocket } = msg.status;
      UI.updateIndicator(elements.tabStatusIndicator, tab);
      UI.updateIndicator(elements.backgroundStatusIndicator, background);
      UI.updateIndicator(elements.websocketStatusIndicator, websocket);
      log('Received status update:', msg.status);
    } else if (msg.type === 'DISPLAY_SNIPPET') {
      UI.displaySnippet(capturedSnippetsDiv, msg.snippet);
    } else if (msg.type === 'DISPLAY_FILE') {
      saveFile(msg.file);
    }
  });

  // Function to save received file
  function saveFile(file) {
    const { filePath, content } = file;
    const normalizedFilePath = normalizePath(filePath);
    const destination = normalizePath(destinationInput.value.trim());
    if (!destination) {
      log('Save failed: Missing destination.');
      return;
    }
    Storage.saveFileToLocal(destination, normalizedFilePath, content);
    UI.addFileToList(fileListDiv, { filePath: normalizedFilePath });
  }

  // Function to load files for the current destination
  function loadFilesForDestination(destination) {
    fileListDiv.innerHTML = ''; // Clear current list
    const files = Storage.getFilesForDestination(destination);
    files.forEach(file => UI.addFileToList(fileListDiv, file));
  }

  // Listen for messages from background script to display captured snippets and files
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'DISPLAY_SNIPPET') {
      UI.displaySnippet(capturedSnippetsDiv, message.snippet);
    } else if (message.type === 'DISPLAY_FILE') {
      saveFile(message.file);
    }
  });
});