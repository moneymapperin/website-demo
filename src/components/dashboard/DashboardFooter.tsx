import React from 'react';
import logoImg from '../../assets/app/logo.png';

export const DashboardFooter: React.FC = () => {
  return (
    <footer className="py-6 flex flex-col items-center justify-center space-y-2.5 text-center" data-testid="dashboard-footer">
      <img
        src={logoImg}
        alt="MoneyMapper Logo"
        className="w-11 h-11 object-contain drop-shadow-md select-none"
      />
      <div className="space-y-0.5">
        <div className="text-lg font-black tracking-[1.5px] text-mm-primary dark:text-white">
          MoneyMapper
        </div>
        <div className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-white/40 uppercase">
          Your Personal Money Manager
        </div>
      </div>
    </footer>
  );
};
