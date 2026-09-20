import React from 'react';
import spendingImg from '../../assets/app/spending1.png';

export interface EstimatedSpendingLimitProps {
  monthlyIncome: number;
  expenseScore?: number;
}

export const EstimatedSpendingLimit: React.FC<EstimatedSpendingLimitProps> = ({
  monthlyIncome,
  expenseScore = 0,
}) => {
  // Flutter line 2125: if (_monthlyIncome > 0)
  if (monthlyIncome <= 0) return null;

  // Flutter lines 2101-2111
  const weeklyIncome = monthlyIncome / 4;
  const fMid = Math.min(0.35, Math.max(0.25, 0.25 + (expenseScore / 100) * 0.10));
  const xMid = Math.min(0.55, Math.max(0.45, 0.55 - (expenseScore / 100) * 0.10));

  const minTotal = Math.round(weeklyIncome * ((xMid - 0.02) + (fMid - 0.02)));
  const maxTotal = Math.round(weeklyIncome * ((xMid + 0.02) + (fMid + 0.02)));

  return (
    <div
      className="mb-4 relative h-[125px] rounded-[20px] bg-white dark:bg-mm-darkCard border-[1.5px] border-mm-primary/30 shadow-[0_4px_10px_rgba(79,70,229,0.05)] overflow-hidden"
      data-testid="spending-limit-widget"
    >
      {/* Real Spending Graphic from Flutter Assets (lines 2146-2154) */}
      <img
        src={spendingImg}
        alt="Estimated Spending Limit"
        className="absolute -right-3 -bottom-2 h-24 w-auto object-contain select-none pointer-events-none drop-shadow-sm opacity-90 dark:opacity-80"
      />

      <div className="relative z-10 h-full flex flex-col justify-center px-5 py-3">
        <span className="text-[10px] font-black tracking-wider text-gray-500 dark:text-zinc-400">
          ESTIMATED SPENDING LIMIT
        </span>
        <span className="text-[9px] font-extrabold text-black/45 dark:text-white/60">
          (THIS WEEK)
        </span>
        <div
          className="text-xl font-black text-mm-textPrimaryLight dark:text-white my-1 tracking-tight"
          data-testid="spending-limit-range"
        >
          ₹{minTotal} - ₹{maxTotal}
        </div>
        <div>
          <span className="inline-block px-2 py-0.5 rounded-lg text-[8px] font-black bg-mm-primary/10 text-mm-primary">
            TARGET
          </span>
        </div>
      </div>
    </div>
  );
};
