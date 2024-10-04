// scripts/ui.js

import { escapeHtml, log } from './utils.js';
import { Storage } from './storage.js';

export const UI = {
  initElements() {
    return {
      destinationInput: document.getElementById('destination'),
      saveButton: document.getElementById('save'),
      syncButton: document.getElementById('sync'),
      statusDiv: document.getElementById('status'),
      capturedSnippetsDiv: document.getElementById('capturedSnippets'),
      fileListDiv: document.getElementById('fileList'),
      tabStatusIndicator: document.getElementById('tab-status'),
      backgroundStatusIndicator: document.getElementById('background-status'),
      websocketStatusIndicator: document.getElementById('websocket-status'),
    };
  },

  displayStatus(statusDiv, message, type) {
    statusDiv.textContent = message;
    statusDiv.className = '';
    if (type === 'success') {
      statusDiv.classList.add('status-success');
    } else if (type === 'error') {
      statusDiv.classList.add('status-error');
    }
  },

  clearStatus(statusDiv) {
    statusDiv.textContent = '';
    statusDiv.className = '';
  },

  displaySnippet(snippetsDiv, snippet) {
    const snippetDiv = document.createElement('div');
    snippetDiv.className = 'snippet';
    snippetDiv.innerHTML = `
      <div class="snippet-id">Snippet ID: ${snippet.id}</div>
      <pre><code>${escapeHtml(snippet.content)}</code></pre>
    `;
    snippetsDiv.prepend(snippetDiv);
    log(`Displayed snippet ID ${snippet.id} on options page.`);
  },

  addFileToList(fileListDiv, file) {
    const { filePath } = file;
    const existingFiles = Array.from(fileListDiv.children).map(item => item.getAttribute('data-filepath'));

    if (!existingFiles.includes(filePath)) {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.setAttribute('data-filepath', filePath);
      fileItem.innerHTML = `
        <button class="view-button" data-filepath="${filePath}">View</button>
        <button class="delete-button" data-filepath="${filePath}">Delete</button>
        <strong>File:</strong> ${filePath}
        <pre class="file-content" style="display: none;"></pre>
      `;
      fileListDiv.appendChild(fileItem);
      log(`Added file to list: ${filePath}`);

      // Bind event listeners
      fileItem.querySelector('.view-button').addEventListener('click', () => {
        UI.toggleFileContent(filePath);
      });
      fileItem.querySelector('.delete-button').addEventListener('click', () => {
        UI.deleteFile(filePath, fileListDiv);
      });
    }
  },

  toggleFileContent(filePath) {
    const fileListDiv = document.getElementById('fileList');
    const fileItem = Array.from(fileListDiv.children).find(item => item.getAttribute('data-filepath') === filePath);
    if (fileItem) {
      const contentPre = fileItem.querySelector('.file-content');
      if (contentPre.style.display === 'none') {
        const content = Storage.getFileContent(filePath);
        contentPre.textContent = content;
        contentPre.style.display = 'block';
      } else {
        contentPre.style.display = 'none';
      }
    }
  },

  deleteFile(filePath, fileListDiv) {
    if (confirm(`Are you sure you want to delete ${filePath}?`)) {
      Storage.removeFile(filePath);
      const fileItem = Array.from(fileListDiv.children).find(item => item.getAttribute('data-filepath') === filePath);
      if (fileItem) {
        fileListDiv.removeChild(fileItem);
        log(`Deleted file: ${filePath}`);
      }
    }
  },

  updateIndicator(element, status) {
    element.style.backgroundColor = 'gray'; // Default color
    switch (status) {
      case 'connected':
      case 'active':
        element.style.backgroundColor = 'green';
        break;
      case 'connecting':
        element.style.backgroundColor = 'yellow';
        break;
      case 'disconnected':
      case 'error':
        element.style.backgroundColor = 'red';
        break;
      default:
        element.style.backgroundColor = 'gray';
    }
  },
};
