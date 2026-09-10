"use client";

import { useState } from "react";
import styles from "./judo.module.css";
import {
  EXTRA_WORDS,
  FALL_WORDS,
  FALLS,
  QUESTIONS,
  THROWS,
  type Vocab,
} from "./data";

type TabId = "prises" | "chutes" | "quiz";

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: "prises", label: "Prises", hint: "Les 3 techniques" },
  { id: "chutes", label: "Chutes", hint: "Le vocabulaire des ukemi" },
  { id: "quiz", label: "Quiz", hint: "6 questions pour réviser" },
];

export default function JudoApp() {
  const [tab, setTab] = useState<TabId>("prises");

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <p className={styles.kicker} lang="ja">
          柔道
        </p>
        <h1 className={styles.title}>Mes 3 premières prises</h1>
        <p className={styles.subtitle}>…et le vocabulaire des 3 chutes.</p>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-controls={`panel-${t.id}`}
            aria-selected={tab === t.id}
            className={tab === t.id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className={styles.tabHint}>{TABS.find((t) => t.id === tab)?.hint}</p>

      {tab === "prises" ? <ThrowsPanel /> : null}
      {tab === "chutes" ? <FallsPanel /> : null}
      {tab === "quiz" ? <QuizPanel /> : null}

      <footer className={styles.footer}>
        <p>
          Descriptions écrites pour un droitier : inverse gauche et droite si tu attaques
          à gauche.
        </p>
        <p>
          Chaque club a sa progression : demande confirmation à ton professeur avant de
          réviser pour un passage de grade.
        </p>
      </footer>
    </div>
  );
}

