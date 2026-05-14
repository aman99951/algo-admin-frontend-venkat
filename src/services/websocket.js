/**
 * WebSocket Service
 * Manages real-time WebSocket connection
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.clientId = this.generateClientId();
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.connectionListeners = new Set();
  }

  onConnectionChange(callback) {
    this.connectionListeners.add(callback);
    // Immediately notify current state
    callback(this.ws?.readyState === WebSocket.OPEN);
    return () => this.connectionListeners.delete(callback);
  }

  notifyConnectionChange(isConnected) {
    this.connectionListeners.forEach(listener => listener(isConnected));
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  connect(sessionId = null) {
    return new Promise((resolve, reject) => {
      // Set a timeout for the connection
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          console.error('WebSocket connection timeout');
          this.ws.close();
          this.notifyConnectionChange(false);
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000); // 10 second timeout

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/${this.clientId}`;
        
        console.log(`Attempting WebSocket connection to: ${wsUrl}`);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          clearTimeout(connectionTimeout);
          this.reconnectAttempts = 0;
          this.notifyConnectionChange(true);
          
          // Authenticate if session_id provided
          if (sessionId) {
            this.authenticate(sessionId);
          }
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          clearTimeout(connectionTimeout);
          this.notifyConnectionChange(false);
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          clearTimeout(connectionTimeout);
          this.notifyConnectionChange(false);
          reject(error);
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        clearTimeout(connectionTimeout);
        this.notifyConnectionChange(false);
        reject(error);
      }
    });
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      
      setTimeout(() => {
        const storedSessionId = localStorage.getItem('session_id');
        if (storedSessionId) {
          this.connect(storedSessionId);
        }
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts');
    }
  }

  handleMessage(message) {
    const { type, data } = message;
    
    // Emit to specific listeners
    this.emit(type, data);
    
    // Also emit to 'all' listener
    this.emit('all', message);
  }

  authenticate(sessionId) {
    this.send({
      type: 'authenticate',
      session_id: sessionId,
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  subscribe(channels) {
    this.send({
      type: 'subscribe',
      channels,
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
export default wsService;
