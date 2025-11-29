import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Zap, ShieldCheck, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
interface StepperProps {
  activeStep: number;
  progress: number;
}
const steps = [
  { name: 'Analyze', icon: Search },
  { name: 'Generate', icon: Zap },
  { name: 'Validate', icon: ShieldCheck },
  { name: 'Export', icon: Rocket },
];
export function Stepper({ activeStep, progress }: StepperProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(mq.matches);
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      if (mq.addEventListener) mq.addEventListener('change', handler);
      else mq.addListener(handler);
      return () => {
        if (mq.removeEventListener) mq.removeEventListener('change', handler);
        else mq.removeListener(handler);
      };
    }
  }, []);

  const mutedForeground = isDark ? '#94A3B8' : '#6B7280';
  const primary = isDark ? '#60A5FA' : '#0066FF';

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          const Icon = step.icon;
          return (
            <div key={step.name} className="flex flex-col items-center text-center w-1/4 px-1">
              <motion.div
                animate={isCompleted ? "completed" : isActive ? "active" : "inactive"}
                variants={{
                  inactive: { scale: 1, color: mutedForeground },
                  active: { scale: 1.1, color: primary },
                  completed: { scale: 1, color: primary },
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  isCompleted ? "bg-primary border-primary text-primary-foreground" :
                  isActive ? "border-primary" : "border-border"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "animate-pulse")} />
              </motion.div>
              <p className={cn(
                "mt-2 text-sm font-medium transition-colors text-balance",
                isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.name}
              </p>
            </div>
          );
        })}
      </div>
      <Progress value={progress} className="w-full h-2" />
    </div>
  );
}