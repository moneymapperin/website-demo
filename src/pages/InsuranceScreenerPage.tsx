import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Search, Lock, Shield, X, Heart, Star, ChevronRight, CheckCircle2 } from 'lucide-react';
import { apiService } from '../services/apiService';
import { usePlan } from '../hooks/usePlan';
import { useToast } from '../context/ToastContext';
import { ScoreCardAdvisor } from '../services/marketAdvisor';
import { ResilienceUtils } from '../services/resilienceUtils';

export function formatCover(val: any): string {
  const value = ResilienceUtils.safeDouble(val);
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `₹${Math.round(value / 100000)} Lakh`;
  return `₹${Math.round(value)}`;
}

const COMPANY_DOMAINS: Record<string, string> = {
  'hdfc ergo': 'hdfcergo.com',
  'hdfc life': 'hdfclife.com',
  hdfc: 'hdfclife.com',
  'max life': 'maxlifeinsurance.com',
  max: 'maxlifeinsurance.com',
  'icici lombard': 'icicilombard.com',
  'icici prudential': 'iciciprulife.com',
  icici: 'iciciprulife.com',
  'niva bupa': 'nivabupa.com',
  niva: 'nivabupa.com',
  bupa: 'nivabupa.com',
  'star health': 'starhealth.in',
  star: 'starhealth.in',
  'care health': 'careinsurance.com',
  care: 'careinsurance.com',
  'tata aia': 'tataaia.com',
  tata: 'tataaia.com',
  'sbi life': 'sbilife.co.in',
  sbi: 'sbilife.co.in',
  'bajaj allianz': 'bajajallianz.com',
  bajaj: 'bajajallianz.com',
  'aditya birla': 'adityabirlacapital.com',
  aditya: 'adityabirlacapital.com',
  lic: 'licindia.in',
  'go digit': 'godigit.com',
  digit: 'godigit.com',
  acko: 'acko.com',
  chola: 'cholamandalam.com',
  kotak: 'kotaklife.com',
  religare: 'careinsurance.com',
  reliance: 'reliancenipponlife.com',
  oriental: 'orientalinsurance.org.in',
  national: 'nationalinsurance.nic.in',
  'new india': 'newindia.co.in',
};

export const CompanyLogo: React.FC<{ company?: string }> = ({ company = '' }) => {
  const [logoStage, setLogoStage] = useState<number>(1); // 1 = Unavatar, 2 = IconHorse, 3 = Google Favicons, 4 = Fallback Letter
  const cleanName = company.trim();
  const lowerName = cleanName.toLowerCase();

  let domain = '';
  const sortedKeys = Object.keys(COMPANY_DOMAINS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lowerName.includes(key)) {
      domain = COMPANY_DOMAINS[key];
      break;
    }
  }

  if (!domain && cleanName) {
    const firstWord = lowerName.split(' ')[0].replace(/[^a-z0-9]/gi, '');
    if (firstWord.length > 2) {
      domain = `${firstWord}.com`;
    }
  }

  const getLogoSrc = () => {
    if (!domain) return null;
    if (logoStage === 1) return `https://unavatar.io/${domain}`;
    if (logoStage === 2) return `https://icon.horse/icon/${domain}`;
    if (logoStage === 3) return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    return null;
  };

  const logoSrc = getLogoSrc();
  const firstLetter = cleanName ? cleanName.charAt(0).toUpperCase() : 'I';

  if (!logoSrc || logoStage >= 4) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0 border border-indigo-400/30 select-none">
        {firstLetter}
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-2xl bg-white p-2 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm overflow-hidden relative">
      <img
        src={logoSrc}
        alt={cleanName}
        onError={() => setLogoStage((prev) => prev + 1)}
        className="w-full h-full object-contain object-center max-w-full max-h-full transition-transform duration-300 group-hover:scale-105 select-none"
      />
    </div>
  );
};

