import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader, AlertTriangle, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
interface StepperProps {
  activeStep: number;
  progress: number;
}
const steps = [
  { name: 'Analyze', icon: Loader },
  { name: 'Generate', icon: AlertTriangle },
  { name: 'Validate', icon: Check },
  { name: 'Export', icon: Rocket },
];
export function Stepper({ activeStep, progress }: StepperProps) {
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          const Icon = step.icon;
          return (
            <div key={step.name} className="flex flex-col items-center text-center w-1/4">
              <motion.div
                animate={isCompleted ? "completed" : isActive ? "active" : "inactive"}
                variants={{
                  inactive: { scale: 1, color: "hsl(var(--muted-foreground))" },
                  active: { scale: 1.1, color: "hsl(var(--primary))" },
                  completed: { scale: 1, color: "hsl(var(--primary))" },
                }}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  isCompleted ? "bg-primary border-primary text-primary-foreground" :
                  isActive ? "border-primary" : "border-border"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className={cn("w-5 h-5", isActive && "animate-spin")} />}
              </motion.div>
              <p className={cn(
                "mt-2 text-sm font-medium transition-colors",
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