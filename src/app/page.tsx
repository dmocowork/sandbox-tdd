"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <p data-testid="counter-value">Compteur : {count}</p>
        <div className={styles.ctas}>
          <button
            className={styles.primary}
            onClick={() => setCount((c) => c + 1)}
          >
            +1
          </button>
          <button
            className={styles.secondary}
            onClick={() => setCount((c) => Math.max(0, c - 1))}
          >
            -1
          </button>
        </div>
      </main>
    </div>
  );
}
