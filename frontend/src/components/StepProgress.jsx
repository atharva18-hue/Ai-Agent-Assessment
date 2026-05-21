import React from 'react';
import styles from './StepProgress.module.css';

const STEPS = [
  { key: 'awaiting_task',   label: 'Task',   desc: 'Describe what to create' },
  { key: 'awaiting_tone',   label: 'Tone',   desc: 'Formal or casual?' },
  { key: 'awaiting_length', label: 'Length', desc: 'Short, medium or long?' },
  { key: 'done',            label: 'Output', desc: 'Content generated' },
];

const STATE_TO_STEP = {
  awaiting_task:   0,
  awaiting_tone:   1,
  awaiting_length: 2,
  done:            3,
};

export default function StepProgress({ backendState }) {
  const current = STATE_TO_STEP[backendState] ?? 0;

  return (
    <div className={styles.wrapper}>
      {STEPS.map((step, idx) => {
        const status = idx < current ? 'done' : idx === current ? 'active' : 'pending';
        return (
          <React.Fragment key={step.key}>
            <div className={`${styles.step} ${styles[status]}`}>
              <div className={styles.circle}>
                {status === 'done' ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <div className={styles.info}>
                <span className={styles.label}>{step.label}</span>
                <span className={styles.desc}>{step.desc}</span>
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`${styles.connector} ${idx < current ? styles.connectorDone : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
