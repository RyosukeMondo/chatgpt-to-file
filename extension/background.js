// background.js

// Utility function for logging
function log(message, ...optionalParams) {
  console.log(`[Background] ${message}`, ...optionalParams);
}

let socket = null;
let connectedPorts = [];
let wsStatus = 'disconnected'; // Possible values: 'connected', 'connecting', 'disconnected'

// Initialize WebSocket connection
function initWebSocket() {
  const wsUrl = 'ws://localhost:8765/';

  wsStatus = 'connecting';
  sendStatusUpdate();

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    wsStatus = 'connected';
    log('WebSocket connection established.');
    sendStatusUpdate();
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
    wsStatus = 'disconnected';
    log('WebSocket error:', error);
    sendStatusUpdate();
  };

  socket.onclose = (event) => {
    wsStatus = 'disconnected';
    log(`WebSocket connection closed: Code ${event.code}, Reason: ${event.reason}`);
    sendStatusUpdate();
    // Attempt to reconnect after a delay
    setTimeout(initWebSocket, 5000);
  };
}

// Handle responses from the server
function handleServerResponse(response) {
  if (response.type === 'FILE_CONTENT') {
    log(`Received file content for path: ${response.filePath}`);
    sendFileToOptionsPage(response);
  } else if (response.status === 'success') {
    log(`Snippet ID ${response.id} saved to ${response.savedPath}`);
  } else if (response.status === 'error') {
    log(`Failed to save snippet ID ${response.id}: ${response.message}`);
  }
}

// Send file content to options page
function sendFileToOptionsPage(file) {
  chrome.runtime.sendMessage({
    type: 'DISPLAY_FILE',
    file
  });
}

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  log('Message received:', message, sender);

  if (message.type === 'NEW_SNIPPETS') {
    handleNewSnippets(message.snippets, message.isDebug);
  }
  if (message.type === 'SYNC') {
    log('Received sync request from options page.');
    handleSyncRequest();
    sendResponse({ status: 'received' });
  }
});

// Function to handle new snippets
function handleNewSnippets(snippets) {
  log(`Handling ${snippets.length} new snippets.`);

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

// Function to handle sync request
function handleSyncRequest() {
  chrome.storage.sync.get(['destination'], (data) => {
    const { destination } = data;

    if (!destination) {
      log('Destination not set.');
      return;
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      // send sync request to server with destination
      socket.send(JSON.stringify({ type: 'SYNC', destination }));
    } else {
      log('WebSocket is not connected. Cannot send message.');
    }
  });
}

// Function to process individual snippet
function processSnippet(snippet, destination) {
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
    id: snippet.id
  };

  // Send message to options page to display the snippet
  chrome.runtime.sendMessage({
    type: 'DISPLAY_SNIPPET',
    snippet: {
      id: snippet.id,
      content: codeContent
    }
  });
  log(`Sending snippet ID ${snippet.id} to WebSocket server.`);
  
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    log('WebSocket is not connected. Cannot send message.');
  }
}

// Function to send status updates to connected ports
function sendStatusUpdate() {
  const status = {
    tab: connectedPorts.length > 0 ? 'connected' : 'disconnected',
    background: 'active', // Assuming background is always active if this script is running
    websocket: wsStatus
  };
  connectedPorts.forEach(port => {
    port.postMessage({ type: 'STATUS_UPDATE', status });
  });
}

// Listener for connections from the options page
chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'options') {
    connectedPorts.push(port);
    log('Options page connected.');
    sendStatusUpdate();

    port.onDisconnect.addListener(() => {
      connectedPorts = connectedPorts.filter(p => p !== port);
      log('Options page disconnected.');
      sendStatusUpdate();
    });
  }
});

// Initialize the WebSocket connection when the service worker starts
initWebSocket();
