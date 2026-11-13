import React, { useEffect, useState } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxDurationMs?: number;
  className?: string;
  onComplete?: () => void;
}

const GLYPHS = '&*#%?_!/\\<>^~+=-01';

export const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 25,
  maxDurationMs = 450,
  className = '',
  onComplete
}) => {
  const [displayText, setDisplayText] = useState<string>('');

  useEffect(() => {
    let iteration = 0;
    const totalIterations = Math.max(10, Math.floor(maxDurationMs / speed));
    const targetLength = text.length;

    const interval = setInterval(() => {
      iteration++;
      const progress = iteration / totalIterations;
      const revealedCharCount = Math.floor(progress * targetLength);

      const scrambled = text
        .split('')
        .map((char, index) => {
          if (char === ' ' || char === '\n') return char;
          if (index < revealedCharCount) {
            return text[index];
          }
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join('');

      setDisplayText(scrambled);

      if (iteration >= totalIterations) {
        clearInterval(interval);
        setDisplayText(text);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, maxDurationMs, onComplete]);

  return <span className={className}>{displayText}</span>;
};
