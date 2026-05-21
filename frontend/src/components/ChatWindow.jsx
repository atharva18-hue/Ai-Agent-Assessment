import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import styles from './ChatWindow.module.css';

const EXAMPLES = [
  'Create a short blog about AI in hiring',
  'Write an article on the future of remote work',
  'Generate a report on electric vehicles',
  'Draft an essay on climate change',
];

export default function ChatWindow({ messages, isLoading, onExampleClick }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIconWrap}>
          <svg viewBox="0 0 48 48" fill="none" className={styles.emptyIcon}>
            <circle cx="24" cy="24" r="22" stroke="var(--border)" strokeWidth="2"/>
            <rect x="13" y="16" width="10" height="16" rx="3" fill="var(--frontend-border)" stroke="#818cf8" strokeWidth="1.5"/>
            <rect x="25" y="16" width="10" height="16" rx="3" fill="var(--backend-border)" stroke="#34d399" strokeWidth="1.5"/>
            <path d="M23 24h2" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <p className={styles.emptyTitle}>Frontend Agent ↔ Backend Agent</p>
        <p className={styles.emptyHint}>
          Type a task and watch the two agents collaborate to produce your content.
        </p>
        <div className={styles.examples}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              className={styles.exampleBtn}
              onClick={() => onExampleClick?.(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.messages}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className={styles.typing}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
