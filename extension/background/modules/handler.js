// background/modules/handler.js

import { log, normalizePath } from '../scripts/utils.js';
import { Messaging } from '../scripts/messaging.js';

export const Handler = {
  handleServerResponse(response) {
    if (response.type === 'FILE_CONTENT') {
      log(`Received file content for path: ${response.filePath}`);
      Messaging.sendMessageToOptions({
        type: 'DISPLAY_FILE',
        filePath: response.filePath,
        content: response.content,
      });
    } else if (response.status === 'success') {
      log(`Snippet ID ${response.id} saved to ${response.savedPath}`);
    } else if (response.status === 'error') {
      log(`Failed to save snippet ID ${response.id}: ${response.message}`);
    }
  },
};