export const InsuranceScreenerPage: React.FC = () => {
  const navigate = useNavigate();
  const { isPro } = usePlan();
  const { showToast } = useToast();

  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedPlanForAdvice, setSelectedPlanForAdvice] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const plans = await apiService.getInsurancePlans();
      setAllPlans(plans || []);
    } catch (e) {
      console.error('Failed to fetch insurance plans:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter logic matching Dart
  const filteredPlans = allPlans.filter((p) => {
    const q = searchQuery.toLowerCase();
    const nameMatch =
      !q ||
      (p.company?.toString().toLowerCase().includes(q) ?? false) ||
      (p.policy?.toString().toLowerCase().includes(q) ?? false);
    const typeMatch = selectedType === 'All' || p.insurance_type === selectedType;
    return nameMatch && typeMatch;
  });

  const handleTypeClick = (type: string) => {
    if (!isPro) {
      showToast({
        message: 'Upgrade to PRO to unlock Category Filters! 🚀',
        backgroundColor: '#F59E0B',
        action: {
          label: 'UPGRADE',
          onClick: () => navigate('/subscription'),
        },
      });
      return;
    }
    setSelectedType(type);
  };

  const handlePlanClick = (plan: any, index: number) => {
    const isLocked = !isPro && index > 0;
    if (isLocked) {
      showToast({
        message: 'Upgrade to PRO to unlock all insurance score card! 🚀',
        backgroundColor: '#F59E0B',
        action: {
          label: 'UPGRADE',
          onClick: () => navigate('/subscription'),
        },
      });
      return;
    }
    setSelectedPlanForAdvice(plan);
  };

  return (
    <div className="min-h-screen pb-20 transition-colors duration-200" data-testid="insurance-screener-page">
      {/* 1. App Bar Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3.5 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="insurance-back-button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Insurance Score Card
            </h1>
          </div>

          <button
            type="button"
            data-testid="insurance-refresh-button"
            onClick={fetchData}
            className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
            aria-label="Refresh Plans"
            title="Refresh Insurance Plans"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* 2. Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        {/* Top Hero Banner Matching Image 3 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 dark:from-[#170E38] dark:via-[#100D28] dark:to-[#0A0B14] text-white shadow-xl border border-indigo-400/20 dark:border-indigo-500/20 relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-white/15 border border-white/20 text-white dark:text-indigo-300 shadow-md">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Insurance Score Card
              </h1>
              <p className="text-xs md:text-sm text-indigo-100 dark:text-zinc-400 mt-0.5">
                Compare insurance plans and find the best cover for your needs.
              </p>
            </div>
          </div>

          {/* Right Quote Glass Banner */}
          <div className="relative z-10 max-w-md p-3.5 rounded-2xl bg-white/10 dark:bg-indigo-950/40 border border-white/20 dark:border-indigo-500/20 backdrop-blur-md flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 dark:bg-indigo-500/20 text-white dark:text-indigo-300 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold italic text-indigo-50 dark:text-indigo-200">
              &ldquo;Right insurance today builds a safer and more confident tomorrow.&rdquo;
            </p>
          </div>
        </div>

        {/* 3. Search Bar & Category Filter Tabs */}
        <div className="bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 rounded-3xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div className="relative">
            <div className={`relative ${!isPro ? 'filter blur-xs select-none' : ''}`}>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                data-testid="insurance-search-input"
                disabled={!isPro}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isPro ? 'Search company or policy...' : 'Search locked for Free users'}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-200 dark:border-indigo-500/30 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {!isPro && (
              <div
                data-testid="insurance-search-locked"
                onClick={() => navigate('/subscription')}
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
              >
                <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] font-black tracking-wider uppercase shadow-sm">
                  <Lock className="w-3 h-3" />
                  <span>PRO SEARCH</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['All', 'Health', 'Life'].map((type) => {
              const isActive = selectedType === type;
              return (
                <div key={type} className="relative">
                  <button
                    type="button"
                    data-testid={`insurance-type-${type.toLowerCase()}`}
                    onClick={() => handleTypeClick(type)}
                    className={`w-full py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      !isPro ? 'filter blur-xs select-none pointer-events-none' : ''
                    } ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                        : 'bg-slate-50 dark:bg-[#14102B] border border-slate-200/80 dark:border-indigo-500/15 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {type === 'Health' && <Heart className="w-3.5 h-3.5 text-rose-400" />}
                    {type === 'Life' && <Shield className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{type}</span>
                  </button>

                  {!isPro && (
                    <div
                      onClick={() => handleTypeClick(type)}
                      className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/10 dark:bg-black/20 rounded-2xl"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Plans List Stream */}
        {loading ? (
          <div className="py-20 text-center text-slate-400" data-testid="insurance-loading-state">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-semibold text-sm">Loading insurance score cards...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="py-16 text-center text-slate-400" data-testid="insurance-empty-state">
            <p className="font-semibold text-sm">No insurance plans match your search</p>
          </div>
        ) : (
          <div className="space-y-4">
            {!isPro && (
              <div
                data-testid="insurance-pro-banner"
                onClick={() => navigate('/subscription')}
                className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center gap-3 cursor-pointer shadow-sm"
              >
                <Lock className="w-4 h-4 shrink-0" />
                <p className="text-xs font-bold">
                  Free users see only 1 expert pick. Upgrade to PRO to see all insurance score cards! 🚀
                </p>
              </div>
            )}

            {filteredPlans.map((p, idx) => {
              const isLocked = !isPro && idx > 0;
              const score = Math.round(ResilienceUtils.safeDouble(p.smart_score || p.score));
              const csr = ResilienceUtils.safeDouble(p.claim_ratio || p.claim_settlement_ratio).toFixed(1);
              const coverFormatted = formatCover(p.cover || p.cover_amount);

              return (
                <div
                  key={p.id || idx}
                  data-testid={`insurance-card-${idx}`}
                  onClick={() => handlePlanClick(p, idx)}
                  className="group relative bg-white dark:bg-[#0E0B1F] border border-slate-200/80 dark:border-indigo-500/20 rounded-3xl p-5 md:p-6 shadow-sm dark:shadow-xl cursor-pointer hover:border-indigo-500 transition-all duration-200"
                >
                  <div className={`grid grid-cols-1 lg:grid-cols-12 gap-5 items-center ${isLocked ? 'filter blur-[5px] select-none pointer-events-none' : ''}`}>
                    {/* Left Info Column (5 cols) */}
                    <div className="lg:col-span-5 flex items-center gap-4">
                      <CompanyLogo company={p.company} />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                            {p.company || 'Unknown Company'}
                          </h3>
                        </div>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {p.policy || ''}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {p.is_verified === true && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                              VERIFIED
                            </span>
                          )}
                          {p.has_copay === false && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase">
                              NO CO-PAY
                            </span>
                          )}
                          {p.pre_existing_cover === true && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase">
                              PED COVER
                            </span>
                          )}
                          {p.critical_illness_cover === true && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase">
                              CRITICAL COVER
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] italic text-slate-500 dark:text-zinc-400 pt-0.5">
                          Best for: {p.best_for || 'General protection'}
                        </p>
                      </div>
                    </div>

                    {/* Middle Stats Columns (5 cols) */}
                    <div className="lg:col-span-5 grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#14102B] border border-slate-100 dark:border-indigo-500/15 text-center transition-colors">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                          <Shield className="w-3 h-3 text-indigo-500" />
                          <span className="text-[9px] font-black uppercase tracking-wider">Type</span>
                        </div>
                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{p.insurance_type || 'N/A'}</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span className="text-[9px] font-black uppercase tracking-wider">Cover</span>
                        </div>
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{coverFormatted}</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-[9px] font-black uppercase tracking-wider">CSR</span>
                        </div>
                        <p className="text-xs font-black text-amber-600 dark:text-amber-400">{csr}%</p>
                      </div>
                    </div>

                    {/* Right Score Circle & Navigation Arrow (2 cols) */}
                    <div className="lg:col-span-2 flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">SCORE</span>
                        <div className="w-12 h-12 rounded-full border-2 border-indigo-500 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-sm shadow-xs bg-indigo-500/5">
                          {score}
                        </div>
                      </div>

                      <div className="w-9 h-9 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {isLocked && (
                    <div
                      data-testid={`insurance-lock-overlay-${idx}`}
                      className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider mt-1.5 drop-shadow">
                        PRO UNLOCK
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Insurance Plan Advice Modal */}
      {selectedPlanForAdvice && (
        <div
          data-testid="insurance-advice-modal"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-[#0E0B1F] rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-indigo-500/30 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Insurance Plan Details
              </span>
              <button
                type="button"
                onClick={() => setSelectedPlanForAdvice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs md:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-mono">
              {ScoreCardAdvisor.generateInsuranceDetails(selectedPlanForAdvice)}
            </div>
            <button
              type="button"
              onClick={() => setSelectedPlanForAdvice(null)}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

