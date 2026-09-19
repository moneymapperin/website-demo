import React from 'react';

export const DashboardFooter: React.FC = () => {
  return (
    <footer className="py-6 text-center space-y-1" data-testid="dashboard-footer">
      <div className="text-lg font-black tracking-[1.5px] text-mm-primary dark:text-white">
        MoneyMapper
      </div>
      <div className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-white/40 uppercase">
        Your Financial Navigation System
      </div>
    </footer>
  );
};
