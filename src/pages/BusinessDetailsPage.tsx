import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const BusinessDetailsPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('51-200');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [planType, setPlanType] = useState('wellness');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = 'MoneyMapper Business - Full Details';
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !companyName.trim()) {
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0a14] text-white font-['Plus_Jakarta_Sans',sans-serif] px-4 py-12 sm:py-16">
      <div className="max-w-[720px] mx-auto">
        {/* Navigation link */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[#a09cb3] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {/* Eyebrow */}
        <p className="text-center text-[#b9a6f5] text-xs sm:text-[13px] tracking-[0.25em] uppercase font-semibold">
          MONEYMAPPER FOR BUSINESS
        </p>

        {/* Heading */}
        <h1 className="text-center text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight mt-3 mb-3">
          Financial wellness for{' '}
          <span className="bg-gradient-to-r from-[#8b5cf6] via-[#d946ef] to-[#ec4899] bg-clip-text text-transparent">
            your whole team
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-center text-[#a09cb3] text-sm sm:text-base leading-relaxed mb-9 max-w-xl mx-auto">
          Reduce money stress, improve retention, and give leadership aggregate insights while every employee gets a private, full personal finance app at ₹199/seat/month.
        </p>

        {/* Form / Success Card */}
        {submitted ? (
          <div className="bg-[#131122] border border-[#26213d] rounded-[18px] p-8 sm:p-10 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Thank you for your interest!</h2>
            <p className="text-[#a09cb3] text-sm max-w-md mx-auto leading-relaxed">
              We have received your details for <span className="text-white font-semibold">{companyName}</span>. Our enterprise partnerships team will contact you within 24 hours with a custom pilot plan.
            </p>
            <div className="pt-4">
              <Link
                to="/"
                className="inline-block px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] via-[#d946ef] to-[#ec4899] text-white font-bold text-sm shadow-lg shadow-purple-600/30"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-[#131122] border border-[#26213d] rounded-[18px] p-6 sm:p-8 space-y-5 shadow-2xl"
          >
            {/* Row 1: Full Name & Work Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#d9d4ee]">
                  Full Name <span className="text-[#f472b6]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="bg-[#0e0c1a] border border-[#26213d] rounded-xl px-3.5 py-3 text-white placeholder-[#6f6a88] text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#d9d4ee]">
                  Work Email <span className="text-[#f472b6]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aarav@company.com"
                  className="bg-[#0e0c1a] border border-[#26213d] rounded-xl px-3.5 py-3 text-white placeholder-[#6f6a88] text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors"
                />
              </div>
            </div>

            {/* Row 2: Company Name & Company Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#d9d4ee]">
                  Company Name <span className="text-[#f472b6]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Technologies"
                  className="bg-[#0e0c1a] border border-[#26213d] rounded-xl px-3.5 py-3 text-white placeholder-[#6f6a88] text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#d9d4ee]">
                  Company Size <span className="text-[#f472b6]">*</span>
                </label>
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="bg-[#0e0c1a] border border-[#26213d] rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors"
                >
                  <option value="1-50">1 - 50 employees</option>
                  <option value="51-200">51 - 200 employees</option>
                  <option value="201-1000">201 - 1,000 employees</option>
                  <option value="1000+">1,000+ employees</option>
                </select>
              </div>
            </div>

            {/* Row 3: Phone & Job Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#d9d4ee]">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="bg-[#0e0c1a] border border-[#26213d] rounded-xl px-3.5 py-3 text-white placeholder-[#6f6a88] text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#d9d4ee]">Job Title / Designation</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="VP Human Resources / CFO"
                  className="bg-[#0e0c1a] border border-[#26213d] rounded-xl px-3.5 py-3 text-white placeholder-[#6f6a88] text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors"
                />
              </div>
            </div>

            {/* Primary Interest Radios */}
            <div className="flex flex-col gap-2 pt-1">
              <label className="text-sm font-semibold text-[#d9d4ee]">Primary Focus Area</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="planType"
                    value="wellness"
                    checked={planType === 'wellness'}
                    onChange={(e) => setPlanType(e.target.value)}
                    className="sr-only"
                  />
                  <span
                    className={`block text-center py-3 px-2 border rounded-xl text-xs font-semibold transition-all ${
                      planType === 'wellness'
                        ? 'border-[#8b5cf6] text-white bg-[#8b5cf6]/15'
                        : 'border-[#26213d] text-[#a09cb3] bg-[#0e0c1a]'
                    }`}
                  >
                    Employee Wellness
                  </span>
                </label>

                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="planType"
                    value="retention"
                    checked={planType === 'retention'}
                    onChange={(e) => setPlanType(e.target.value)}
                    className="sr-only"
                  />
                  <span
                    className={`block text-center py-3 px-2 border rounded-xl text-xs font-semibold transition-all ${
                      planType === 'retention'
                        ? 'border-[#8b5cf6] text-white bg-[#8b5cf6]/15'
                        : 'border-[#26213d] text-[#a09cb3] bg-[#0e0c1a]'
                    }`}
                  >
                    Retention & Perks
                  </span>
                </label>

                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="planType"
                    value="corporate"
                    checked={planType === 'corporate'}
                    onChange={(e) => setPlanType(e.target.value)}
                    className="sr-only"
                  />
                  <span
                    className={`block text-center py-3 px-2 border rounded-xl text-xs font-semibold transition-all ${
                      planType === 'corporate'
                        ? 'border-[#8b5cf6] text-white bg-[#8b5cf6]/15'
                        : 'border-[#26213d] text-[#a09cb3] bg-[#0e0c1a]'
                    }`}
                  >
                    Leadership Analytics
                  </span>
                </label>
              </div>
            </div>

            {/* Message / Requirements */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#d9d4ee]">Additional Requirements (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your team size, locations, or current wellness benefits..."
                rows={3}
                className="bg-[#0e0c1a] border border-[#26213d] rounded-xl px-3.5 py-3 text-white placeholder-[#6f6a88] text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors resize-y min-h-[96px]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#8b5cf6] via-[#d946ef] to-[#ec4899] hover:opacity-95 text-white font-bold text-base shadow-[0_10px_30px_rgba(217,70,239,0.25)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Building2 className="w-5 h-5" /> Request Full Details & Demo
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BusinessDetailsPage;

