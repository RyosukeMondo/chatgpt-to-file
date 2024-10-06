import { WebSocketManager } from './websocket.js';
import { Messaging } from './messaging.js';

// Initialize Messaging
Messaging.init();

// Initialize WebSocket Manager and pass a callback to handle status updates
const wsManager = new WebSocketManager('ws://localhost:8765/', (status) => {
  Messaging.sendStatusUpdate(status);
});

// Link WebSocket Manager to Messaging for sending messages
Messaging.setWebSocketManager(wsManager);
