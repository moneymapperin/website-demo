import { useNavigate } from 'react-router-dom';

export function PreviewBanner() {
  const navigate = useNavigate();
  const isPreview = localStorage.getItem('mm_preview_mode') === 'true';

  if (!isPreview) return null;

  const handleExit = () => {
    localStorage.removeItem('mm_preview_mode');
    window.location.href = '/login';
  };

  return (
    <div className="fixed top-0 left-0 w-full z-[9999] bg-warning text-warning-foreground py-1 px-4 text-center text-sm font-bold shadow-md flex justify-center items-center gap-4">
      <span>You are in UI Preview Mode. Data is mocked and not saved.</span>
      <button 
        onClick={handleExit}
        className="px-2 py-0.5 bg-black/20 hover:bg-black/30 rounded text-xs cursor-pointer border-none text-white"
      >
        Exit Preview
      </button>
    </div>
  );
}
