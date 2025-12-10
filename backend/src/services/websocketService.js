/**
 * WebSocket Service
 * Provides real-time updates for test run execution
 */

const WebSocket = require('ws');
const logger = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of client connections by user ID
    this.testRunSubscriptions = new Map(); // Map of test run ID to Set of client IDs
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      
      logger.info('WebSocket client connected', { clientId });

      // Store client connection
      this.clients.set(clientId, {
        ws,
        userId: null,
        subscriptions: new Set()
      });

      // Handle messages from client
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(clientId, data);
        } catch (error) {
          logger.error('Error parsing WebSocket message', { error: error.message });
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.handleClientDisconnect(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error', { clientId, error: error.message });
      });

      // Send connection acknowledgment
      this.sendToClient(clientId, {
        type: 'connected',
        clientId
      });
    });

    logger.info('WebSocket server initialized');
  }

  /**
   * Handle messages from client
   */
  handleClientMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (data.type) {
      case 'auth':
        // Authenticate client
        client.userId = data.userId;
        logger.info('WebSocket client authenticated', { clientId, userId: data.userId });
        break;

      case 'subscribe':
        // Subscribe to test run updates
        const testRunId = data.testRunId;
        if (testRunId) {
          client.subscriptions.add(testRunId);
          
          if (!this.testRunSubscriptions.has(testRunId)) {
            this.testRunSubscriptions.set(testRunId, new Set());
          }
          this.testRunSubscriptions.get(testRunId).add(clientId);
          
          logger.info('Client subscribed to test run', { clientId, testRunId });
        }
        break;

      case 'unsubscribe':
        // Unsubscribe from test run updates
        const unsubTestRunId = data.testRunId;
        if (unsubTestRunId) {
          client.subscriptions.delete(unsubTestRunId);
          
          const subscribers = this.testRunSubscriptions.get(unsubTestRunId);
          if (subscribers) {
            subscribers.delete(clientId);
            if (subscribers.size === 0) {
              this.testRunSubscriptions.delete(unsubTestRunId);
            }
          }
          
          logger.info('Client unsubscribed from test run', { clientId, testRunId: unsubTestRunId });
        }
        break;

      default:
        logger.warn('Unknown WebSocket message type', { type: data.type });
    }
  }

  /**
   * Handle client disconnect
   */
  handleClientDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all test run subscriptions
    client.subscriptions.forEach(testRunId => {
      const subscribers = this.testRunSubscriptions.get(testRunId);
      if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
          this.testRunSubscriptions.delete(testRunId);
        }
      }
    });

    // Remove client
    this.clients.delete(clientId);
    
    logger.info('WebSocket client disconnected', { clientId });
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Broadcast test run update to all subscribed clients
   */
  broadcastTestRunUpdate(testRunId, update) {
    const subscribers = this.testRunSubscriptions.get(testRunId);
    if (!subscribers || subscribers.size === 0) return;

    const message = JSON.stringify({
      type: 'testRunUpdate',
      testRunId,
      data: update
    });

    subscribers.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });

    logger.debug('Broadcasted test run update', { 
      testRunId, 
      subscriberCount: subscribers.size 
    });
  }

  /**
   * Broadcast query execution update
   */
  broadcastQueryExecution(testRunId, execution) {
    this.broadcastTestRunUpdate(testRunId, {
      type: 'queryExecution',
      execution
    });
  }

  /**
   * Broadcast test run status change
   */
  broadcastStatusChange(testRunId, status, summary) {
    this.broadcastTestRunUpdate(testRunId, {
      type: 'statusChange',
      status,
      summary
    });
  }

  /**
   * Broadcast test run progress
   */
  broadcastProgress(testRunId, progress) {
    this.broadcastTestRunUpdate(testRunId, {
      type: 'progress',
      progress
    });
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalClients: this.clients.size,
      authenticatedClients: Array.from(this.clients.values()).filter(c => c.userId).length,
      activeSubscriptions: this.testRunSubscriptions.size
    };
  }
}

// Singleton instance
const websocketService = new WebSocketService();

module.exports = websocketService;