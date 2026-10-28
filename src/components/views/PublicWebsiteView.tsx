import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HardHat,
  Building,
  ShieldCheck,
  CheckCircle2,
  Users,
  Briefcase,
  Mail,
  Phone,
  Send,
  MapPin,
  ChevronRight,
  Award,
  Clock,
  ArrowRight,
  LogOut,
  LayoutDashboard,
  QrCode,
  Lock,
} from 'lucide-react';
import { PublicQrCodeGenerator } from '../common/PublicQrCodeGenerator';
import { DeRuedaLogo } from '../brand/DeRuedaLogo';

interface PublicWebsiteViewProps {
  onOpenLogin: () => void;
  onGoToDashboard?: () => void;
  onOpenLogout?: () => void;
}

export const PublicWebsiteView: React.FC<PublicWebsiteViewProps> = ({
  onOpenLogin,
  onGoToDashboard,
  onOpenLogout,
}) => {
  const { sites, settings, submitPublicInquiry, submitPublicHiring, currentUser, logout } = useApp();

  // Hiring Form
  const [hiringForm, setHiringForm] = useState({
    name: '',
    age: 28,
    birthdate: '1998-05-12',
    address: '',
    email: '',
    contact_number: '',
    experience: '',
  });
  const [hiringSuccess, setHiringSuccess] = useState(false);

  // Inquiry Form
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    inquiry_type: 'Customer Inquiry',
    email: '',
    contact_number: '',
    business_motive: '',
  });
  const [inquirySuccess, setInquirySuccess] = useState(false);

  const handleHiringSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPublicHiring({
      name: hiringForm.name.trim(),
      age: Number(hiringForm.age),
      birthdate: hiringForm.birthdate,
      address: hiringForm.address.trim(),
      email: hiringForm.email.trim(),
      contact_number: hiringForm.contact_number.trim(),
      experience: hiringForm.experience.trim(),
    });
    setHiringSuccess(true);
    setHiringForm({
      name: '',
      age: 28,
      birthdate: '1998-05-12',
      address: '',
      email: '',
      contact_number: '',
      experience: '',
    });
    setTimeout(() => setHiringSuccess(false), 5000);
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPublicInquiry({
      name: inquiryForm.name.trim(),
      inquiry_type: inquiryForm.inquiry_type,
      email: inquiryForm.email.trim(),
      contact_number: inquiryForm.contact_number.trim(),
      business_motive: inquiryForm.business_motive.trim(),
    });
    setInquirySuccess(true);
    setInquiryForm({
      name: '',
      inquiry_type: 'Customer Inquiry',
      email: '',
      contact_number: '',
      business_motive: '',
    });
    setTimeout(() => setInquirySuccess(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#060b18] text-[#f3f4f6]">
      {/* Top Bar Contract (1-line Brand, single-line links, 1 primary CTA) */}
      <header className="sticky top-0 z-40 bg-[#0a1128]/95 backdrop-blur-md border-b border-[#1e3a8a]/40 px-6 lg:px-12 h-16 flex items-center justify-between gap-8">
        <a href="#home" className="flex items-center shrink-0 group">
          <DeRuedaLogo size="md" variant="horizontal" theme="dark" showSubtitle={true} />
        </a>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <a href="#about" className="hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0">Company Profile</a>
          <a href="#capabilities" className="hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0">Capabilities</a>
          <a href="#projects" className="hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0">Projects</a>
          <a href="#careers" className="hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0">Careers &amp; Hiring</a>
          <a href="#inquiry" className="hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0">Business Inquiry</a>
          <a href="#contact" className="hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0">Contact Us</a>
          <a
            href="#qr-generator"
            className="text-[#38bdf8] hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 font-bold"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Worker QR Badge</span>
          </a>
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenLogin}
            className="px-3.5 py-1.5 border border-slate-700/80 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            aria-label="Sign In"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Sign In</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative pt-20 pb-16 px-6 lg:px-12 border-b border-[#1e3a8a]/40 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-pink-300 bg-pink-500/10 border border-pink-500/30 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(236,72,153,0.15)]">
            <span>✨ ISO 9001 &amp; DOLE OCCUPATIONAL SAFETY COMPLIANT</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Engineering Excellence. Building the Future of{' '}
            <span className="text-emerald-400">Central Luzon &amp; Greater Manila.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            From heavy industrial warehouse foundation steel framing to multi-level commercial hubs and residential communities, De Rueda Construction delivers precision execution and verified occupational safety.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#inquiry"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Request Project Consultation
            </a>
            <a
              href="#qr-generator"
              className="px-5 py-2.5 bg-[#0f1c3d] border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Get Turnstile QR Badge</span>
            </a>
            <a
              href="#careers"
              className="px-5 py-2.5 bg-[#0a1128] border border-[#1e3a8a] text-slate-200 hover:border-emerald-400 font-semibold text-xs rounded-xl transition-colors"
            >
              Join Our Field Workforce
            </a>
          </div>
        </div>

        {/* 4 KPI Banner Strip */}
        <div className="max-w-5xl mx-auto mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
          <div className="p-4 bg-[#0a1128] border border-[#1e3a8a]/50 rounded-xl text-center">
            <div className="text-2xl font-black font-mono text-emerald-400 tabular-nums">100%</div>
            <div className="text-[11px] font-bold uppercase text-slate-400 mt-1">DOLE Safety Compliant</div>
          </div>
          <div className="p-4 bg-[#0a1128] border border-[#1e3a8a]/50 rounded-xl text-center">
            <div className="text-2xl font-black font-mono text-[#38bdf8] tabular-nums">3 Major Sites</div>
            <div className="text-[11px] font-bold uppercase text-slate-400 mt-1">Active in Central Luzon</div>
          </div>
          <div className="p-4 bg-[#0a1128] border border-[#1e3a8a]/50 rounded-xl text-center">
            <div className="text-2xl font-black font-mono text-white tabular-nums">0 Lost-Time</div>
            <div className="text-[11px] font-bold uppercase text-slate-400 mt-1">Accident Record</div>
          </div>
          <div className="p-4 bg-[#0a1128] border border-[#1e3a8a]/50 rounded-xl text-center">
            <div className="text-2xl font-black font-mono text-emerald-400 tabular-nums">Weekly Payouts</div>
            <div className="text-[11px] font-bold uppercase text-slate-400 mt-1">Verified Corporate Rail</div>
          </div>
        </div>
      </section>

      {/* Corporate Profile & About Us */}
      <section id="about" className="py-16 px-6 lg:px-12 border-b border-[#1e3a8a]/40">
        <div className="max-w-5xl mx-auto space-y-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Corporate Heritage</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">About De Rueda Construction</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Headquartered along the Roman Superhighway in Mariveles, Bataan, De Rueda Construction is a licensed general contractor specializing in commercial, industrial, and infrastructure development across Central Luzon and Greater Manila.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-[#0a1128] border border-[#1e3a8a]/50 rounded-xl space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Occupational Safety Standard</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero-accident safety culture with licensed site safety officers, certified rigging crews, and mandatory daily tool-box talks.
              </p>
            </div>

            <div className="p-5 bg-[#0a1128] border border-[#1e3a8a]/50 rounded-xl space-y-2">
              <Award className="w-6 h-6 text-[#38bdf8]" />
              <h3 className="font-bold text-sm text-white">Heavy Equipment Fleet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Integrated fleet including 25-ton mobile beam erection cranes, excavators, transit mixers, and heavy scaffolding systems.
              </p>
            </div>

            <div className="p-5 bg-[#0a1128] border border-[#1e3a8a]/50 rounded-xl space-y-2">
              <Users className="w-6 h-6 text-pink-400" />
              <h3 className="font-bold text-sm text-white">Statutory Labor Compliance</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every trade worker is registered with SSS, PhilHealth, attendance QR badges, and prompt weekly compensation with payment proofs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="py-16 px-6 lg:px-12 border-b border-[#1e3a8a]/40 bg-[#0a1128]/50">
        <div className="max-w-5xl mx-auto space-y-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Engineering Scope</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Our Core Construction Capabilities</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-[#0a1128] border border-[#1e3a8a]/50 rounded-xl space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl">
                🏗️
              </div>
              <h3 className="font-bold text-base text-white">Industrial Warehousing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Large-span structural steel framing, foundation casting, slab-on-grade concrete, and heavy load-bearing floors for logistics complexes.
              </p>
            </div>

            <div className="p-5 bg-[#0a1128] border border-[#1e3a8a]/50 rounded-xl space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-xl">
                🏢
              </div>
              <h3 className="font-bold text-base text-white">Commercial Centers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-level retail commercial developments, corporate offices, electrical substation civil works, and complete architectural finishings.
              </p>
            </div>

            <div className="p-5 bg-[#0a1128] border border-[#1e3a8a]/50 rounded-xl space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-xl">
                🏘️
              </div>
              <h3 className="font-bold text-base text-white">Residential Masterplans</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Duplex and subdivision housing construction, road network concrete paving, stormwater drainage pipes, and perimeter civil works.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Active Projects Showcase */}
      <section id="projects" className="py-16 px-6 lg:px-12 border-b border-[#1e3a8a]/40">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Field Operations</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Featured Construction Projects</h2>
          </div>

          {sites.length === 0 ? (
            <div className="p-8 text-center bg-[#0a1128] border border-[#1e3a8a]/40 rounded-xl text-xs text-slate-400">
              Active commercial site developments and construction projects will be featured here upon project site commissioning.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sites.map((site) => (
                <div key={site.site_id} className="p-5 bg-[#0a1128] border border-[#1e3a8a]/50 rounded-xl space-y-3 shadow-lg hover:border-emerald-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400">{site.code}</span>
                    <span className="text-[10px] font-bold text-emerald-300 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {site.project_status}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white">{site.name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{site.location}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Site Head: <strong className="text-slate-300">{site.supervisor}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Careers & Field Hiring Form */}
      <section id="careers" className="py-16 px-6 lg:px-12 border-b border-[#1e3a8a]/40 bg-[#0a1128]/50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Join Our Team</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Field Construction Careers &amp; Hiring</h2>
            <p className="text-xs text-slate-400">
              We are actively onboarding skilled masons, master carpenters, structural welders, heavy equipment operators, and laborers.
            </p>
          </div>

          <div className="bg-[#0f1c3d] border border-[#1e3a8a] rounded-2xl p-6 shadow-xl">
            {hiringSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Application submitted successfully! Our HR team in Bataan will contact you for interview scheduling.</span>
              </div>
            )}

            <form onSubmit={handleHiringSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={hiringForm.name}
                    onChange={(e) => setHiringForm({ ...hiringForm, name: e.target.value })}
                    className="w-full bg-[#070d1f] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                    placeholder="e.g. Eduardo M. Rivera"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Age *</label>
                  <input
                    type="number"
                    min="18"
                    max="70"
                    required
                    value={hiringForm.age}
                    onChange={(e) => setHiringForm({ ...hiringForm, age: Number(e.target.value) })}
                    className="w-full bg-[#070d1f] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Birthdate *</label>
                  <input
                    type="date"
                    required
                    value={hiringForm.birthdate}
                    onChange={(e) => setHiringForm({ ...hiringForm, birthdate: e.target.value })}
                    className="w-full bg-[#070d1f] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={hiringForm.contact_number}
                    onChange={(e) => setHiringForm({ ...hiringForm, contact_number: e.target.value })}
                    className="w-full bg-[#070d1f] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    placeholder="+63 917 000 0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gmail / Email *</label>
                  <input
                    type="email"
                    required
                    value={hiringForm.email}
                    onChange={(e) => setHiringForm({ ...hiringForm, email: e.target.value })}
                    className="w-full bg-[#070d1f] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                    placeholder="applicant@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Complete Home Address *</label>
                  <input
                    type="text"
                    required
                    value={hiringForm.address}
                    onChange={(e) => setHiringForm({ ...hiringForm, address: e.target.value })}
                    className="w-full bg-[#070d1f] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                    placeholder="Barangay, Municipality, Bataan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Trade Experience &amp; TESDA Certifications *</label>
                <textarea
                  required
                  value={hiringForm.experience}
                  onChange={(e) => setHiringForm({ ...hiringForm, experience: e.target.value })}
                  className="w-full bg-[#070d1f] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white h-20 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  placeholder="Detail your construction trade (e.g., 6 years master carpenter, 4 years SMAW structural welder, backhoe operator license)..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 text-white hover:bg-emerald-500 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Briefcase className="w-4 h-4" />
                Submit Job Application
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Business Consultation Inquiry & Employee QR Code Generator */}
      <section id="inquiry" className="py-16 px-6 lg:px-12 border-b border-[#1e3a8a]/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Direct Access Portals &bull; Zero Login Friction
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Project Consultation &amp; Worker QR Gate Access
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mx-auto">
              Submit commercial client proposals or generate your official De Rueda Construction field turnstile badge immediately without needing system login credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Business Consultation Inquiry Form */}
            <div className="bg-[#0f1c3d] border border-[#1e3a8a] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="pb-4 mb-4 border-b border-[#1e3a8a]/40 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Client Proposals</div>
                    <h3 className="text-lg font-black text-white">Project Consultation &amp; Subcontracting</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    GENERAL CONTRACTING
                  </span>
                </div>

                {inquirySuccess && (
                  <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Proposal received! Our project estimation engineering department will review and contact you.</span>
                  </div>
                )}

                <form onSubmit={handleInquirySubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Company / Representative Name *</label>
                      <input
                        type="text"
                        required
                        value={inquiryForm.name}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                        className="w-full bg-[#070d1f] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                        placeholder="e.g. Engr. Gabriel Santos"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Inquiry Category *</label>
                      <select
                        value={inquiryForm.inquiry_type}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, inquiry_type: e.target.value })}
                        className="w-full bg-[#070d1f] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="Customer Inquiry">Customer Inquiry (Client Project Request)</option>
                        <option value="Business Cooperation">Business Cooperation (Subcontractor / Supplier)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Official Email *</label>
                      <input
                        type="email"
                        required
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                        className="w-full bg-[#070d1f] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                        placeholder="client@company.ph"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={inquiryForm.contact_number}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, contact_number: e.target.value })}
                        className="w-full bg-[#070d1f] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                        placeholder="+63 917 123 4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Scope of Project &amp; Cooperation Details *</label>
                    <textarea
                      required
                      value={inquiryForm.business_motive}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, business_motive: e.target.value })}
                      className="w-full bg-[#070d1f] border border-[#1e3a8a] rounded-xl px-3 py-2 text-white h-24 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                      placeholder="Describe location, proposed square meters, target timeline, steel framing specs, or materials supply agreement..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 text-white hover:bg-emerald-500 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Submit Project Consultation
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Worker Turnstile QR Code Generator (No Login Required) */}
            <PublicQrCodeGenerator />
          </div>
        </div>
      </section>

      {/* Official Public Contact Page (PDF Page 3 Section 2) */}
      <section id="contact" className="py-16 px-6 lg:px-12 border-b border-[#1e3a8a]/40 bg-[#0a1128]/60">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Get In Touch</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Official Company Contact Details</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Connect directly with our headquarters in Mariveles, Bataan or our Metro Manila coordination desk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Headquarters */}
            <div className="p-5 bg-[#0f1c3d] border border-[#1e3a8a]/50 rounded-2xl space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Central Operations &amp; HQ</h3>
              <p className="text-slate-300 leading-relaxed">
                4th Floor, DRC Corporate Center<br />
                Roman Superhighway, Mariveles<br />
                Bataan 2105, Philippines
              </p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-[#1e3a8a]/40">
                Office Hours: Mon - Sat: 7:00 AM - 5:00 PM
              </div>
            </div>

            {/* Inquiries & Direct Line */}
            <div className="p-5 bg-[#0f1c3d] border border-[#1e3a8a]/50 rounded-2xl space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-[#38bdf8]">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Direct Hotlines</h3>
              <p className="text-slate-300 leading-relaxed font-mono">
                Landline: +63 (047) 935-0888<br />
                Mobile: +63 917 123 4567<br />
                Site Dispatch: +63 920 888 9999
              </p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-[#1e3a8a]/40">
                24/7 Field Safety &amp; Emergency Response
              </div>
            </div>

            {/* Email & Accounts */}
            <div className="p-5 bg-[#0f1c3d] border border-[#1e3a8a]/50 rounded-2xl space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Electronic Inquiries</h3>
              <p className="text-slate-300 leading-relaxed font-mono">
                General: info@deruedaconstruction.com<br />
                Billing: finance@deruedaconstruction.com<br />
                Careers: hr@deruedaconstruction.com
              </p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-[#1e3a8a]/40">
                Guaranteed response within 1 business day
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-12 bg-[#070d1f] border-t border-[#1e3a8a]/40 text-xs text-slate-400">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <DeRuedaLogo size="sm" variant="horizontal" theme="dark" showSubtitle={true} />
            <div>Roman Superhighway, Mariveles, Bataan, Philippines</div>
            <div>info@deruedaconstruction.com &bull; +63 (047) 935-0888</div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={onOpenLogin}
              className="px-3.5 py-1.5 border border-slate-700/80 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              aria-label="Sign In"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign In</span>
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-8 pt-4 border-t border-[#1e3a8a]/40 text-center text-[11px] text-slate-500">
          Proprietary construction management system &bull; ISO 9001 &amp; DOLE Certified &bull; De Rueda Construction &copy; 2026
        </div>
      </footer>
    </div>
  );
};

export default PublicWebsiteView;
