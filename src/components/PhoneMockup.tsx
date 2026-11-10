import React, { useState } from 'react';
import logoImg from '../assets/logo.png';
import mascotImg from '../assets/mascot.png';
import {
  Bell,
  HelpCircle,
  TrendingUp,
  Home as HomeIcon,
  FileText,
  Shield,
  Bot,
  Crown,
  IndianRupee,
  Wallet,
  BarChart2,
  PiggyBank,
  User,
  Landmark,
  CreditCard,
  Receipt,
  Building2,
  Mail,
  Smartphone,
  ChevronDown,
  X,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Lock
} from 'lucide-react';
import { calculateIncomeScore } from '../utils/financialScoreEngine';

export interface PhoneMockupProps {
  className?: string;
  style?: React.CSSProperties;
  showOnboarding?: boolean;
}

export interface OnboardingData {
  first_name: string;
  last_name: string;
  monthly_income: string;
  fixed_expenses: string;
  total_loan_emi: string;
  monthly_expenditure: string;
  city_tier: string;
  has_passive_income: boolean;
  passive_income_amount: string;
  email: string;
  mobile_number: string;
}

const CATEGORY_TABS = [
  { key: 'income', label: 'Income', color: '#00E676', icon: IndianRupee },
  { key: 'expenses', label: 'Expenses', color: '#FF5252', icon: Wallet },
  { key: 'investment', label: 'Investment', color: '#448AFF', icon: BarChart2 },
  { key: 'insurance', label: 'Insurance', color: '#E040FB', icon: Shield },
  { key: 'savings', label: 'Savings', color: '#FFD740', icon: PiggyBank },
];

const CITY_TIERS = ['Metro', 'Tier 2', 'Tier 3'];

