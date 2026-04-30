import React from "react"

import styles from "./styles/typing-indicator.module.css"

const TypingIndicator = () => {
  return (
    <div className={styles.message}>
      <span className={styles.messageRole}>void</span>
      <div className={styles.typingIndicator}>
        <div className={styles.typingDot}></div>
        <div className={styles.typingDot}></div>
        <div className={styles.typingDot}></div>
      </div>
    </div>
  )
}

export default TypingIndicator
