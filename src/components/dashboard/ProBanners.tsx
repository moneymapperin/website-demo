import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import quarterlyImg from '../../assets/app/quarterly_plan.png';
import halfYearlyImg from '../../assets/app/half_yearly_2.png';
import yearlyImg from '../../assets/app/yearly_plan_1.png';

export interface ProBannersProps {
  isPro?: boolean;
}

const BANNERS = [
  {
    title: 'Quarterly Plan',
    price: '499',
    oldPrice: '799',
    off: '38% OFF',
    save: 'SAVE ₹897',
    image: quarterlyImg,
  },
  {
    title: 'Half-Yearly Plan',
    price: '399',
    oldPrice: '799',
    off: '50% OFF',
    save: 'SAVE ₹2400',
    image: halfYearlyImg,
  },
  {
    title: 'Yearly Plan',
    price: '299',
    oldPrice: '799',
    off: '63% OFF',
    save: 'SAVE ₹6000',
    image: yearlyImg,
  },
];

export const ProBanners: React.FC<ProBannersProps> = ({ isPro = false }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isPro) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPro]);

  if (isPro) return null;

  const current = BANNERS[currentIndex];

  return (
    <div className="mb-4" data-testid="pro-banners">
      <h4 className="text-base font-bold text-mm-textPrimaryLight dark:text-white mb-3">
        Unlock MoneyMapper Pro 🚀
      </h4>

      <div
        onClick={() => navigate('/subscription')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') navigate('/subscription');
        }}
        className="cursor-pointer relative overflow-hidden rounded-[24px] p-5 md:p-6 bg-gradient-to-br from-[#F59E0B]/25 to-[#D97706]/25 border-[1.5px] border-[#F59E0B]/30 shadow-[0_4px_16px_rgba(245,158,11,0.08)] transition-all hover:border-[#F59E0B]/50"
      >
        {/* Real Plan Image from Flutter Assets (lines 1684-1692) */}
        <img
          src={current.image}
          alt={current.title}
          className="absolute -left-2 -bottom-1 h-28 w-auto object-contain select-none pointer-events-none drop-shadow-md"
        />

        {/* Content on the Right */}
        <div className="relative z-10 flex flex-col items-end text-right">
          <span className="text-lg font-black text-mm-textPrimaryLight dark:text-white">
            {current.title}
          </span>

          <span className="my-1.5 px-2 py-0.5 rounded-md bg-green-500/15 border border-green-500/30 text-[9px] font-black text-green-600 dark:text-green-400">
            {current.save}
          </span>

          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-black text-mm-textPrimaryLight dark:text-white">
              ₹{current.price}
            </span>
            <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">/mo</span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs mt-0.5">
            <span className="line-through text-gray-400">₹{current.oldPrice}</span>
            <span className="text-[10px] font-black text-mm-accent">{current.off}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/subscription');
            }}
            className="mt-3 px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white text-[10px] font-black tracking-wider shadow-[0_4px_10px_rgba(245,158,11,0.4)] transition-colors"
          >
            CLAIM OFFER
          </button>
        </div>
      </div>

      {/* Indicator dots */}
      <div className="flex items-center justify-center space-x-1.5 mt-2.5">
        {BANNERS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentIndex === idx ? 'w-4 bg-mm-primary' : 'w-1.5 bg-gray-300 dark:bg-zinc-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
