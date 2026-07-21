import React, { useEffect, useState } from 'react';

interface NumberRollerProps {
  value: number;
  duration?: number;
  className?: string;
  isFloat?: boolean;
}

export function NumberRoller({ value, duration = 600, className = '', isFloat = false }: NumberRollerProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (displayValue === value) return;

    let startTime: number | null = null;
    const startValue = displayValue;
    const change = value - startValue;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      
      const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
      const p = Math.min(progress / duration, 1);
      
      const current = startValue + change * easeOutExpo(p);
      setDisplayValue(current);

      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]); // Intentionally omitting displayValue to avoid re-triggering

  return (
    <span className={className}>
      {isFloat ? displayValue.toFixed(1) : Math.round(displayValue)}
    </span>
  );
}
