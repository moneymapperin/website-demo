import React, { useState } from 'react';
import { UserPlus, Gauge, CalendarCheck, TrendingUp } from 'lucide-react';

interface StepCard {
  step: number;
  label: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: StepCard[] = [
  {
    step: 1,
    label: 'STEP 01',
    title: 'Create your profile',
    description: 'A short guided setup, about a few minutes.',
    icon: <UserPlus className="w-5 h-5 text-purple-300" />,
  },
  {
    step: 2,
    label: 'STEP 02',
    title: 'Get your Financial Fitness Score',
    description: 'One number from 0 to 100.',
    icon: <Gauge className="w-5 h-5 text-purple-300" />,
  },
  {
    step: 3,
    label: 'STEP 03',
    title: 'Follow weekly actions',
    description: 'Small targets, steady streaks.',
    icon: <CalendarCheck className="w-5 h-5 text-purple-300" />,
  },
  {
    step: 4,
    label: 'STEP 04',
    title: 'Improve, month after month',
    description: 'Watch your score climb.',
    icon: <TrendingUp className="w-5 h-5 text-purple-300" />,
  },
];

export const HowItWorksSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(2);

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 text-left">
      <div className="max-w-4xl">
        {/* Eyebrow */}
        <p className="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-3">
          HOW IT WORKS
        </p>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-tight leading-[1.2]">
          From confusion{' '}
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
            to confidence
          </span>{' '}
          in four steps
        </h2>

        {/* Subtitle */}
        <p className="mt-3 text-sm sm:text-base text-white/60 font-normal leading-relaxed">
          Click any step to see exactly what happens.
        </p>
      </div>

      {/* Four Step Cards in One Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mt-10 sm:mt-12">
        {steps.map((item) => {
          const isActive = item.step === activeStep;
          return (
            <div
              key={item.step}
              role="button"
              tabIndex={0}
              onClick={() => setActiveStep(item.step)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveStep(item.step);
                }
              }}
              className={`group rounded-2xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer text-left select-none ${
                isActive
                  ? 'border-purple-500/70 bg-[#17122e]/95 shadow-[0_0_25px_rgba(168,85,247,0.18)] translate-y-[-2px]'
                  : 'border-white/[0.08] bg-[#141026]/80 hover:border-purple-500/40 hover:bg-[#181330]/90 shadow-lg shadow-black/40'
              }`}
            >
              <div>
                {/* Icon Box */}
                <div
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center text-purple-300 mb-5 transition-transform duration-300 ${
                    isActive
                      ? 'bg-purple-900/40 border-purple-500/40 scale-105'
                      : 'bg-purple-900/25 border-purple-500/20 group-hover:scale-105'
                  }`}
                >
                  {item.icon}
                </div>

                {/* Step Label */}
                <span className="text-xs font-semibold text-purple-400 tracking-wider uppercase block mb-2">
                  {item.label}
                </span>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-white/50 font-normal leading-relaxed mt-2">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorksSection;

