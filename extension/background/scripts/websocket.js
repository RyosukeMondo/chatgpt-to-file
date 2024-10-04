// background/scripts/websocket.js

import { log, normalizePath } from './utils.js';
import { Messaging } from './messaging.js';
import { Handler } from '../modules/handler.js';

export class WebSocketManager {
  constructor(url, onStatusChange) {
    this.wsUrl = url;
    this.socket = null;
    this.wsStatus = 'disconnected'; // 'connected', 'connecting', 'disconnected'
    this.onStatusChange = onStatusChange;
    this.reconnectInterval = 5000; // 5 seconds
    this.initWebSocket();
  }

  initWebSocket() {
    this.wsStatus = 'connecting';
    this.updateStatus();

    this.socket = new WebSocket(this.wsUrl);

    this.socket.onopen = () => {
      this.wsStatus = 'connected';
      log('WebSocket connection established.');
      this.updateStatus();
    };

    this.socket.onmessage = (event) => {
      log('Message received from server:', event.data);
      try {
        const response = JSON.parse(event.data);
        Handler.handleServerResponse(response);
      } catch (error) {
        log('Error parsing server response:', error);
      }
    };

    this.socket.onerror = (error) => {
      this.wsStatus = 'disconnected';
      log('WebSocket error:', error);
      this.updateStatus();
    };

    this.socket.onclose = (event) => {
      this.wsStatus = 'disconnected';
      log(`WebSocket connection closed: Code ${event.code}, Reason: ${event.reason}`);
      this.updateStatus();
      // Attempt to reconnect after a delay
      setTimeout(() => this.initWebSocket(), this.reconnectInterval);
    };
  }

  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      log('Sent message to WebSocket server:', message);
    } else {
      log('WebSocket is not connected. Cannot send message:', message);
    }
  }

  updateStatus() {
    if (this.onStatusChange) {
      const status = {
        websocket: this.wsStatus,
      };
      this.onStatusChange(status);
    }
  }
}
