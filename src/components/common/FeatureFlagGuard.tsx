import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { useFeatureFlags } from '../../context/FeatureFlagContext';
import { FeatureKey } from '../../services/featureFlagService';
import { APP_COLORS } from '../../theme/tokens';

export interface FeatureFlagGuardProps {
  featureKey: FeatureKey;
  children: React.ReactNode;
}

export const FeatureFlagGuard: React.FC<FeatureFlagGuardProps> = ({ featureKey, children }) => {
  const navigate = useNavigate();
  const { isEnabled, isLoading } = useFeatureFlags();

  if (isLoading) {
    return (
      <div
        data-testid="feature-flag-loading"
        className="w-full min-h-[60vh] flex items-center justify-center"
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: APP_COLORS.primary, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (isEnabled(featureKey)) {
    return <>{children}</>;
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const primaryAlpha20 = `${APP_COLORS.primary}33`; // 20% opacity of primary color

  return (
    <div
      data-testid="feature-flag-locked"
      className="relative w-full min-h-[calc(100vh-8rem)] flex-1 flex flex-col justify-center items-center overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(to bottom right, #1F1F2E, #12121A)',
      }}
    >
      {/* Top Coming Soon Title */}
      <div className="absolute top-0 left-0 right-0 px-6 py-5 z-20">
        <span className="text-sm md:text-base font-semibold text-white/70 tracking-wider">
          Coming Soon
        </span>
      </div>

      {/* Blurred Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[10px] flex flex-col items-center justify-center p-6 text-center z-10">
        <div
          className="p-6 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: primaryAlpha20 }}
        >
          <Rocket size={64} style={{ color: APP_COLORS.primary }} />
        </div>

        <h2 className="text-[28px] font-bold tracking-wide text-white mb-3">
          Live Soon
        </h2>

        <p className="text-white/70 text-[16px] leading-relaxed text-center max-w-sm mb-10">
          We are putting the final touches on this feature. Stay tuned!
        </p>

        <button
          type="button"
          data-testid="feature-flag-back-btn"
          onClick={handleGoBack}
          style={{ backgroundColor: APP_COLORS.primary }}
          className="px-8 py-3.5 rounded-full text-white font-bold text-base shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default FeatureFlagGuard;
