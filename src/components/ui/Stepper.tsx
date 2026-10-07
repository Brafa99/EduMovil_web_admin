import { Check } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-start justify-between w-full overflow-x-auto pb-2">
      {steps.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={i} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200 ${
                  done ? 'bg-[#1B6FFF] border-[#1B6FFF] text-white' :
                  active ? 'bg-white border-[#1B6FFF] text-[#1B6FFF]' :
                  'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <div className="text-center mt-1.5 px-1">
                <p className={`text-xs font-semibold whitespace-nowrap ${active ? 'text-[#1B6FFF]' : done ? 'text-slate-600' : 'text-slate-400'}`}>
                  {step.label}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mt-4 mx-2 transition-colors duration-200 ${done ? 'bg-[#1B6FFF]' : 'bg-slate-200'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
