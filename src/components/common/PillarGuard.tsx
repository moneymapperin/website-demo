import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../../hooks/usePlan';
import { useToast } from '../../context/ToastContext';

interface PillarGuardProps {
  pillarName: 'insurance' | 'investments' | 'emergency' | 'income' | 'expenses';
  children: React.ReactNode;
}

export const PillarGuard: React.FC<PillarGuardProps> = ({ pillarName, children }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isPro, isFeatureAccessible, canAccessPremium } = usePlan();
  const hasAlertedRef = useRef(false);

  // Free pillars are never gated
  const isFreePillar = pillarName === 'income' || pillarName === 'expenses';
  // Unified rule: Pro OR Trial Active (canAccessPremium)
  const canAccess = isFreePillar || (canAccessPremium !== undefined ? canAccessPremium : (isPro || isFeatureAccessible));

  useEffect(() => {
    if (!canAccess && !hasAlertedRef.current) {
      hasAlertedRef.current = true;
      showToast({
        message: 'Upgrade to PRO to unlock this pillar! 🚀',
        backgroundColor: '#8B5CF6',
        action: {
          label: 'UPGRADE',
          onClick: () => navigate('/subscription'),
        },
      });
    }
  }, [canAccess, showToast, navigate]);

  if (canAccess) {
    return <>{children}</>;
  }

  const pillarTitles: Record<string, string> = {
    insurance: 'Insurance & Protection Pillar',
    investments: 'Mutual Funds & Investment Pillar',
    emergency: 'Emergency Readiness Pillar',
  };

  const title = pillarTitles[pillarName] || 'Financial Pillar';

  return (
    <div
      data-testid="pillar-locked-view"
      className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-[var(--color-card)] border border-[var(--color-border)] text-center shadow-xl"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
        🔒
      </div>
      <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">{title} is Locked</h2>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        Upgrade to PRO to unlock this pillar! Get complete access to customized gap analysis, allocation
        benchmarks, and advanced advisory tools.
      </p>
      <button
        type="button"
        data-testid="upgrade-to-pro-cta"
        onClick={() => navigate('/subscription')}
        className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-95"
      >
        Upgrade to PRO 🚀
      </button>
    </div>
  );
};
