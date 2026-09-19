import React from 'react';
import { Link } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description = 'This feature is being ported from the mobile application.',
}) => {
  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-xl font-bold">
          MM
        </div>
        <h1 className="text-2xl font-bold text-white mb-2" data-testid="page-title">
          {title}
        </h1>
        <p className="text-white/60 text-sm mb-6">{description}</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-all border border-white/10"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default PlaceholderPage;
