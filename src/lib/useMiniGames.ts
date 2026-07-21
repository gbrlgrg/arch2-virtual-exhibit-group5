import { useState, useCallback } from 'react';

export interface SimulatorActions {
  setHits: React.Dispatch<React.SetStateAction<number>>;
  setMisses: React.Dispatch<React.SetStateAction<number>>;
  playHit: () => void;
  playMiss: () => void;
  setIsShaking: React.Dispatch<React.SetStateAction<boolean>>;
  setSimState: React.Dispatch<React.SetStateAction<any>>;
  setXp: React.Dispatch<React.SetStateAction<number>>;
  triggerSimulation: (addr: string, mode: 'hit' | 'miss') => void;
}

export function useMiniGames(actions: SimulatorActions) {
  const { setHits, setMisses, playHit, playMiss, setIsShaking, setSimState, setXp, triggerSimulation } = actions;

  // --- PHASE 1 RECOVERY: THE 5 MINI-GAMES STATES ---
  const [isOverclocking, setIsOverclocking] = useState(false);
  
  // Thrashing Mini-game
  const [thrashState, setThrashState] = useState<'A'|'B'>('A');
  const [thrashCount, setThrashCount] = useState(0);
  
  // Eviction Trolley Mini-game
  const [trolleyState, setTrolleyState] = useState<'idle'|'prompt'|'success'|'fail'>('idle');
  
  // Power Outage Mini-game
  const [powerState, setPowerState] = useState<'idle'|'writing'|'blackout'|'lost'>('idle');
  
  // Cache Controller Exam
  const [examState, setExamState] = useState<'idle'|'running'|'success'|'fail'>('idle');
  const [examIndex, setExamIndex] = useState(0);
  const [examTime, setExamTime] = useState(5);

  // --- PHASE 1 RECOVERY: EXAM & OVERCLOCK HANDLERS ---
  const handleOverclock = useCallback(() => {
    if (isOverclocking) return;
    setIsOverclocking(true);
    let count = 0;
    const interval = setInterval(() => {
      const isHit = Math.random() > 0.4;
      if (isHit) {
        setHits(h => h + 1);
        playHit();
        setXp(x => x + 5)
      } else {
        setMisses(m => m + 1);
        playMiss();
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 50)
      }
      setSimState(isHit ? 'hit' : 'miss');
      
      count++;
      if (count >= 40) {
        clearInterval(interval);
        setIsOverclocking(false);
        setSimState('idle');
      }
    }, 60); // extremely fast
  }, [isOverclocking, playHit, playMiss, setHits, setMisses, setSimState, setXp, setIsShaking]);

  const startExam = useCallback(() => {
    setExamState('running');
    setExamIndex(0);
    setExamTime(15);
    
    if ((window as any).examTimer) clearInterval((window as any).examTimer);
    
    (window as any).examTimer = setInterval(() => {
      setExamTime(t => {
        if (t <= 1) {
          clearInterval((window as any).examTimer);
          setExamState('fail');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  const answerExam = useCallback((correct: boolean) => {
    if ((window as any).examTimer) clearInterval((window as any).examTimer);
    if (correct) {
      if (examIndex < 19) {
        // Not the last question
        setExamIndex(idx => idx + 1);
        setXp(x => x + 10);
        setExamTime(15);
        playHit();
        
        // Restart timer
        (window as any).examTimer = setInterval(() => {
          setExamTime(t => {
            if (t <= 1) {
              clearInterval((window as any).examTimer);
              setExamState('fail');
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      } else {
        // Last question
        setExamState('success');
        setXp(x => x + 300); // big bonus
        playHit();
      }
    } else {
      setExamState('fail');
      playMiss();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
    }
  }, [examIndex, playHit, playMiss, setXp, setIsShaking]);

  return {
    isOverclocking,
    handleOverclock,
    thrashState,
    setThrashState,
    thrashCount,
    setThrashCount,
    trolleyState,
    setTrolleyState,
    powerState,
    setPowerState,
    examState,
    setExamState,
    examTime,
    examIndex,
    setExamIndex,
    startExam,
    answerExam,
    triggerSimulation
  };
}
