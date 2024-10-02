chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NEW_SNIPPETS') {
    // Retrieve user settings
    chrome.storage.sync.get(['receiverPath', 'destination'], (data) => {
      const { receiverPath, destination } = data;
      if (!receiverPath || !destination) {
        console.error('Receiver path or destination not set.');
        return;
      }

      message.snippets.forEach(snippet => {
        const lines = snippet.content.split('\n');
        const filePathComment = lines[0];
        const filePathMatch = filePathComment.match(/\/\/\s*(.+)/);
        if (filePathMatch) {
          const relativePath = filePathMatch[1].trim();
          const fullPath = `${destination}\\${relativePath}`;
          const codeContent = lines.slice(1).join('\n');

          // Prepare message for native app
          const nativeMessage = {
            filePath: fullPath,
            content: codeContent,
            id: snippet.id
          };

          // Send message via native messaging
          sendNativeMessage(receiverPath, nativeMessage);
        }
      });
    });
  }
});

// Function to send messages to the native application
function sendNativeMessage(receiverPath, message) {
  // The native messaging host name must match the one defined in the manifest
  // For simplicity, assume the host name is "chatgpt_code_capture_host"
  // You need to set up the native messaging manifest accordingly
  const hostName = "com.yourdomain.chatgpt_code_capture";

  chrome.runtime.sendNativeMessage(hostName, message, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending native message:', chrome.runtime.lastError.message);
    } else {
      console.log('Received response from native app:', response);
    }
  });
}
