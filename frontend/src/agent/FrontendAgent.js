/**
 * FrontendAgent
 * -------------
 * The Frontend Agent mediates between the human user and the Backend Agent.
 * It is responsible for:
 *  1. Sending the initial task to the Backend Agent via the REST API.
 *  2. Forwarding user replies (clarifications) to the Backend Agent.
 *  3. Receiving backend responses and routing them to the UI.
 *
 * All state (session id, conversation step) lives here so the React
 * components stay as pure presentation layers.
 */

const API_BASE = '/api';

export class FrontendAgent {
  constructor({ onMessage, onError, onStateChange, onBackendStateChange }) {
    this.sessionId = null;
    this.state = 'idle'; // idle | active | done | error
    this.onMessage = onMessage;                       // (msg: MessageEntry) => void
    this.onError = onError;                           // (err: string) => void
    this.onStateChange = onStateChange;               // (state: string) => void
    this.onBackendStateChange = onBackendStateChange; // (backendState: string) => void
  }

  // ----------------------------------------------------------------
  // Public methods called by the UI
  // ----------------------------------------------------------------

  /** Start a brand-new conversation with the given task string. */
  async startTask(task) {
    this._setState('active');
    this._emit({ sender: 'user', text: task });
    this._emit({ sender: 'frontend-agent', text: `Sending task to Backend Agent: "${task}"` });

    try {
      const data = await this._post(`${API_BASE}/session/start`, { task });
      this.sessionId = data.session_id;
      this.onBackendStateChange?.(data.state);
      this._emit({ sender: 'backend-agent', text: data.message });

      if (data.state === 'done') {
        this._handleDone(data.final_output);
      }
    } catch (err) {
      this._handleError(err.message);
    }
  }

  /** Send a clarification answer while a session is active. */
  async sendReply(message) {
    if (!this.sessionId) {
      this._handleError('No active session. Please start a new task first.');
      return;
    }

    this._emit({ sender: 'user', text: message });
    this._emit({ sender: 'frontend-agent', text: `Forwarding to Backend Agent: "${message}"` });

    try {
      const data = await this._post(
        `${API_BASE}/session/${this.sessionId}/respond`,
        { message }
      );
      this.onBackendStateChange?.(data.state);
      this._emit({ sender: 'backend-agent', text: data.message });

      if (data.state === 'done' && data.final_output) {
        this._handleDone(data.final_output);
      }
    } catch (err) {
      this._handleError(err.message);
    }
  }

  /** Reset and allow starting a new task. */
  reset() {
    this.sessionId = null;
    this._setState('idle');
  }

  // ----------------------------------------------------------------
  // Private helpers
  // ----------------------------------------------------------------

  async _post(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }

  _handleDone(finalOutput) {
    this._setState('done');
    this._emit({ sender: 'frontend-agent', text: 'Backend Agent has finished. Displaying final output.' });
    this._emit({ sender: 'output', text: finalOutput });
  }

  _handleError(msg) {
    this._setState('error');
    this.onError?.(msg);
  }

  _emit(msg) {
    this.onMessage?.({ ...msg, id: crypto.randomUUID(), timestamp: Date.now() });
  }

  _setState(s) {
    this.state = s;
    this.onStateChange?.(s);
  }
}
