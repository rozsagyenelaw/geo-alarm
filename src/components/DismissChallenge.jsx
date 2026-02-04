import { useState, useEffect, useCallback } from 'react';

// Generate a simple math problem
function generateMathProblem() {
  const operations = ['+', '-', '*'];
  const op = operations[Math.floor(Math.random() * operations.length)];

  let a, b, answer;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 50) + 10;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 50) + 30;
      b = Math.floor(Math.random() * 30) + 1;
      answer = a - b;
      break;
    case '*':
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      answer = a * b;
      break;
    default:
      a = 5;
      b = 5;
      answer = 10;
  }

  return {
    question: `${a} ${op} ${b} = ?`,
    answer: answer.toString()
  };
}

// Generate a random phrase to type
function generatePhrase() {
  const phrases = [
    'I am awake now',
    'Time to get up',
    'Almost there',
    'Wake up now',
    'Stay alert'
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// Shake detection threshold
const SHAKE_THRESHOLD = 25;
const SHAKE_COUNT_REQUIRED = 5;

export default function DismissChallenge({
  difficulty,
  onComplete,
  onCancel
}) {
  const [mathProblem, setMathProblem] = useState(null);
  const [phrase, setPhrase] = useState('');
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);

  // Initialize challenge based on difficulty
  useEffect(() => {
    if (difficulty === 'medium') {
      setMathProblem(generateMathProblem());
    } else if (difficulty === 'hard') {
      setPhrase(generatePhrase());
    }
  }, [difficulty]);

  // Shake detection
  useEffect(() => {
    if (difficulty !== 'shake') return;

    let lastX = 0, lastY = 0, lastZ = 0;
    let lastTime = Date.now();

    const handleMotion = (event) => {
      const { accelerationIncludingGravity } = event;
      if (!accelerationIncludingGravity) return;

      const { x, y, z } = accelerationIncludingGravity;
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTime;

      if (timeDiff > 100) {
        const deltaX = Math.abs(x - lastX);
        const deltaY = Math.abs(y - lastY);
        const deltaZ = Math.abs(z - lastZ);

        if (deltaX + deltaY + deltaZ > SHAKE_THRESHOLD) {
          setShakeCount(prev => {
            const newCount = prev + 1;
            if (newCount >= SHAKE_COUNT_REQUIRED) {
              onComplete();
            }
            return newCount;
          });
        }

        lastX = x;
        lastY = y;
        lastZ = z;
        lastTime = currentTime;
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [difficulty, onComplete]);

  const handleSubmit = useCallback((e) => {
    e?.preventDefault();

    if (difficulty === 'medium' && mathProblem) {
      if (userInput.trim() === mathProblem.answer) {
        onComplete();
      } else {
        setError(true);
        setUserInput('');
        setTimeout(() => setError(false), 500);
      }
    } else if (difficulty === 'hard') {
      if (userInput.toLowerCase().trim() === phrase.toLowerCase()) {
        onComplete();
      } else {
        setError(true);
        setTimeout(() => setError(false), 500);
      }
    }
  }, [difficulty, mathProblem, phrase, userInput, onComplete]);

  return (
    <div className="w-full max-w-sm">
      <div className={`bg-dark-surface rounded-xl p-6 ${error ? 'shake' : ''}`}>
        {difficulty === 'medium' && mathProblem && (
          <>
            <h2 className="text-xl font-bold text-center mb-6">
              Solve to dismiss
            </h2>
            <p className="text-4xl font-mono text-center mb-6 text-primary">
              {mathProblem.question}
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="number"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className={`
                  w-full bg-dark-bg border-2 rounded-xl px-4 py-3 text-center text-2xl
                  focus:outline-none transition-colors
                  ${error ? 'border-danger' : 'border-dark-border focus:border-primary'}
                `}
                placeholder="Answer"
                autoFocus
              />
              <button
                type="submit"
                className="w-full mt-4 py-3 bg-success hover:bg-success/80 rounded-xl font-bold transition-all"
              >
                Submit
              </button>
            </form>
          </>
        )}

        {difficulty === 'hard' && (
          <>
            <h2 className="text-xl font-bold text-center mb-4">
              Type to dismiss
            </h2>
            <p className="text-lg text-center mb-4 text-gray-400">
              Type this phrase:
            </p>
            <p className="text-2xl font-medium text-center mb-6 text-primary">
              "{phrase}"
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className={`
                  w-full bg-dark-bg border-2 rounded-xl px-4 py-3 text-center text-lg
                  focus:outline-none transition-colors
                  ${error ? 'border-danger' : 'border-dark-border focus:border-primary'}
                `}
                placeholder="Type the phrase"
                autoFocus
              />
              <button
                type="submit"
                className="w-full mt-4 py-3 bg-success hover:bg-success/80 rounded-xl font-bold transition-all"
              >
                Submit
              </button>
            </form>
          </>
        )}

        {difficulty === 'shake' && (
          <>
            <h2 className="text-xl font-bold text-center mb-6">
              Shake to dismiss
            </h2>
            <div className="flex justify-center mb-6">
              <svg
                className="w-20 h-20 text-primary animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex justify-center gap-2 mb-4">
              {[...Array(SHAKE_COUNT_REQUIRED)].map((_, i) => (
                <div
                  key={i}
                  className={`
                    w-4 h-4 rounded-full transition-colors
                    ${i < shakeCount ? 'bg-success' : 'bg-dark-border'}
                  `}
                />
              ))}
            </div>
            <p className="text-center text-gray-400">
              Shake your phone vigorously
            </p>
          </>
        )}

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Go back
        </button>
      </div>
    </div>
  );
}
