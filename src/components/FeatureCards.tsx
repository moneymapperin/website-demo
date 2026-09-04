import { useComingSoon } from '../context/ComingSoonContext';
import { Sparkles, LayoutGrid, TrendingUp, Lock } from 'lucide-react';

export const FeatureCards: React.FC = () => {
  const { openComingSoon } = useComingSoon();

  const features = [
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      subtitle: 'Smart Guidance',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      iconBg: 'bg-purple-900/30 border-purple-500/30',
      hoverBorder: 'hover:border-purple-500/40',
    },
    {
      id: 'pillars',
      title: '5 Financial Pillars',
      subtitle: 'Holistic View',
      icon: <LayoutGrid className="w-5 h-5 text-pink-400" />,
      iconBg: 'bg-pink-900/30 border-pink-500/30',
      hoverBorder: 'hover:border-pink-500/40',
    },
    {
      id: 'insights',
      title: 'Real-time Insights',
      subtitle: 'Data that matters',
      icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
      iconBg: 'bg-blue-900/30 border-blue-500/30',
      hoverBorder: 'hover:border-blue-500/40',
    },
    {
      id: 'secure',
      title: 'Secure & Private',
      subtitle: 'Your data, your control',
      icon: <Lock className="w-5 h-5 text-teal-400" />,
      iconBg: 'bg-teal-900/30 border-teal-500/30',
      hoverBorder: 'hover:border-teal-500/40',
    },
  ];

  return (
    <div className="flex flex-col gap-3.5 w-full max-w-[260px] sm:max-w-[280px]">
      {features.map((feature) => (
        <div
          key={feature.id}
          onClick={() => openComingSoon(feature.title)}
          className={`group p-3.5 sm:p-4 rounded-2xl bg-[#151322]/80 backdrop-blur-sm border border-white/[0.08] ${feature.hoverBorder} flex items-center gap-3.5 shadow-lg shadow-black/40 transition-all duration-200 hover:translate-x-1.5 active:scale-[0.98] cursor-pointer`}
        >
          {/* Icon in colored rounded-square */}
          <div
            className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${feature.iconBg} group-hover:scale-105 transition-transform duration-200`}
          >
            {feature.icon}
          </div>

          {/* Title & Subtitle */}
          <div className="text-left">
            <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-white/95">
              {feature.title}
            </h4>
            <p className="text-xs text-white/50 font-normal">
              {feature.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeatureCards;
