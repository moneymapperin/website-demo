import { useComingSoon } from '../context/ComingSoonContext';
import { DashboardPreview } from './DashboardPreview';
import { TrendingUp, LayoutGrid, Shield, Wallet, Target } from 'lucide-react';

export const PillarsSection: React.FC = () => {
  const { openComingSoon } = useComingSoon();

  const pillarCards = [
    {
      id: 'stocks',
      title: 'Stock & Investment',
      desc: 'Track your stocks, ETFs and portfolio performance',
      icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
      badgeBg: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      titleColor: 'text-white',
      borderStyle: 'border-white/[0.08] hover:border-blue-500/40',
      highlighted: false,
    },
    {
      id: 'mutual-funds',
      title: 'Mutual Funds',
      desc: 'Monitor SIPs, returns and top performing funds',
      icon: <LayoutGrid className="w-5 h-5 text-amber-400" />,
      badgeBg: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
      titleColor: 'text-amber-300',
      borderStyle: 'border-amber-500/70 shadow-[0_0_25px_rgba(245,158,11,0.2)] bg-[#191522]',
      highlighted: true,
    },
    {
      id: 'insurance',
      title: 'Insurance',
      desc: 'Keep track of your policies & coverage',
      icon: <Shield className="w-5 h-5 text-purple-400" />,
      badgeBg: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
      titleColor: 'text-white',
      borderStyle: 'border-white/[0.08] hover:border-purple-500/40',
      highlighted: false,
    },
    {
      id: 'emergency-fund',
      title: 'Emergency Fund',
      desc: 'Build & track your financial safety net',
      icon: <Wallet className="w-5 h-5 text-teal-400" />,
      badgeBg: 'bg-teal-500/20 border-teal-500/30 text-teal-400',
      titleColor: 'text-white',
      borderStyle: 'border-white/[0.08] hover:border-teal-500/40',
      highlighted: false,
    },
    {
      id: 'goals-planning',
      title: 'Goals & Planning',
      desc: 'Plan your goals and achieve them step by step',
      icon: <Target className="w-5 h-5 text-pink-400" />,
      badgeBg: 'bg-pink-500/20 border-pink-500/30 text-pink-400',
      titleColor: 'text-white',
      borderStyle: 'border-white/[0.08] hover:border-pink-500/40',
      highlighted: false,
    },
  ];

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background Subtle Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-brand-purple/10 blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Centered Heading Block */}
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight mb-4 whitespace-normal md:whitespace-nowrap">
            <span className="text-white">Your Entire Financial World </span>
            <span className="bg-gradient-to-r from-[#9333ea] via-[#c026d3] to-[#ec4899] bg-clip-text text-transparent">
              in One Place
            </span>
          </h2>
          <p className="text-sm sm:text-base text-white/60 font-normal leading-relaxed max-w-2xl mx-auto">
            Track every pillar of your financial life and get AI-powered insights<br className="hidden sm:inline" /> to make smarter decisions.
          </p>
        </div>

        {/* Row of 5 Pillar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12 lg:mb-16">
          {pillarCards.map((card) => (
            <div
              key={card.id}
              onClick={() => openComingSoon(card.title)}
              className={`rounded-2xl p-5 text-center flex flex-col items-center justify-start bg-[#141124]/90 backdrop-blur-sm border transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] cursor-pointer shadow-lg ${card.borderStyle}`}
            >
              {/* Top Colored Icon Badge */}
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 shadow-inner ${card.badgeBg}`}
              >
                {card.icon}
              </div>

              {/* Card Title */}
              <h3 className={`text-base font-bold mb-2 tracking-tight ${card.titleColor}`}>
                {card.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-white/50 leading-relaxed font-normal">
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Large Wide Dashboard Preview Container */}
        <div className="w-full">
          <DashboardPreview />
        </div>

      </div>
    </section>
  );
};

export default PillarsSection;
