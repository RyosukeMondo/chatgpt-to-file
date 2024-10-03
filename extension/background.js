// background.js

// Utility function for logging
function log(message, ...optionalParams) {
  console.log(`[Background] ${message}`, ...optionalParams);
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
  chrome.storage.sync.get(['receiverPath', 'destination'], (data) => {
    const { receiverPath, destination } = data;

    if (!receiverPath || !destination) {
      log('Receiver path or destination not set.');
      return;
    }

    snippets.forEach(snippet => {
      processSnippet(snippet, receiverPath, destination);
    });
  });
}

// Function to process individual snippet
function processSnippet(snippet, receiverPath, destination) {
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

  const nativeMessage = {
    filePath: fullPath,
    content: codeContent,
    id: snippet.id
  };

  log(`Sending snippet ID ${snippet.id} to native receiver.`);

  sendNativeMessage(nativeMessage, (response) => {
    if (response && response.status === 'success') {
      log(`Snippet ID ${snippet.id} saved to ${response.savedPath}`);
      
      // Send message to options page to display the snippet
      chrome.runtime.sendMessage({
        type: 'DISPLAY_SNIPPET',
        snippet: {
          id: snippet.id,
          content: codeContent
        }
      });
    } else {
      log(`Failed to save snippet ID ${snippet.id}:`, response ? response.message : 'No response');
    }
  });
}

// Function to send messages to the native application
function sendNativeMessage(message, callback) {
  const hostName = "com.yourdomain.chatgpt_code_capture";

  chrome.runtime.sendNativeMessage(hostName, message, (response) => {
    if (chrome.runtime.lastError) {
      log('Native message send error:', chrome.runtime.lastError.message);
      callback({ status: 'error', message: chrome.runtime.lastError.message });
    } else {
      log('Native message send success:', response);
      callback(response);
    }
  });
}
