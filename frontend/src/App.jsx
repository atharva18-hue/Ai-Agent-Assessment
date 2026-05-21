import React, { useState, useCallback, useRef, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import StepProgress from './components/StepProgress';
import { FrontendAgent } from './agent/FrontendAgent';
import styles from './App.module.css';

// Quick-reply chips shown to the user during clarification steps
const QUICK_REPLIES = {
  awaiting_tone:   ['Formal', 'Casual'],
  awaiting_length: ['Short', 'Medium', 'Long'],
};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [agentState, setAgentState] = useState('idle');  // idle | active | done | error
  const [isLoading, setIsLoading]   = useState(false);
  const [backendState, setBackendState] = useState('awaiting_task');
  const [error, setError]   = useState(null);

  const inputRef = useRef(null);
  const agentRef = useRef(null);

  // Initialise the Frontend Agent once
  useEffect(() => {
    agentRef.current = new FrontendAgent({
      onMessage: (msg) => {
        setMessages((prev) => [...prev, msg]);
        // Clear the spinner only when the backend has actually responded
        if (msg.sender === 'backend-agent' || msg.sender === 'output') {
          setIsLoading(false);
        }
      },
      onBackendStateChange: (state) => {
        setBackendState(state);
      },
      onError: (err) => {
        setError(err);
        setIsLoading(false);
      },
      onStateChange: (s) => {
        setAgentState(s);
        if (s === 'active') setIsLoading(true);
      },
    });
  }, []);

  const handleSend = useCallback(async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setError(null);
    setIsLoading(true);

    if (agentRef.current.state === 'idle' || agentRef.current.state === 'done') {
      setBackendState('awaiting_task');
      await agentRef.current.startTask(trimmed);
    } else {
      await agentRef.current.sendReply(trimmed);
    }

    inputRef.current?.focus();
  }, [input, isLoading]);

  const handleReset = () => {
    agentRef.current.reset();
    setMessages([]);
    setInput('');
    setError(null);
    setAgentState('idle');
    setBackendState('awaiting_task');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const chips = QUICK_REPLIES[backendState] ?? [];
  const isDone = agentState === 'done';

  const placeholder =
    agentState === 'idle'
      ? 'Describe what you want to create…'
      : isDone
      ? 'Start a new task…'
      : 'Type your response…';

  return (
    <div className={styles.layout}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span className={styles.logoDot} />
            <span className={styles.logoDot} />
          </div>
          <div>
            <h1 className={styles.title}>AI Agent System</h1>
            <p className={styles.subtitle}>Frontend Agent ↔ Backend Agent</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={`${styles.statusBadge} ${styles[agentState]}`}>
            {agentState === 'idle'  && 'Idle'}
            {agentState === 'active' && 'Processing'}
            {agentState === 'done'  && 'Complete'}
            {agentState === 'error' && 'Error'}
          </div>
          {messages.length > 0 && (
            <button className={styles.resetBtn} onClick={handleReset}>
              New Task
            </button>
          )}
        </div>
      </header>

      {/* Step progress */}
      <StepProgress backendState={backendState} />

      {/* Chat */}
      <main className={styles.main}>
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          onExampleClick={(text) => {
            setInput(text);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        />
      </main>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Quick-reply chips */}
      {chips.length > 0 && !isLoading && !isDone && (
        <div className={styles.chips}>
          {chips.map((c) => (
            <button
              key={c}
              className={styles.chip}
              onClick={() => handleSend(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <footer className={styles.footer}>
        <div className={styles.inputRow}>
          <textarea
            ref={inputRef}
            className={styles.textarea}
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <button
            className={styles.sendBtn}
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            Send
          </button>
        </div>
        <p className={styles.hint}>Press Enter to send · Shift+Enter for new line</p>
      </footer>
    </div>
  );
}