function ThrowsPanel() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section
      role="tabpanel"
      id="panel-prises"
      aria-labelledby="tab-prises"
      className={styles.panel}
    >
      <ul className={styles.list} data-testid="throw-list">
        {THROWS.map((t, i) => {
          const isOpen = openId === t.id;
          return (
            <li key={t.id} className={styles.card}>
              <button
                type="button"
                className={styles.cardHead}
                data-testid={`throw-toggle-${t.id}`}
                aria-expanded={isOpen}
                aria-controls={`throw-detail-${t.id}`}
                onClick={() => setOpenId(isOpen ? null : t.id)}
              >
                <span className={styles.rank} aria-hidden="true">
                  {i + 1}
                </span>
                <span className={styles.cardTitles}>
                  <span className={styles.cardName}>{t.name}</span>
                  <span className={styles.cardSub}>{t.translation}</span>
                </span>
                <span className={styles.chevron} aria-hidden="true">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen ? (
                <div
                  className={styles.detail}
                  id={`throw-detail-${t.id}`}
                  data-testid={`throw-detail-${t.id}`}
                >
                  <p className={styles.meaning}>
                    <span className={styles.kanji} lang="ja">
                      {t.kanji}
                    </span>{" "}
                    « {t.translation} »
                  </p>
                  <p className={styles.say}>
                    Se prononce « {t.say} » · {t.family}
                  </p>

                  <ol className={styles.phases}>
                    {t.phases.map((p) => (
                      <li key={p.label} className={styles.phase}>
                        <span className={styles.phaseLabel}>{p.label}</span>
                        <span className={styles.phaseGloss}>{p.gloss}</span>
                        <span className={styles.phaseText}>{p.text}</span>
                      </li>
                    ))}
                  </ol>

                  <p className={styles.safety}>
                    <span aria-hidden="true">⚠️ </span>
                    {t.safety}
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className={styles.note}>Touche une prise pour voir ses 3 temps.</p>
    </section>
  );
}

function FallsPanel() {
  return (
    <section
      role="tabpanel"
      id="panel-chutes"
      aria-labelledby="tab-chutes"
      className={styles.panel}
    >
      <ul className={styles.list} data-testid="fall-list">
        {FALLS.map((f) => (
          <li key={f.id} className={styles.card}>
            <div className={styles.fallHead}>
              <span className={styles.cardName}>{f.name}</span>
              <span className={styles.cardSub}>{f.translation}</span>
            </div>
            <div className={styles.detail}>
              <p className={styles.meaning}>
                <span className={styles.kanji} lang="ja">
                  {f.kanji}
                </span>{" "}
                {f.literal}
              </p>
              <p className={styles.say}>Se prononce « {f.say} »</p>
              <ul className={styles.keys}>
                {f.keys.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      <div className={styles.vocab} data-testid="vocab">
        <h2 className={styles.vocabTitle}>Les mots des chutes</h2>
        <VocabList words={FALL_WORDS} />
        <h2 className={styles.vocabTitle}>Bon à savoir sur le tatami</h2>
        <VocabList words={EXTRA_WORDS} />
      </div>
    </section>
  );
}

function VocabList({ words }: { words: Vocab[] }) {
  return (
    <dl className={styles.vocabList}>
      {words.map((w) => (
        <div key={w.word} className={styles.vocabRow}>
          <dt className={styles.vocabWord}>
            {w.word}{" "}
            <span className={styles.kanji} lang="ja">
              {w.kanji}
            </span>
          </dt>
          <dd className={styles.vocabMeaning}>{w.meaning}</dd>
        </div>
      ))}
    </dl>
  );
}

function QuizPanel() {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const total = QUESTIONS.length;
  const question = QUESTIONS[index];
  const isLast = index === total - 1;

  function pick(option: string) {
    if (picked !== null) return;
    setPicked(option);
    if (option === question.answer) setScore((s) => s + 1);
  }

  function restart() {
    setIndex(0);
    setScore(0);
    setPicked(null);
    setFinished(false);
  }

  return (
    <section
      role="tabpanel"
      id="panel-quiz"
      aria-labelledby="tab-quiz"
      className={styles.panel}
    >
      <div className={styles.scoreBar}>
        <span className={styles.progress}>
          Question {Math.min(index + 1, total)} / {total}
        </span>
        <span className={styles.score} data-testid="quiz-score">
          Score : {score} / {total}
        </span>
      </div>

      {finished ? (
        <div className={styles.card}>
          <div className={styles.detail}>
            <p className={styles.result} data-testid="quiz-result">
              Score final : {score} / {total}
            </p>
            <p className={styles.note}>
              {score === total
                ? "Sans faute — tu peux passer au tatami."
                : "Relis les fiches, puis retente : c'est comme les ukemi, ça s'apprend en répétant."}
            </p>
            <button type="button" className={styles.primaryButton} onClick={restart}>
              Recommencer
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.detail}>
            <p className={styles.question} data-testid="quiz-question">
              {question.prompt}
            </p>

            <div className={styles.options}>
              {question.options.map((option) => {
                const isAnswer = option === question.answer;
                const isPicked = option === picked;
                let className = styles.option;
                if (picked !== null && isAnswer) className = `${styles.option} ${styles.optionRight}`;
                else if (isPicked) className = `${styles.option} ${styles.optionWrong}`;
                return (
                  <button
                    key={option}
                    type="button"
                    className={className}
                    disabled={picked !== null}
                    onClick={() => pick(option)}
                  >
                    {option}
                    {picked !== null && isAnswer ? (
                      <span aria-hidden="true"> ✓</span>
                    ) : null}
                    {isPicked && !isAnswer ? <span aria-hidden="true"> ✗</span> : null}
                  </button>
                );
              })}
            </div>

            {picked !== null ? (
              <>
                <p
                  className={
                    picked === question.answer
                      ? `${styles.feedback} ${styles.feedbackRight}`
                      : `${styles.feedback} ${styles.feedbackWrong}`
                  }
                  data-testid="quiz-feedback"
                  role="status"
                >
                  {picked === question.answer
                    ? "Exact ! Bien vu."
                    : `Raté — la bonne réponse était ${question.answer}.`}
                </p>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    if (isLast) {
                      setFinished(true);
                      return;
                    }
                    setIndex((i) => i + 1);
                    setPicked(null);
                  }}
                >
                  {isLast ? "Voir mon score" : "Question suivante"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
