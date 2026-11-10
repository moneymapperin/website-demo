import React from 'react';
import { User, ArrowRight } from 'lucide-react';
import { navigateTo } from '../lib/navigation';

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

const teamMembers: TeamMember[] = [
  {
    id: 'sagar-nigam',
    name: 'Sagar Nigam',
    role: 'Founder and CEO',
  },
  {
    id: 'sahil-nigam',
    name: 'Sahil Nigam',
    role: 'Co-founder and COO',
  },
  {
    id: 'suneet',
    name: 'Suneet',
    role: 'CTO',
  },
  {
    id: 'saket',
    name: 'Saket',
    role: 'Head of Marketing',
  },
];

export const TeamSection: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 text-left">
      <div className="max-w-4xl">
        {/* Eyebrow */}
        <p className="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-3">
          THE TEAM
        </p>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-tight leading-[1.2]">
          Built by{' '}
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
            MONEYMAPPER Private Limited
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mt-3 text-sm sm:text-base text-white/60 font-normal leading-relaxed max-w-2xl">
          A DPIIT-recognised startup from Madhya Pradesh, working to make financial discipline simple for every Indian.
        </p>
      </div>

      {/* Four Cards in One Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mt-10 sm:mt-12">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="group rounded-2xl border border-white/[0.08] bg-[#141026]/80 backdrop-blur-sm p-6 sm:p-7 flex flex-col justify-between hover:border-purple-500/40 hover:bg-[#181330]/90 transition-all duration-300 shadow-lg shadow-black/40 text-left"
          >
            <div>
              {/* Generic Person Icon Container */}
              <div className="w-11 h-11 rounded-xl bg-purple-900/25 border border-purple-500/20 flex items-center justify-center text-purple-300 mb-5 group-hover:scale-105 transition-transform duration-300">
                <User className="w-5 h-5 text-purple-300" />
              </div>

              {/* Name */}
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {member.name}
              </h3>

              {/* Role */}
              <p className="text-xs sm:text-sm text-white/50 font-normal leading-relaxed mt-1.5">
                {member.role}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Link at Bottom Left */}
      <div className="mt-10 sm:mt-12 flex items-center">
        <button
          type="button"
          onClick={() => navigateTo('/about')}
          className="text-purple-400 hover:text-purple-300 font-semibold text-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <span>Read our story</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};

export default TeamSection;

