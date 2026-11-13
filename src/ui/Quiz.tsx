import { useState } from 'react';
import { quizzes, type QuizModule } from '@/content/quizzes';
import { ui } from '@/content/ui';
import { useEscape } from './hooks';

const Q = ui.quiz;

export function Quiz({ module }: { module: QuizModule }) {
  const quiz = quizzes[module];
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= quiz.questions.length;
  if (done)
    return (
      <div className="grid gap-3 text-center">
        <p className="label">{Q.score}</p>
        <p className="text-4xl font-extrabold text-accent">
          {score} / {quiz.questions.length}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            setI(0);
            setScore(0);
            setPicked(null);
          }}
        >
          {Q.retry}
        </button>
      </div>
    );
  const q = quiz.questions[i];
  const answered = picked !== null;
  return (
    <div className="grid gap-3">
      <p className="label">
        {Q.question} {i + 1} / {quiz.questions.length}
      </p>
      <p className="text-base font-bold">{q.question}</p>
      <div role="radiogroup" aria-label={q.question} className="grid gap-1.5">
        {q.options.map((o, k) => {
          const state = !answered ? '' : k === q.answer ? 'border-ok bg-ok/15' : k === picked ? 'border-bad bg-bad/15' : 'opacity-60';
          return (
            <button
              key={k}
              role="radio"
              aria-checked={picked === k}
              disabled={answered}
              className={`min-h-11 rounded-xl border border-line px-3 py-2 text-left text-sm font-semibold hover:bg-panel2 disabled:cursor-default ${state}`}
              onClick={() => {
                setPicked(k);
                if (k === q.answer) setScore((s) => s + 1);
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
      {answered && (
        <div role="status" className="rounded-xl bg-panel2 p-3 text-sm">
          <b className={picked === q.answer ? 'text-ok' : 'text-bad'}>{picked === q.answer ? Q.correct : Q.wrong}</b> {q.explanation}
        </div>
      )}
      <button
        className="btn btn-primary"
        disabled={!answered}
        onClick={() => {
          setI(i + 1);
          setPicked(null);
        }}
      >
        {i === quiz.questions.length - 1 ? Q.finish : ui.common.next}
      </button>
    </div>
  );
}

/** Button that opens the module quiz in a dialog. */
export function QuizButton({ module, className = 'btn btn-sm' }: { module: QuizModule; className?: string }) {
  const [open, setOpen] = useState(false);
  useEscape(() => setOpen(false), open);
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        <span aria-hidden>✎</span> {Q.open}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-3" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal aria-label={quizzes[module].title} className="glass w-full max-w-md p-4 text-ink" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="font-extrabold">{quizzes[module].title}</h2>
              <button className="btn btn-sm" onClick={() => setOpen(false)} aria-label={ui.common.close}>
                ✕
              </button>
            </div>
            <Quiz module={module} />
          </div>
        </div>
      )}
    </>
  );
}
