import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Search } from 'lucide-react';

type LockSize = 'card' | 'inline' | 'small';

interface ProLockOverlayProps {
  description: string;
  testId?: string;
  size?: LockSize;
}

export const ProLockOverlay: React.FC<ProLockOverlayProps> = ({
  description,
  testId,
  size = 'card',
}) => {
  const navigate = useNavigate();
  const sizeClasses: Record<LockSize, string> = {
    card: 'max-w-[240px] p-4',
    inline: 'max-w-none flex-row gap-3 p-3 text-left',
    small: 'max-w-[180px] p-3',
  };

  return (
    <div
      data-testid={testId}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-amber-300/80 bg-white/95 text-center shadow-xl dark:border-amber-700 dark:bg-slate-950/95 ${sizeClasses[size]}`}
    >
      <span className={`flex shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/25 ${size === 'small' ? 'h-9 w-9' : 'h-11 w-11'}`}>
        <Lock className={size === 'small' ? 'h-4 w-4' : 'h-5 w-5'} />
      </span>
      <div className={size === 'inline' ? 'min-w-0 flex-1' : ''}>
        <strong className="block text-[10px] font-black tracking-widest text-amber-700 dark:text-amber-300">PRO ONLY</strong>
        <p className="mt-0.5 text-xs font-semibold leading-snug text-slate-600 dark:text-slate-300">{description}</p>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          navigate('/subscription');
        }}
        className="rounded-lg bg-brand-gradient px-3 py-2 text-[10px] font-black text-white shadow-md shadow-brand-purple/20 transition hover:opacity-95 active:scale-[0.98]"
      >
        Upgrade to PRO
      </button>
    </div>
  );
};

interface LockedPlaceholderProps {
  kind: 'stock' | 'fund';
  index: number;
  onClick?: () => void;
}

const BAR_WIDTHS = ['w-8', 'w-11', 'w-14', 'w-10', 'w-12', 'w-7'];

const PlaceholderBar: React.FC<{ index: number; tall?: boolean }> = ({ index, tall = false }) => (
  <span
    aria-hidden="true"
    className={`block animate-pulse rounded-full bg-slate-200 dark:bg-slate-700 ${BAR_WIDTHS[index % BAR_WIDTHS.length]} ${tall ? 'h-3' : 'h-2'}`}
  />
);

const PlaceholderLockPill: React.FC = () => (
  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
    <Lock className="h-3 w-3" /> PRO
  </span>
);

export const LockedRowPlaceholder: React.FC<LockedPlaceholderProps> = ({ kind, index, onClick }) => {
  const testPrefix = kind === 'stock' ? 'stock' : 'mf';

  return (
    <tr
      data-testid={`${testPrefix}-card-${index}`}
      onClick={onClick}
      className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
      aria-label="Locked PRO data"
    >
      {kind === 'stock' ? (
        <>
          <td className="px-4 py-4">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="font-black text-slate-400">••••••</span>
              <span data-testid={`stock-lock-overlay-${index}`}><PlaceholderLockPill /></span>
            </div>
          </td>
          {[1, 2, 3, 4, 5, 6].map((column) => (
            <td key={column} className="px-4 py-4">
              {column === 2 ? <PlaceholderLockPill /> : <PlaceholderBar index={index + column} tall={column === 1} />}
            </td>
          ))}
          <td className="px-4 py-4 text-right">
            <button type="button" disabled className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-[10px] font-black text-amber-700 dark:bg-amber-950/70 dark:text-amber-300">
              <Lock className="h-3 w-3" /> PRO
            </button>
          </td>
        </>
      ) : (
        <>
          <td className="px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800"><Lock className="h-3.5 w-3.5" /></span>
              <span data-testid={`mf-lock-overlay-${index}`} className="flex flex-col gap-1.5">
                <PlaceholderBar index={index} tall />
                <PlaceholderBar index={index + 1} />
              </span>
            </div>
          </td>
          <td className="px-4 py-4"><PlaceholderLockPill /></td>
          {[2, 3, 4, 5].map((column) => (
            <td key={column} className="px-4 py-4"><PlaceholderBar index={index + column} tall /></td>
          ))}
          <td className="px-4 py-4 text-right">
            <button type="button" disabled className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-[10px] font-black text-amber-700 dark:bg-amber-950/70 dark:text-amber-300">
              <Lock className="h-3 w-3" /> PRO
            </button>
          </td>
        </>
      )}
    </tr>
  );
};

export const LockedCardPlaceholder: React.FC<LockedPlaceholderProps> = ({ kind, index, onClick }) => {
  const testPrefix = kind === 'stock' ? 'stock' : 'mf';

  return (
    <div
      data-testid={`${testPrefix}-card-${index}`}
      onClick={onClick}
      className="relative min-h-[220px] cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      aria-label="Locked PRO data"
    >
      <div aria-hidden="true" className="pointer-events-none space-y-4 opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-2"><PlaceholderBar index={index} tall /><PlaceholderBar index={index + 1} /></div>
          </div>
          <PlaceholderBar index={index + 2} />
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          {[0, 1, 2].map((bar) => <div key={bar} className="space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><PlaceholderBar index={index + bar + 2} /><PlaceholderBar index={index + bar + 3} tall /></div>)}
        </div>
      </div>
      <div data-testid={`${testPrefix}-lock-overlay-${index}`} className="absolute inset-0 flex items-center justify-center bg-white/30 dark:bg-slate-950/30">
        <ProLockOverlay size="small" description={kind === 'stock' ? 'Unlock this stock signal' : 'Unlock this fund score'} />
      </div>
    </div>
  );
};

interface ProUpsellBlockProps {
  count: number;
  itemLabel: 'signals' | 'fund scores';
}

export const ProUpsellBlock: React.FC<ProUpsellBlockProps> = ({ count, itemLabel }) => {
  const navigate = useNavigate();
  return (
    <div className="relative mt-3 overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-r from-white via-indigo-50 to-amber-50 p-5 text-center shadow-sm dark:border-indigo-900 dark:from-slate-900 dark:via-indigo-950/60 dark:to-slate-900 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 -top-8 h-14 bg-gradient-to-b from-transparent to-white/80 dark:to-slate-900/80" />
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-md shadow-amber-500/20"><Lock className="h-5 w-5" /></span>
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Unlock all {count}+ {itemLabel}</h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Get access to every score, signal and detailed market metric.</p>
        </div>
        <button type="button" onClick={() => navigate('/subscription')} className="rounded-xl bg-brand-gradient px-5 py-2.5 text-xs font-black text-white shadow-md shadow-brand-purple/20 transition hover:opacity-95 active:scale-[0.98]">
          Upgrade to PRO
        </button>
      </div>
    </div>
  );
};

interface ProSearchLockProps {
  inputTestId: string;
  lockTestId: string;
  placeholder: string;
  ariaLabel: string;
}

export const ProSearchLock: React.FC<ProSearchLockProps> = ({ inputTestId, lockTestId, placeholder, ariaLabel }) => {
  const navigate = useNavigate();
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate('/subscription');
    }
  };

  return (
    <div
      data-testid={lockTestId}
      role="button"
      tabIndex={0}
      aria-label={`${ariaLabel} Search is a PRO feature`}
      onClick={() => navigate('/subscription')}
      onKeyDown={handleKeyDown}
      className="relative cursor-pointer rounded-2xl"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 text-slate-400"><Search className="h-4 w-4" /></div>
      <input
        type="text"
        data-testid={inputTestId}
        disabled
        aria-disabled="true"
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-100 py-3 pl-9 pr-24 text-sm font-semibold text-slate-500 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:placeholder:text-slate-400"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[9px] font-black tracking-wider text-amber-800 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
        <Lock className="h-3 w-3" /> PRO
      </span>
    </div>
  );
};