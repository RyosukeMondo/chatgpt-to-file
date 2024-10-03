// background.js

// Utility function for logging
function log(message, ...optionalParams) {
  console.log(`[Background] ${message}`, ...optionalParams);
}

let socket = null;

// Initialize WebSocket connection
function initWebSocket() {
  const wsUrl = 'ws://localhost:8765/';

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    log('WebSocket connection established.');
  };

  socket.onmessage = (event) => {
    log('Message received from server:', event.data);
    try {
      const response = JSON.parse(event.data);
      handleServerResponse(response);
    } catch (error) {
      log('Error parsing server response:', error);
    }
  };

  socket.onerror = (error) => {
    log('WebSocket error:', error);
  };

  socket.onclose = (event) => {
    log(`WebSocket connection closed: Code ${event.code}, Reason: ${event.reason}`);
    // Optionally attempt to reconnect after a delay
    setTimeout(initWebSocket, 5000);
  };
}

// Handle responses from the server
function handleServerResponse(response) {
  if (response.status === 'success') {
    log(`Snippet ID ${response.id} saved to ${response.savedPath}`);
  } else if (response.status === 'error') {
    log(`Failed to save snippet ID ${response.id}: ${response.message}`);
  }
}

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  log('Message received:', message);

  if (message.type === 'NEW_SNIPPETS') {
    handleNewSnippets(message.snippets, message.isDebug);
  }
});

// Function to handle new snippets
function handleNewSnippets(snippets, isDebug) {
  log(`Handling ${snippets.length} new snippets. Debug mode: ${isDebug}`);

  // Retrieve user settings
  chrome.storage.sync.get(['destination'], (data) => {
    const { destination } = data;

    if (!destination) {
      log('Destination not set.');
      return;
    }

    snippets.forEach(snippet => {
      processSnippet(snippet, destination);
    });
  });
}

// Function to process individual snippet
function processSnippet(snippet, destination) {
  const lines = snippet.content.split('\n');
  let relativePath = '';
  let codeContent = '';
  
  if (snippet.hasFilePath) {
    const filePathComment = lines[0];
    const filePathMatch = filePathComment.match(/\/\/\s*(.+)/);
    if (filePathMatch) {
      relativePath = filePathMatch[1].trim();
      codeContent = lines.slice(1).join('\n');
      log(`Snippet ID ${snippet.id} has file path: ${relativePath}`);
    }
  }

  if (!relativePath) {
    // Fallback to using the snippet ID as the filename
    relativePath = `${snippet.id}.txt`;
    codeContent = snippet.content;
    log(`Snippet ID ${snippet.id} does not have a file path. Using fallback filename: ${relativePath}`);
  }

  const fullPath = `${destination}\\${relativePath}`;

  const message = {
    filePath: fullPath,
    content: codeContent,
    id: snippet.id
  };

  log(`Sending snippet ID ${snippet.id} to WebSocket server.`);
  
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    log('WebSocket is not connected. Cannot send message.');
  }
}

// Initialize WebSocket when the service worker starts
initWebSocket();