/* ========================================================================== */
/* ORIGINAL DASHBOARD PHONE MOCKUP (Restored for Bottom / CTA Section)        */
/* ========================================================================== */
const DashboardPhoneMockup: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = '',
  style,
}) => {
  return (
    <div
      style={style}
      className={`relative mx-auto w-[310px] sm:w-[330px] select-none transition-transform duration-300 ${className}`}
    >
      {/* Outer Phone Hardware Bezel */}
      <div className="relative rounded-[46px] p-[10px] bg-gradient-to-b from-[#3a2f58] via-[#211938] to-[#120d24] border border-[#524177]/60 shadow-[0_25px_70px_rgba(139,92,246,0.35),0_0_80px_rgba(168,85,247,0.15)]">
        
        {/* Phone Glass / Inner Screen */}
        <div className="relative rounded-[38px] bg-[#0d0a1a] overflow-hidden border border-white/[0.08] flex flex-col min-h-[640px]">
          
          {/* Top Speaker / Dynamic Pill */}
          <div className="w-full pt-3 pb-2 px-6 flex items-center justify-between z-20">
            {/* Clock / Carrier dummy */}
            <span className="text-[11px] font-semibold text-white/70">9:41</span>
            
            {/* Camera / Pill Notch */}
            <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center gap-2 px-2">
              <div className="w-2 h-2 rounded-full bg-[#1b1928] border border-white/10"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60"></div>
            </div>

            {/* Signal & Battery */}
            <div className="flex items-center gap-1.5 text-white/70">
              <div className="w-3 h-2 border border-white/70 rounded-[1px] p-[1px] flex items-center">
                <div className="w-full h-full bg-white/80 rounded-[0.5px]"></div>
              </div>
            </div>
          </div>

          {/* Phone In-App Header */}
          <div className="px-4 py-2 flex items-center justify-between border-b border-white/[0.05]">
            <div className="flex items-center gap-1.5">
              <img
                src={logoImg}
                alt="Logo"
                className="w-5 h-5 object-contain"
              />
              <span className="text-xs font-bold text-white tracking-tight">MoneyMapper</span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-brand-purple text-[8px] font-bold text-white uppercase tracking-wider">
                <Crown className="w-2 h-2" />
                Premium
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="relative p-1 rounded-full text-white/70 hover:text-white transition-colors"
                aria-hidden="true"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-[#0d0a1a]"></span>
              </div>
              <div
                className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-purple to-brand-magenta flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
              >
                S
              </div>
            </div>
          </div>

          {/* Scrollable Phone Content */}
          <div className="p-3.5 space-y-3 flex-1 overflow-y-auto no-scrollbar">

            {/* 1. White Card: FINANCIAL FITNESS SCORE */}
            <div
              className="bg-white rounded-2xl p-3.5 shadow-md text-slate-900 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1">
                  Financial Fitness Score
                  <HelpCircle className="w-3 h-3 text-slate-400 inline" />
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-bold inline-flex items-center gap-1">
                  <span>😐</span> AVERAGE
                </span>
              </div>

              <div className="flex items-start gap-3">
                {/* Donut Gauge with perfect centering */}
                <div className="relative w-[76px] h-[76px] shrink-0 flex items-center justify-center">
                  <svg className="w-[76px] h-[76px] -rotate-90" viewBox="0 0 76 76">
                    {/* Background Track */}
                    <circle
                      cx="38"
                      cy="38"
                      r="31"
                      stroke="#f1f5f9"
                      strokeWidth="6"
                      fill="none"
                    />
                    {/* Gauge Arc (45% of 194.8 circumference = 87.6) */}
                    <circle
                      cx="38"
                      cy="38"
                      r="31"
                      stroke="url(#scoreGradient)"
                      strokeWidth="6"
                      strokeDasharray="194.8"
                      strokeDashoffset="107.1"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ea580c" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-extrabold text-slate-900 leading-none">45</span>
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">OF 100</span>
                  </div>
                </div>

                {/* Score Advice Details */}
                <div className="flex-1 flex flex-col justify-between self-stretch">
                  <p className="text-[10px] text-slate-600 leading-[1.3] mb-1.5">
                    You're on track. Focus on investing more and building your emergency fund.
                  </p>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[8.5px] font-semibold text-emerald-700">
                      <span className="text-emerald-600 font-bold">↑</span> +12 pts from last month
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. NET FINANCIAL POSITION */}
            <div
              className="bg-[#18152c] border border-white/10 rounded-2xl p-3.5 shadow-md hover:border-brand-purple/40 transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase">
                  Net Financial Position
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-black text-[#22c55e] tracking-tight">
                    ₹2,843,000
                  </div>
                  <p className="text-[9px] text-white/40 mb-2">
                    Total Assets - Total Liabilities
                  </p>
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#22c55e]">
                    <TrendingUp className="w-3 h-3 inline" />
                    <span>+ ₹18,450 (8.3%)</span>
                    <span className="text-[8px] text-white/40 font-normal">vs last month</span>
                  </div>
                </div>

                {/* Upward Stock Market Graph */}
                <div className="w-26 h-13 relative flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 110 44">
                    <defs>
                      <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Area fill */}
                    <path
                      d="M0,36 C8,36 12,26 18,26 C24,26 28,32 34,32 C40,32 44,20 50,20 C56,20 60,25 66,25 C72,25 76,12 82,12 C88,12 92,17 98,17 C104,17 106,5 110,5 L110,44 L0,44 Z"
                      fill="url(#purpleGlow)"
                    />
                    {/* Sparkline stroke */}
                    <path
                      d="M0,36 C8,36 12,26 18,26 C24,26 28,32 34,32 C40,32 44,20 50,20 C56,20 60,25 66,25 C72,25 76,12 82,12 C88,12 92,17 98,17 C104,17 106,5 110,5"
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Intermediate Nodes */}
                    <circle cx="18" cy="26" r="2" fill="#a855f7" stroke="#ffffff" strokeWidth="0.8" />
                    <circle cx="50" cy="20" r="2" fill="#a855f7" stroke="#ffffff" strokeWidth="0.8" />
                    <circle cx="82" cy="12" r="2" fill="#c084fc" stroke="#ffffff" strokeWidth="0.8" />
                    {/* End point dot */}
                    <circle cx="110" cy="5" r="3.5" fill="#ec4899" className="animate-pulse" />
                    <circle cx="110" cy="5" r="1.5" fill="#ffffff" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 3. LIVE GOLD RATE 24K (PER GRAM) + CSS GOLD BARS */}
            <div
              className="bg-[#18152c] border border-white/10 rounded-2xl p-3.5 shadow-md flex items-center justify-between hover:border-amber-500/40 transition-all"
            >
              <div>
                <span className="block text-[9px] font-bold text-white/70 uppercase tracking-wider">
                  Live Gold Rate 24K
                </span>
                <span className="block text-[8px] text-white/40 mb-1">
                  (PER GRAM)
                </span>
                <span className="text-xl font-black text-white tracking-tight">
                  ₹15,118
                </span>
              </div>

              {/* CSS-Only Stacked Gold Bullion Bars */}
              <div className="relative w-24 h-16 flex items-center justify-center">
                {/* Back / Lower Gold Bar */}
                <div className="absolute top-1 right-2 w-16 h-7 rounded-md bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#fbbf24] shadow-md border-t border-yellow-200/60 transform rotate-[-8deg] flex items-center justify-center">
                  <div className="w-12 h-3.5 rounded border border-amber-800/20 bg-gradient-to-b from-yellow-300/30 to-transparent flex items-center justify-between px-1">
                    <span className="text-[6px] font-black text-amber-950/70 tracking-tighter">999.9</span>
                    <span className="text-[5px] font-extrabold text-amber-950/60">FINE GOLD</span>
                  </div>
                </div>

                {/* Front / Top Gold Bar */}
                <div className="absolute bottom-1 right-1 w-18 h-8 rounded-md bg-gradient-to-r from-[#b45309] via-[#f59e0b] to-[#fde047] shadow-xl border-t border-yellow-100/90 flex items-center justify-center z-10">
                  <div className="w-14 h-4.5 rounded border border-amber-900/30 bg-gradient-to-b from-yellow-200/40 to-transparent flex items-center justify-between px-1.5 shadow-inner">
                    <span className="text-[7px] font-black text-amber-950 tracking-tighter">24K</span>
                    <div className="flex flex-col items-center">
                      <span className="text-[5px] font-bold text-amber-900 leading-none">GOLD</span>
                      <span className="text-[4px] text-amber-950/70 font-mono">100g</span>
                    </div>
                  </div>
                  {/* Sheen reflection line */}
                  <div className="absolute inset-x-2 top-0.5 h-[1px] bg-white/70 rounded-full"></div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Tab Bar */}
          <div className="bg-[#0b0916] border-t border-white/[0.08] px-3 py-2 flex items-center justify-around z-20">
            <div className="flex flex-col items-center gap-0.5 text-brand-purple">
              <HomeIcon className="w-4 h-4" />
              <span className="text-[8px] font-bold">Home</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-white/50">
              <FileText className="w-4 h-4" />
              <span className="text-[8px] font-medium">Insights</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-white/50">
              <Shield className="w-4 h-4" />
              <span className="text-[8px] font-medium">Portfolio</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-white/50">
              <Bot className="w-4 h-4" />
              <span className="text-[8px] font-medium">AI Assistant</span>
            </div>
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="w-full pb-1 pt-0.5 bg-[#0b0916] flex justify-center">
            <div className="w-28 h-1 bg-white/30 rounded-full"></div>
          </div>

        </div>
      </div>
    </div>
  );
};

