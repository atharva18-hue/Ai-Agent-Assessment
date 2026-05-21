import React from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './MessageBubble.module.css';

const SENDER_META = {
  user: {
    label: 'You',
    className: 'user',
    avatar: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
      </svg>
    ),
  },
  'frontend-agent': {
    label: 'Frontend Agent',
    className: 'frontendAgent',
    avatar: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 3H4a2 2 0 00-2 2v11a2 2 0 002 2h3l-1 3h8l-1-3h3a2 2 0 002-2V5a2 2 0 00-2-2zm-9 12l-4-4 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6z"/>
      </svg>
    ),
  },
  'backend-agent': {
    label: 'Backend Agent',
    className: 'backendAgent',
    avatar: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 6h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2v2H4a2 2 0 00-2 2v4a2 2 0 002 2h1v4a2 2 0 002 2h10a2 2 0 002-2v-4h1a2 2 0 002-2V8a2 2 0 00-2-2zM7 4h10v2H7V4zm10 16H7v-6h10v6zm3-8H4V8h16v4z"/>
        <circle cx="18" cy="10" r="1"/>
      </svg>
    ),
  },
  output: {
    label: 'Generated Output',
    className: 'output',
    avatar: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 13h8v1.5H8V13zm0 3h8v1.5H8V16zm0-6h4v1.5H8V10z"/>
      </svg>
    ),
  },
};

export default function MessageBubble({ message }) {
  const meta = SENDER_META[message.sender] ?? { label: message.sender, className: 'default', avatar: null };
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`${styles.wrapper} ${styles[meta.className]}`}>
      <div className={styles.row}>
        {message.sender !== 'user' && (
          <div className={`${styles.avatar} ${styles['avatar_' + meta.className]}`}>
            {meta.avatar}
          </div>
        )}
        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.label}>{meta.label}</span>
            <span className={styles.time}>{time}</span>
          </div>
          <div className={styles.bubble}>
            {message.sender === 'output' ? (
              <div className={styles.outputContent}>
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            ) : (
              <div className={styles.text}>
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
        {message.sender === 'user' && (
          <div className={`${styles.avatar} ${styles.avatar_user}`}>
            {meta.avatar}
          </div>
        )}
      </div>
    </div>
  );
}