/* ========================================================================== */
/* ONBOARDING FLOW PHONE MOCKUP (Top Hero Section)                            */
/* ========================================================================== */
const OnboardingPhoneMockup: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = '',
  style,
}) => {
  // Navigation step state:
  // 0: Welcome
  // 1: Contact Details
  // 2: Income
  // 3: Expenses
  // 4: Liabilities
  // 5: Expenditure
  // 6: Final Details
  // 7: Teaser Income Score Result Screen
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Form values stored in React useState (no localStorage)
  const [formData, setFormData] = useState<OnboardingData>({
    first_name: '',
    last_name: '',
    monthly_income: '',
    fixed_expenses: '',
    total_loan_emi: '',
    monthly_expenditure: '',
    city_tier: 'Metro',
    has_passive_income: false,
    passive_income_amount: '',
    email: '',
    mobile_number: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTextChange = (field: keyof OnboardingData, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleNumberChange = (field: keyof OnboardingData, val: string) => {
    const digitsOnly = val.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, [field]: digitsOnly }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!formData.first_name.trim()) {
        newErrors.first_name = 'Please enter your first name.';
      }
      if (!formData.last_name.trim()) {
        newErrors.last_name = 'Please enter your last name.';
      }
    } else if (currentStep === 1) {
      // Contact Details
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
      }
      const cleanPhone = formData.mobile_number.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length !== 10) {
        newErrors.mobile_number = 'Please enter a valid 10-digit Indian phone number.';
      }
    } else if (currentStep === 2) {
      if (formData.monthly_income.trim() === '') {
        newErrors.monthly_income = 'Please enter an amount (₹0 or greater).';
      }
    } else if (currentStep === 3) {
      if (formData.fixed_expenses.trim() === '') {
        newErrors.fixed_expenses = 'Please enter an amount (₹0 or greater).';
      }
    } else if (currentStep === 4) {
      if (formData.total_loan_emi.trim() === '') {
        newErrors.total_loan_emi = 'Please enter an amount (Enter 0 if none).';
      }
    } else if (currentStep === 5) {
      if (formData.monthly_expenditure.trim() === '') {
        newErrors.monthly_expenditure = 'Please enter an amount (₹0 or greater).';
      }
    } else if (currentStep === 6) {
      // Final Details: City Tier has default 'Metro', passive income is optional
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < 7) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setErrors({});
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Close / Reset action (X returns to Welcome screen and clears all values)
  const handleReset = () => {
    setFormData({
      first_name: '',
      last_name: '',
      monthly_income: '',
      fixed_expenses: '',
      total_loan_emi: '',
      monthly_expenditure: '',
      city_tier: 'Metro',
      has_passive_income: false,
      passive_income_amount: '',
      email: '',
      mobile_number: '',
    });
    setErrors({});
    setCurrentStep(0);
  };

  // Compute Income Score & Stability using ported engine logic
  const incomeResult = calculateIncomeScore(formData);

  // SVG Gauge Calculations for Result Screen (270 degree sweep matching Flutter ScoreGauge)
  const gaugeRadius = 44;
  const gaugeCenter = 60;
  const arcLength = 207.35; // 270 deg of radius 44
  const progressRatio = Math.min(1, Math.max(0.01, incomeResult.finalScore / 100));
  const dashOffset = arcLength * (1 - progressRatio);
  
  // Angle for dot position (135 deg to 405 deg)
  const dotAngleDeg = 135 + progressRatio * 270;
  const dotAngleRad = (dotAngleDeg * Math.PI) / 180;
  const dotX = gaugeCenter + gaugeRadius * Math.cos(dotAngleRad);
  const dotY = gaugeCenter + gaugeRadius * Math.sin(dotAngleRad);
  const dotColor =
    incomeResult.finalScore >= 70
      ? '#10B981'
      : incomeResult.finalScore >= 40
      ? '#F59E0B'
      : '#FF5722';

  return (
    <div
      style={style}
      className={`relative mx-auto w-[310px] sm:w-[330px] select-none transition-transform duration-300 ${className}`}
    >
      {/* Outer Phone Hardware Bezel */}
      <div className="relative rounded-[46px] p-[10px] bg-gradient-to-b from-[#3a2f58] via-[#211938] to-[#120d24] border border-[#524177]/60 shadow-[0_25px_70px_rgba(139,92,246,0.35),0_0_80px_rgba(168,85,247,0.15)]">
        
        {/* Phone Glass / Inner Screen */}
        <div className="relative rounded-[38px] bg-gradient-to-b from-[#0A041A] via-[#160A36] to-[#0D0524] overflow-hidden border border-white/[0.08] flex flex-col h-[650px]">
          
          {/* Background Glowing Wave Accent */}
          <svg
            className="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="neonGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9D4EDD" />
                <stop offset="50%" stopColor="#6C5CE7" />
                <stop offset="100%" stopColor="#3A86FF" />
              </linearGradient>
              <filter id="neonBlur" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="9" />
              </filter>
            </defs>
            <path
              d="M -30 115 Q 60 55 155 110 T 360 85"
              fill="none"
              stroke="url(#neonGlowGrad)"
              strokeWidth="9"
              filter="url(#neonBlur)"
              opacity="0.5"
            />
            <path
              d="M -30 115 Q 60 55 155 110 T 360 85"
              fill="none"
              stroke="url(#neonGlowGrad)"
              strokeWidth="2.2"
              opacity="0.85"
            />
            <path
              d="M -20 585 Q 110 540 210 590 T 360 560"
              fill="none"
              stroke="url(#neonGlowGrad)"
              strokeWidth="8"
              filter="url(#neonBlur)"
              opacity="0.4"
            />
            <path
              d="M -20 585 Q 110 540 210 590 T 360 560"
              fill="none"
              stroke="url(#neonGlowGrad)"
              strokeWidth="1.8"
              opacity="0.75"
            />
          </svg>

          {/* Top Speaker / Dynamic Notch */}
          <div className="w-full pt-3 pb-1 px-6 flex items-center justify-between z-20 shrink-0">
            <span className="text-[11px] font-semibold text-white/70">3:30</span>
            <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center gap-2 px-2">
              <div className="w-2 h-2 rounded-full bg-[#1b1928] border border-white/10"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60"></div>
            </div>
            <div className="flex items-center gap-1.5 text-white/70">
              <div className="w-3 h-2 border border-white/70 rounded-[1px] p-[1px] flex items-center">
                <div className="w-full h-full bg-white/80 rounded-[0.5px]"></div>
              </div>
            </div>
          </div>

          {/* Top Navigation Header: changes on result screen */}
          {currentStep === 7 ? (
            /* Result Header: "Your Financial Health" in center + (X) close icon at right */
            <div className="px-4 py-2 flex items-center justify-between shrink-0 z-20 border-b border-white/[0.06]">
              <div className="w-6" /> {/* spacer for balance */}
              <h2 className="text-xs sm:text-[13px] font-black text-white tracking-tight text-center">
                Your Financial Health
              </h2>
              <button
                type="button"
                onClick={handleReset}
                aria-label="Close and return to welcome"
                className="w-6 h-6 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Wizard Header: Empty spacer row keeping height intact so category icons do not move up */
            <div className="px-4 py-1.5 h-[34px] shrink-0 z-20" />
          )}

          {/* Category Tabs Row (visible during wizard steps 0 to 6) */}
          {currentStep < 7 && (
            <div className="px-3 pt-1 pb-3 z-10 shrink-0">
              <div className="flex items-center justify-between">
                {CATEGORY_TABS.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <div key={tab.key} className="flex flex-col items-center">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center border transition-transform hover:scale-105"
                        style={{
                          backgroundColor: `${tab.color}25`,
                          borderColor: `${tab.color}80`,
                          boxShadow: `0 0 10px ${tab.color}40`,
                        }}
                      >
                        <IconComponent
                          className="w-4 h-4"
                          style={{ color: tab.color }}
                        />
                      </div>
                      <span className="text-[8.5px] font-semibold text-white/75 mt-1 tracking-tight">
                        {tab.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scrollable Phone Body Container */}
          <div className="p-3.5 flex-1 overflow-y-auto no-scrollbar z-10 flex flex-col justify-between">
            
            {/* ============================================================== */}
            {/* RESULT SCREEN (Step 7 - Matches Screenshot 1:1)               */}
            {/* ============================================================== */}
            {currentStep === 7 ? (
              <div className="space-y-3.5 pb-2 animate-fade-in flex flex-col items-center">
                {/* 1. Title: "Here is your Income Score" */}
                <div className="text-center pt-1">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Here is your Income Score
                  </h3>
                </div>

                {/* 2. Circular Score Gauge with Dot Marker */}
                <div className="relative w-[130px] h-[130px] flex items-center justify-center my-1">
                  {/* Soft Radial Ambient Glow */}
                  <div className="absolute inset-2 rounded-full bg-purple-600/15 blur-lg pointer-events-none" />

                  <svg className="w-[120px] h-[120px]" viewBox="0 0 120 120">
                    {/* Background Track (270 degrees) */}
                    <path
                      d="M 28.89 91.11 A 44 44 0 1 1 91.11 91.11"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.12)"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />

                    {/* Progress Fill Arc */}
                    <path
                      d="M 28.89 91.11 A 44 44 0 1 1 91.11 91.11"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.45)"
                      strokeWidth="7"
                      strokeDasharray={arcLength}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />

                    {/* Arc End Dot Marker matching screenshot */}
                    <circle
                      cx={dotX}
                      cy={dotY}
                      r="4.5"
                      fill={dotColor}
                      style={{
                        filter: `drop-shadow(0 0 6px ${dotColor})`,
                      }}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  {/* Centered Large Score Number and OF 100 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-3xl font-black text-white font-mono leading-none tracking-tight">
                      {incomeResult.finalScore}
                    </span>
                    <span className="text-[8px] font-extrabold text-white/50 tracking-widest mt-1">
                      OF 100
                    </span>
                  </div>
                </div>

                {/* 3. Two Side-by-Side Cards: Active Income & Passive Income */}
                <div className="grid grid-cols-2 gap-2.5 w-full">
                  {/* Blue-outlined Active Income Card */}
                  <div className="rounded-2xl bg-[#0D0A1E]/90 border border-blue-500/50 p-3 shadow-md flex flex-col justify-between">
                    <Briefcase className="w-5 h-5 text-blue-400 mb-2" />
                    <div>
                      <div className="text-2xl font-black text-white font-mono leading-none">
                        {incomeResult.activeScore}
                      </div>
                      <div className="text-[10px] text-white/60 font-medium mt-1">
                        Active Income
                      </div>
                    </div>
                  </div>

                  {/* Purple-outlined Passive Income Card */}
                  <div className="rounded-2xl bg-[#0D0A1E]/90 border border-purple-500/50 p-3 shadow-md flex flex-col justify-between">
                    <TrendingUp className="w-5 h-5 text-purple-400 mb-2" />
                    <div>
                      <div className="text-2xl font-black text-white font-mono leading-none">
                        {incomeResult.passiveScore}
                      </div>
                      <div className="text-[10px] text-white/60 font-medium mt-1">
                        Passive Income
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Green-outlined Full-Width Card: Financial Stability */}
                <div
                  className="w-full rounded-2xl border p-3 flex items-center gap-3 transition-all"
                  style={{
                    backgroundColor: `${incomeResult.stabilityColor}15`,
                    borderColor: `${incomeResult.stabilityColor}60`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${incomeResult.stabilityColor}25`,
                      color: incomeResult.stabilityColor,
                    }}
                  >
                    {incomeResult.stabilityStatus === 'Green' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : incomeResult.stabilityStatus === 'Yellow' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/70 font-medium">
                      Financial Stability
                    </span>
                    <span className="block text-xs font-bold text-white tracking-tight mt-0.5">
                      {incomeResult.stabilityText}
                    </span>
                  </div>
                </div>

                {/* 5. Blue Gradient "Unlock Your Full Financial Roadmap" Card */}
                <div className="w-full rounded-[24px] bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] p-4 text-center shadow-lg shadow-blue-600/30 text-white flex flex-col items-center">
                  <Lock className="w-7 h-7 text-white mb-2" />
                  <h4 className="text-sm font-extrabold text-white leading-snug mb-1.5">
                    Unlock Your Full Financial Roadmap
                  </h4>
                  <p className="text-[10px] text-white/80 leading-relaxed max-w-[240px] mb-3">
                    This is just the beginning. Create a free account to unlock your dashboard, get investment recommendations, and track your expenses.
                  </p>
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-white text-blue-600 hover:bg-white/95 font-bold text-xs shadow transition-all cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>

              </div>
            ) : (
              /* ============================================================== */
              /* WIZARD SCREENS (Steps 0 to 6)                                  */
              /* ============================================================== */
              <div className="w-full rounded-[24px] bg-[#130E26]/95 border border-purple-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_24px_rgba(168,85,247,0.2)] p-4 sm:p-4.5 flex flex-col items-center backdrop-blur-md">
                
                {/* Robot Mascot with Glowing Circle */}
                <div className="relative mb-3 flex items-center justify-center">
                  <div className="absolute w-20 h-20 rounded-full bg-blue-500/25 blur-xl"></div>
                  <div className="relative w-16 h-16 rounded-full bg-blue-600/20 border border-blue-400/40 flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(59,130,246,0.35)]">
                    <img
                      src={mascotImg}
                      alt="MoneyMapper AI Mascot"
                      className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                    />
                  </div>
                </div>

                {/* SCREEN 0: Welcome */}
                {currentStep === 0 && (
                  <div className="w-full flex flex-col items-center text-center animate-fade-in">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Welcome to MoneyMapper!
                    </h3>
                    <p className="text-xs text-white/70 mt-1 mb-4">
                      Let's start by getting to know you.
                    </p>

                    <div className="w-full space-y-2.5 text-left mb-4">
                      {/* First Name Input */}
                      <div>
                        <div className="relative flex items-center rounded-xl bg-[#090417] border border-white/20 px-3 py-2 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/50 transition-all">
                          <User className="w-4 h-4 text-white/50 shrink-0 mr-2.5" />
                          <input
                            type="text"
                            value={formData.first_name}
                            onChange={(e) => handleTextChange('first_name', e.target.value)}
                            placeholder="First Name"
                            className="w-full bg-transparent text-white text-xs placeholder:text-white/40 focus:outline-none"
                          />
                        </div>
                        {errors.first_name && (
                          <p className="text-[9.5px] text-red-400 mt-1 pl-1">{errors.first_name}</p>
                        )}
                      </div>

                      {/* Last Name Input */}
                      <div>
                        <div className="relative flex items-center rounded-xl bg-[#090417] border border-white/20 px-3 py-2 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/50 transition-all">
                          <User className="w-4 h-4 text-white/50 shrink-0 mr-2.5" />
                          <input
                            type="text"
                            value={formData.last_name}
                            onChange={(e) => handleTextChange('last_name', e.target.value)}
                            placeholder="Last Name"
                            className="w-full bg-transparent text-white text-xs placeholder:text-white/40 focus:outline-none"
                          />
                        </div>
                        {errors.last_name && (
                          <p className="text-[9.5px] text-red-400 mt-1 pl-1">{errors.last_name}</p>
                        )}
                      </div>
                    </div>

                    {/* Single Full-Width Next Button */}
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* SCREEN 1: Contact Details */}
                {currentStep === 1 && (
                  <div className="w-full flex flex-col items-center text-center animate-fade-in">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Contact Details
                    </h3>
                    <p className="text-xs text-white/70 mt-1 mb-4">
                      Where can we send your financial report?
                    </p>

                    <div className="w-full space-y-2.5 text-left mb-4">
                      {/* Email Address Input */}
                      <div>
                        <div className="relative flex items-center rounded-xl bg-[#090417] border border-white/20 px-3 py-2.5 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/50 transition-all">
                          <Mail className="w-4 h-4 text-white/60 shrink-0 mr-2.5" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleTextChange('email', e.target.value)}
                            placeholder="Email Address"
                            className="w-full bg-transparent text-white text-xs placeholder:text-white/40 focus:outline-none"
                          />
                        </div>
                        {errors.email && (
                          <p className="text-[9.5px] text-red-400 mt-1 pl-1">{errors.email}</p>
                        )}
                      </div>

                      {/* Mobile Number Input */}
                      <div>
                        <div className="relative flex items-center rounded-xl bg-[#090417] border border-white/20 px-3 py-2.5 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/50 transition-all">
                          <Smartphone className="w-4 h-4 text-white/60 shrink-0 mr-2.5" />
                          <input
                            type="tel"
                            maxLength={10}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={formData.mobile_number}
                            onChange={(e) => handleNumberChange('mobile_number', e.target.value)}
                            placeholder="Mobile Number"
                            className="w-full bg-transparent text-white text-xs placeholder:text-white/40 focus:outline-none"
                          />
                        </div>
                        {errors.mobile_number && (
                          <p className="text-[9.5px] text-red-400 mt-1 pl-1">{errors.mobile_number}</p>
                        )}
                      </div>
                    </div>

                    {/* Back and Next Buttons */}
                    <div className="flex items-center gap-2.5 w-full">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 py-2.5 px-3 rounded-xl border border-white/25 bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs active:scale-[0.98] transition-colors cursor-pointer text-center"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex-[2] py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-[0.98] transition-all cursor-pointer text-center"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* SCREEN 2: Income */}
                {currentStep === 2 && (
                  <div className="w-full flex flex-col items-center text-center animate-fade-in">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Your Income
                    </h3>
                    <p className="text-xs text-white/70 mt-1 mb-5">
                      How much do you earn in a month?
                    </p>

                    <div className="w-full text-left mb-5">
                      <div className="relative flex items-center rounded-xl bg-[#090417] border border-white/20 px-3 py-2.5 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/50 transition-all">
                        <IndianRupee className="w-4 h-4 text-white/60 shrink-0 mr-2.5" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formData.monthly_income}
                          onChange={(e) => handleNumberChange('monthly_income', e.target.value)}
                          placeholder="Monthly Income (₹)"
                          className="w-full bg-transparent text-white text-xs placeholder:text-white/40 focus:outline-none"
                        />
                      </div>
                      {errors.monthly_income && (
                        <p className="text-[9.5px] text-red-400 mt-1 pl-1">{errors.monthly_income}</p>
                      )}
                    </div>

                    {/* Back and Next Buttons */}
                    <div className="flex items-center gap-2.5 w-full">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 py-2.5 px-3 rounded-xl border border-white/25 bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs active:scale-[0.98] transition-colors cursor-pointer text-center"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex-[2] py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-[0.98] transition-all cursor-pointer text-center"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* SCREEN 3: Expenses */}
                {currentStep === 3 && (
                  <div className="w-full flex flex-col items-center text-center animate-fade-in">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Your Expenses
                    </h3>
                    <div className="text-xs text-white/70 mt-1 mb-5">
                      <p>What are your fixed expenses for the month?</p>
                      <p className="text-[10px] text-white/50 mt-0.5">
                        (e.g., rent, utilities, subscriptions)
                      </p>
                    </div>

                    <div className="w-full text-left mb-5">
                      <div className="relative flex items-center rounded-xl bg-[#090417] border border-white/20 px-3 py-2.5 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/50 transition-all">
                        <CreditCard className="w-4 h-4 text-white/60 shrink-0 mr-2.5" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formData.fixed_expenses}
                          onChange={(e) => handleNumberChange('fixed_expenses', e.target.value)}
                          placeholder="Fixed Expenses (₹)"
                          className="w-full bg-transparent text-white text-xs placeholder:text-white/40 focus:outline-none"
                        />
                      </div>
                      {errors.fixed_expenses && (
                        <p className="text-[9.5px] text-red-400 mt-1 pl-1">{errors.fixed_expenses}</p>
                      )}
                    </div>

                    {/* Back and Next Buttons */}
                    <div className="flex items-center gap-2.5 w-full">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 py-2.5 px-3 rounded-xl border border-white/25 bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs active:scale-[0.98] transition-colors cursor-pointer text-center"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex-[2] py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-[0.98] transition-all cursor-pointer text-center"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* SCREEN 4: Liabilities */}
                {currentStep === 4 && (
                  <div className="w-full flex flex-col items-center text-center animate-fade-in">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Liabilities
                    </h3>
                    <p className="text-xs text-white/70 mt-1 mb-5">
                      Do you have any loans? (Enter 0 if none)
                    </p>

                    <div className="w-full text-left mb-5">
                      <div className="relative flex items-center rounded-xl bg-[#090417] border border-white/20 px-3 py-2.5 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/50 transition-all">
                        <Landmark className="w-4 h-4 text-white/60 shrink-0 mr-2.5" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formData.total_loan_emi}
                          onChange={(e) => handleNumberChange('total_loan_emi', e.target.value)}
                          placeholder="Total Loan EMI (₹)"
                          className="w-full bg-transparent text-white text-xs placeholder:text-white/40 focus:outline-none"
                        />
                      </div>
                      {errors.total_loan_emi && (
                        <p className="text-[9.5px] text-red-400 mt-1 pl-1">{errors.total_loan_emi}</p>
                      )}
                    </div>

                    {/* Back and Next Buttons */}
                    <div className="flex items-center gap-2.5 w-full">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 py-2.5 px-3 rounded-xl border border-white/25 bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs active:scale-[0.98] transition-colors cursor-pointer text-center"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex-[2] py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-[0.98] transition-all cursor-pointer text-center"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* SCREEN 5: Expenditure */}
                {currentStep === 5 && (
                  <div className="w-full flex flex-col items-center text-center animate-fade-in">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Expenditure
                    </h3>
                    <div className="text-xs text-white/70 mt-1 mb-5">
                      <p>What's the approximate miscellaneous expenditure for the month?</p>
                      <p className="text-[10px] text-white/50 mt-0.5">
                        (e.g., dining out, entertainment, shopping)
                      </p>
                    </div>

                    <div className="w-full text-left mb-5">
                      <div className="relative flex items-center rounded-xl bg-[#090417] border border-white/20 px-3 py-2.5 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/50 transition-all">
                        <Receipt className="w-4 h-4 text-white/60 shrink-0 mr-2.5" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formData.monthly_expenditure}
                          onChange={(e) => handleNumberChange('monthly_expenditure', e.target.value)}
                          placeholder="Monthly Expenditure (₹)"
                          className="w-full bg-transparent text-white text-xs placeholder:text-white/40 focus:outline-none"
                        />
                      </div>
                      {errors.monthly_expenditure && (
                        <p className="text-[9.5px] text-red-400 mt-1 pl-1">{errors.monthly_expenditure}</p>
                      )}
                    </div>

                    {/* Back and Next Buttons */}
                    <div className="flex items-center gap-2.5 w-full">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 py-2.5 px-3 rounded-xl border border-white/25 bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs active:scale-[0.98] transition-colors cursor-pointer text-center"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex-[2] py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-[0.98] transition-all cursor-pointer text-center"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* SCREEN 6: Final Details */}
                {currentStep === 6 && (
                  <div className="w-full flex flex-col items-center text-center animate-fade-in">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Final Details
                    </h3>
                    <p className="text-xs text-white/70 mt-1 mb-4">
                      Where do you live, and do you have passive income?
                    </p>

                    <div className="w-full space-y-3.5 text-left mb-4">
                      {/* City Tier Dropdown */}
                      <div className="relative flex items-center rounded-xl bg-[#090417] border border-white/20 px-3 py-2 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/50 transition-all">
                        <Building2 className="w-4 h-4 text-white/60 shrink-0 mr-2.5" />
                        <div className="flex-1 relative">
                          <label className="block text-[8px] uppercase tracking-wider text-white/40 font-semibold mb-0.5">
                            City Tier
                          </label>
                          <select
                            value={formData.city_tier}
                            onChange={(e) => handleTextChange('city_tier', e.target.value)}
                            className="w-full bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer appearance-none pr-5"
                          >
                            {CITY_TIERS.map((tier) => (
                              <option key={tier} value={tier} className="bg-[#130E26] text-white">
                                {tier}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-white/50 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Passive Income Toggle Row */}
                      <div className="flex items-center justify-between px-1 py-1">
                        <span className="text-xs text-white/80 font-medium">
                          Do you have passive income?
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={formData.has_passive_income}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              has_passive_income: !prev.has_passive_income,
                            }))
                          }
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            formData.has_passive_income ? 'bg-blue-600' : 'bg-white/20'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              formData.has_passive_income ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Passive Income Amount Input (conditional on toggle) */}
                      {formData.has_passive_income && (
                        <div className="animate-fade-in">
                          <div className="relative flex items-center rounded-xl bg-[#090417] border border-white/20 px-3 py-2.5 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/50 transition-all">
                            <IndianRupee className="w-4 h-4 text-white/60 shrink-0 mr-2.5" />
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={formData.passive_income_amount}
                              onChange={(e) => handleNumberChange('passive_income_amount', e.target.value)}
                              placeholder="Passive Income Amount (₹)"
                              className="w-full bg-transparent text-white text-xs placeholder:text-white/40 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Back and Analyze My Score Buttons */}
                    <div className="flex items-center gap-2.5 w-full">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 py-2.5 px-3 rounded-xl border border-white/25 bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs active:scale-[0.98] transition-colors cursor-pointer text-center"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex-[2] py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-[0.98] transition-all cursor-pointer text-center"
                      >
                        Analyze My Score
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Bottom Step Indicator Dots (shown during wizard steps 0 to 6) */}
            {currentStep < 7 && (
              <div className="flex justify-center items-center gap-1.5 pt-2 pb-1">
                {[0, 1, 2, 3, 4, 5, 6].map((stepIdx) => (
                  <div
                    key={stepIdx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      stepIdx === currentStep
                        ? 'w-5 bg-gradient-to-r from-blue-500 to-purple-500'
                        : 'w-1.5 bg-white/20'
                    }`}
                  />
                ))}
              </div>
            )}

          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="w-full pb-1.5 pt-0.5 bg-[#0D0524]/60 flex justify-center shrink-0 z-20">
            <div className="w-28 h-1 bg-white/30 rounded-full"></div>
          </div>

        </div>
      </div>
    </div>
  );
};

/* ========================================================================== */
/* MAIN EXPORT: Switches between Onboarding (Top) & Dashboard (Bottom)        */
/* ========================================================================== */
export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  className = '',
  style,
  showOnboarding = false,
}) => {
  if (showOnboarding) {
    return <OnboardingPhoneMockup className={className} style={style} />;
  }

  return <DashboardPhoneMockup className={className} style={style} />;
};

export default PhoneMockup;
