import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HardHat,
  Building2,
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
  FileDown,
  Compass,
  Hammer,
  DraftingCompass,
  Ruler,
  Sparkles,
  ExternalLink,
  Layers,
  Eye,
  X,
  FileText,
  Check,
  PhoneCall,
  Calendar,
  Building,
  Target,
  HeartHandshake,
} from 'lucide-react';
import { PublicQrCodeGenerator } from '../common/PublicQrCodeGenerator';
import { DeRuedaLogo } from '../brand/DeRuedaLogo';

interface PublicWebsiteViewProps {
  onOpenLogin: () => void;
  onGoToDashboard?: () => void;
  onOpenLogout?: () => void;
}

type ProjectCategory = 'all' | 'residential' | 'commercial' | 'structural';

interface PortfolioItem {
  id: string;
  title: string;
  category: 'residential' | 'commercial' | 'structural';
  categoryLabel: string;
  location: string;
  image: string;
  scope: string;
  description: string;
  highlights: string[];
}

export const PublicWebsiteView: React.FC<PublicWebsiteViewProps> = ({
  onOpenLogin,
  onGoToDashboard,
  onOpenLogout,
}) => {
  const { sites, submitPublicInquiry, submitPublicHiring, currentUser } = useApp();

  // Active Portfolio Filter & Selected Modal Item
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('all');
  const [activeProjectModal, setActiveProjectModal] = useState<PortfolioItem | null>(null);

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
    location: 'Mariveles, Bataan',
    email: '',
    contact_number: '',
    business_motive: '',
    project_category: 'New Residential Construction',
  });
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Historical Project Portfolio based on actual company profile
  const portfolioItems: PortfolioItem[] = useMemo(() => [
    {
      id: 'dona-adela-residence',
      title: 'Doña Adela Modern Residence',
      category: 'residential',
      categoryLabel: 'Residential Build',
      location: 'Doña Adela Heights, Mariveles, Bataan',
      image: '/assets/projects/historical_project_11.jpg',
      scope: 'Two-Storey Contemporary Single-Family Home',
      description: 'Custom architectural residential construction featuring cantilevered reinforced concrete balconies, floor-to-ceiling glass fenestrations, custom steel gates, and turn-key interior finishes.',
      highlights: ['Engineered seismic reinforced concrete frames', 'Custom exterior architectural cladding', 'Comprehensive MEP infrastructure', 'Turnkey handover with Certificate of Occupancy'],
    },
    {
      id: 'mt-view-villa',
      title: 'Mt. View Executive Residence',
      category: 'residential',
      categoryLabel: 'Residential Build',
      location: 'Brgy. Mt. View, Mariveles, Bataan',
      image: '/assets/projects/historical_project_12.jpg',
      scope: 'Multi-Level Executive Home & Landscaping',
      description: 'Complete design-and-build execution nestled in the elevated terrain of Mt. View. Included terraced foundation engineering, custom portico, and integrated stormwater management.',
      highlights: ['Terraced grade beam foundation', 'Architectural stone masonry accents', 'Waterproofing & hillside drainage systems', 'Dedicated garage & utility outbuildings'],
    },
    {
      id: 'bishops-chapel',
      title: "Bishop's Chapel Institutional Sanctuary",
      category: 'commercial',
      categoryLabel: 'Institutional & Religious',
      location: 'Bataan Community Parish',
      image: '/assets/projects/historical_project_14.jpg',
      scope: 'High-Ceiling Assembly Chapel & Facilities',
      description: 'Historical institutional construction dedicated to spiritual worship and community assembly, engineered with long-span steel rafters, acoustic ceiling details, and altar civil works.',
      highlights: ['Long-span structural roof truss engineering', 'Natural cross-ventilation architecture', 'Reinforced perimeter retaining walls', 'Custom altar joinery and decorative stone'],
    },
    {
      id: 'roman-highway-commercial',
      title: 'Roman Highway Commercial Shophouse Complex',
      category: 'commercial',
      categoryLabel: 'Commercial Development',
      location: 'Roman Superhighway Corridor, Bataan',
      image: '/assets/projects/historical_project_15.jpg',
      scope: 'Multi-Bay Commercial & Retail Development',
      description: 'Multi-bay commercial complex designed for high-traffic retail tenants along Bataan’s primary highway corridor. Features reinforced concrete grade beams and customizable storefronts.',
      highlights: ['Heavy commercial live load floor slabs', 'Individual electrical & water metering pods', 'Ample frontage parking concrete paving', 'Commercial grade roll-up doors and shopfronts'],
    },
    {
      id: 'contemporary-executive-home',
      title: 'Balanga Contemporary Two-Storey Residence',
      category: 'residential',
      categoryLabel: 'Residential Build',
      location: 'Balanga City, Bataan',
      image: '/assets/projects/historical_project_16.jpg',
      scope: 'Modern Luxury Residential Construction',
      description: 'Modern two-storey residence showcasing minimalist architecture, double-height foyer, seamless indoor-outdoor living spaces, and energy-efficient insulated roofing.',
      highlights: ['Double-height foyer structural framing', 'Polished porcelain tile flooring', 'Custom kitchen cabinetry & stone counters', 'Exterior textured protective coatings'],
    },
    {
      id: 'industrial-steel-warehouse',
      title: 'Bataan Industrial Logistics Warehouse',
      category: 'structural',
      categoryLabel: 'Structural & Industrial',
      location: 'Mariveles Industrial Zone, Bataan',
      image: '/assets/projects/historical_project_13.jpg',
      scope: 'Heavy Structural Steel Framing & Slab-on-Grade',
      description: 'Industrial warehouse facility engineered for heavy machinery and logistics storage. Features certified SMAW welding, high-tensile anchor bolt foundations, and laser-screeded concrete floors.',
      highlights: ['Wide-flange steel columns and roof framing', 'High-load capacity slab-on-grade concrete', 'Industrial crane girder bracket integration', 'Complete stormwater perimeter culverts'],
    },
    {
      id: 'structural-civil-foundation',
      title: 'Hillside Retaining Wall & Civil Foundation',
      category: 'structural',
      categoryLabel: 'Structural & Civil',
      location: 'Mariveles Coastal & Mountain Pass, Bataan',
      image: '/assets/projects/historical_project_23.jpg',
      scope: 'Reinforced Earth Retaining & Sub-Structure',
      description: 'Specialized geotechnical and structural retaining wall project protecting hillside structures from earth movement and severe monsoon runoff.',
      highlights: ['Deep bored footing & tie-back anchors', 'Weephole drainage filter gravel systems', 'High-strength 4000 PSI concrete mix', 'Strict slope stability compliance'],
    },
    {
      id: 'interior-architectural-finishing',
      title: 'Turnkey Architectural Finishes & Joinery',
      category: 'residential',
      categoryLabel: 'Finishing Works',
      location: 'Mariveles, Bataan',
      image: '/assets/projects/historical_project_29.jpg',
      scope: 'Custom Interior Architecture & Millwork',
      description: 'Detailed showcase of precision interior finishing works, including concealed cove ceiling lighting, precision porcelain tile layout, and high-spec architectural woodwork.',
      highlights: ['Concealed LED architectural light troughs', 'Flush-mounted modern baseboards & trims', 'Premium plumbing fixture installation', 'Comprehensive 200-point handover punchlist'],
    },
  ], []);

  const filteredPortfolio = useMemo(() => {
    if (selectedCategory === 'all') return portfolioItems;
    return portfolioItems.filter((item) => item.category === selectedCategory);
  }, [portfolioItems, selectedCategory]);

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
      inquiry_type: `${inquiryForm.inquiry_type} [${inquiryForm.project_category} - ${inquiryForm.location}]`,
      email: inquiryForm.email.trim(),
      contact_number: inquiryForm.contact_number.trim(),
      business_motive: inquiryForm.business_motive.trim(),
    });
    setInquirySuccess(true);
    setInquiryForm({
      name: '',
      inquiry_type: 'Customer Inquiry',
      location: 'Mariveles, Bataan',
      email: '',
      contact_number: '',
      business_motive: '',
      project_category: 'New Residential Construction',
    });
    setTimeout(() => setInquirySuccess(false), 6000);
  };

  return (
    <div className="min-h-screen bg-[#060b18] text-[#f3f4f6]">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#070d1f]/95 backdrop-blur-md border-b border-[#1e293b] px-4 sm:px-6 lg:px-12 h-18 flex items-center justify-between gap-4 transition-all">
        <a href="#home" className="flex items-center shrink-0 group">
          <DeRuedaLogo size="md" variant="horizontal" theme="dark" showSubtitle={true} />
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <a href="#about" className="hover:text-emerald-400 transition-colors whitespace-nowrap">About Us</a>
          <a href="#services" className="hover:text-emerald-400 transition-colors whitespace-nowrap">Core Services</a>
          <a href="#projects" className="hover:text-emerald-400 transition-colors whitespace-nowrap">Accomplished Works</a>
          <a href="#process" className="hover:text-emerald-400 transition-colors whitespace-nowrap">6-Stage Process</a>
          <a href="#heritage" className="hover:text-emerald-400 transition-colors whitespace-nowrap">Mission &amp; Vision</a>
          <a href="#inquiry" className="hover:text-emerald-400 transition-colors whitespace-nowrap">Consultation</a>
          <a href="#contact" className="hover:text-emerald-400 transition-colors whitespace-nowrap">Contact</a>
          <a
            href="#qr-generator"
            className="text-emerald-400 hover:text-white transition-colors whitespace-nowrap flex items-center gap-1 font-bold"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Worker QR</span>
          </a>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="tel:+639994444854"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 hover:bg-emerald-900/40 transition-colors"
            title="Call De Rueda Construction Directly"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>+63 999 444 4854</span>
          </a>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onGoToDashboard}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Go to</span> ERP
              </button>
              {onOpenLogout && (
                <button
                  onClick={onOpenLogout}
                  className="p-1.5 border border-slate-700/80 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3.5 py-1.5 border border-slate-700 hover:border-slate-500 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
              aria-label="Sign In"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative pt-16 sm:pt-24 pb-20 px-6 lg:px-12 border-b border-[#1e293b] overflow-hidden">
        {/* Subtle Architectural Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 space-y-6 text-center">
          {/* Location & Accreditation Text Line */}
          <div className="inline-flex items-center gap-2 text-xs font-mono font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-3.5 py-1 rounded-md">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>MARIVELES, BATAAN · SERVING CENTRAL LUZON &amp; GREATER MANILA</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Building Your Vision,{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 via-teal-300 to-lime-400">
              From Plan to Completion.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Construction services based in Mariveles, Bataan. Tell us about your project and connect with our licensed engineering team to discuss the next steps. From residential single-family masterworks to commercial shophouses and heavy structural steel framing.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#inquiry"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Request Project Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#projects"
              className="px-6 py-3 bg-[#0d162d] border border-slate-700 hover:border-emerald-500 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Accomplished Projects</span>
            </a>

            <a
              href="/assets/aistudio/De_Rueda_Construction_Company_Profile_WITH_Historical_Projects_Mission_Vision_894d16ed.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-slate-900/80 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-slate-200 font-medium text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2"
              title="Download De Rueda Construction Official Profile PDF"
            >
              <FileDown className="w-4 h-4 text-slate-400" />
              <span>Download Profile (PDF)</span>
            </a>
          </div>

          {/* Direct Verified Communication Strip */}
          <div className="pt-6 border-t border-slate-800/80 max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Direct Line: <a href="tel:+639994444854" className="font-mono text-white hover:text-emerald-400 font-semibold">+63 999 444 4854</a></span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Official Email: <a href="mailto:emrueda07@gmail.com" className="font-mono text-white hover:text-emerald-400 font-semibold">emrueda07@gmail.com</a></span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">#7 Doña Adela Heights, Brgy. Mt. View</span>
            </div>
          </div>
        </div>

        {/* 4 Trust Metrics Strip */}
        <div className="max-w-5xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 relative z-10">
          <div className="p-4 sm:p-5 bg-[#0a1128] border border-[#1e293b] rounded-xl text-center">
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tabular-nums">Bataan</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Regional Engineering Focus</div>
            <p className="text-[11px] text-slate-500 mt-1 hidden sm:block">Deep local topography &amp; permitting expertise</p>
          </div>

          <div className="p-4 sm:p-5 bg-[#0a1128] border border-[#1e293b] rounded-xl text-center">
            <div className="text-2xl sm:text-3xl font-black font-mono text-lime-400 tabular-nums">5 Core</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Accredited Capabilities</div>
            <p className="text-[11px] text-slate-500 mt-1 hidden sm:block">From planning to turnkey architectural finishes</p>
          </div>

          <div className="p-4 sm:p-5 bg-[#0a1128] border border-[#1e293b] rounded-xl text-center">
            <div className="text-2xl sm:text-3xl font-black font-mono text-teal-400 tabular-nums">100%</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Milestone Transparency</div>
            <p className="text-[11px] text-slate-500 mt-1 hidden sm:block">Rigorous Bill of Quantities &amp; weekly logs</p>
          </div>

          <div className="p-4 sm:p-5 bg-[#0a1128] border border-[#1e293b] rounded-xl text-center">
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tabular-nums">DOLE-OSHC</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Safety Compliant</div>
            <p className="text-[11px] text-slate-500 mt-1 hidden sm:block">Zero lost-time safety protocol enforcement</p>
          </div>
        </div>
      </section>

      {/* Core Services Section (Section 3 of PDF) */}
      <section id="services" className="py-20 px-6 lg:px-12 border-b border-[#1e293b] bg-[#070d1f]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              ACCREDITED CONSTRUCTION PILLARS · PDF SECTION 3
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Comprehensive Construction Services
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              De Rueda Construction delivers end-to-end general contracting, structural execution, and interior finishing backed by certified structural engineering calculations and dedicated site supervision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service 1: Planning & Conceptualization */}
            <div className="p-6 bg-[#0a1128] border border-[#1e293b] hover:border-emerald-500/50 rounded-2xl space-y-4 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <DraftingCompass className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  1. Project Planning &amp; Conceptualization
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Early-stage consultation and engineering feasibility studies to transform initial briefs into buildable blueprints.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Site inspection &amp; topographic evaluation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Architectural design &amp; 3D visualization</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Building permit processing &amp; regulatory clearance</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Cost scheduling &amp; preliminary Bill of Quantities</span>
                </li>
              </ul>
            </div>

            {/* Service 2: General Construction */}
            <div className="p-6 bg-[#0a1128] border border-[#1e293b] hover:border-emerald-500/50 rounded-2xl space-y-4 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400 group-hover:scale-105 transition-transform">
                <HardHat className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-lime-300 transition-colors">
                  2. General Construction
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Turnkey civil and building construction delivering residential homes, commercial complexes, and institutional facilities.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  <span>Turnkey residential &amp; commercial builds</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  <span>Rigorous daily site supervision &amp; quality testing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  <span>Materials procurement from certified mills</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  <span>Contractor &amp; trade crew coordination</span>
                </li>
              </ul>
            </div>

            {/* Service 3: Structural Execution */}
            <div className="p-6 bg-[#0a1128] border border-[#1e293b] hover:border-emerald-500/50 rounded-2xl space-y-4 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                  3. Structural Execution
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Heavy civil foundation and superstructure engineering adhering to the National Structural Code of the Philippines.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Reinforced concrete columns, beams &amp; suspended slabs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Structural steel trusses &amp; industrial framing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Hillside retaining walls &amp; footing excavation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Concrete cylinder compression tests (3000-4000 PSI)</span>
                </li>
              </ul>
            </div>

            {/* Service 4: Finishing Works */}
            <div className="p-6 bg-[#0a1128] border border-[#1e293b] hover:border-emerald-500/50 rounded-2xl space-y-4 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Ruler className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  4. Architectural Finishing Works
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Meticulous interior and exterior finishes delivering modern aesthetic appeal and long-term weather durability.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Floor &amp; wall precision tiling with waterproof substrate</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Specialty elastomeric painting &amp; skim coats</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Custom millwork, doors &amp; aluminum glass glazing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Sanitary fixtures, lighting installation &amp; commissioning</span>
                </li>
              </ul>
            </div>

            {/* Service 5: Design-and-Build Coordination */}
            <div className="p-6 bg-[#0a1128] border border-[#1e293b] hover:border-emerald-500/50 rounded-2xl space-y-4 transition-all group md:col-span-2 lg:col-span-2">
              <div className="w-12 h-12 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-lime-300 transition-colors">
                  5. Design-and-Build Integrated Coordination
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Single-point accountability from architectural drawings to final key handover. Eliminates coordination friction between designers, structural engineers, and field trades for maximum schedule reliability and cost certainty.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  <span>Unified contract &amp; milestone schedule</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  <span>Real-time value engineering &amp; cost control</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  <span>Zero finger-pointing between designers and builders</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  <span>Occupancy permit and warranty support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accomplished Works & Featured Projects Gallery */}
      <section id="projects" className="py-20 px-6 lg:px-12 border-b border-[#1e293b]">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                PORTFOLIO SHOWCASE · REAL FIELD ACCOMPLISHMENTS
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1">
                Featured Projects &amp; Accomplishments
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl">
                Explore real completed residences, commercial hubs, institutional chapels, and civil foundations constructed by the De Rueda engineering team in Bataan and Central Luzon.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#0a1128] border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Works ({portfolioItems.length})
              </button>
              <button
                onClick={() => setSelectedCategory('residential')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'residential'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Residential
              </button>
              <button
                onClick={() => setSelectedCategory('commercial')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'commercial'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Commercial &amp; Chapel
              </button>
              <button
                onClick={() => setSelectedCategory('structural')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'structural'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Structural &amp; Civil
              </button>
            </div>
          </div>

          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredPortfolio.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveProjectModal(item)}
                className="bg-[#0a1128] border border-[#1e293b] hover:border-emerald-500/60 rounded-2xl overflow-hidden shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-4/3 overflow-hidden bg-slate-900">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#0a1128] via-transparent to-transparent opacity-80" />
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-black/70 text-emerald-400 border border-emerald-500/30 backdrop-blur-xs">
                      {item.categoryLabel}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                      {item.title}
                    </h3>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="line-clamp-1">{item.location}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {item.scope}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-1 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 border-t border-slate-800/60 mt-2">
                  <span>View Full Details</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          {/* Active Construction Sites from ERP */}
          {sites && sites.length > 0 && (
            <div className="p-6 bg-[#070d1f] border border-[#1e293b] rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                    LIVE FIELD OPERATIONS
                  </div>
                  <h3 className="text-lg font-bold text-white">Active ERP Site Deployments</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {sites.length} Active Provincial Sites
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {sites.map((site) => (
                  <div key={site.site_id} className="p-3.5 bg-[#0a1128] border border-slate-800 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-400">{site.code}</span>
                      <span className="text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        {site.project_status}
                      </span>
                    </div>
                    <div className="font-bold text-white">{site.name}</div>
                    <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{site.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox / Project Details Modal */}
      {activeProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl bg-[#0a1128] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <button
              onClick={() => setActiveProjectModal(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-black/60 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="overflow-y-auto p-6 space-y-6">
              <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                <img
                  src={activeProjectModal.image}
                  alt={activeProjectModal.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                      {activeProjectModal.categoryLabel}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {activeProjectModal.title}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{activeProjectModal.location}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeProjectModal.description}
                </p>

                <div className="p-4 bg-[#070d1f] border border-slate-800 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Engineering &amp; Construction Highlights
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    {activeProjectModal.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Interested in a custom project of similar scale or scope?
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="#inquiry"
                      onClick={() => setActiveProjectModal(null)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
                    >
                      <span>Inquire About This Build</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6-Stage Construction Process Workflow (PDF Section 4) */}
      <section id="process" className="py-20 px-6 lg:px-12 border-b border-[#1e293b] bg-[#070d1f]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              METHODICAL PROJECT LIFECYCLE · PDF SECTION 4
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              The 6-Stage Construction Workflow
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              From initial property survey in Bataan to official certificate of occupancy, our structured roadmap ensures cost certainty, architectural precision, and prompt handover.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 bg-[#0a1128] border border-[#1e293b] rounded-2xl space-y-3 relative">
              <span className="text-2xl font-black font-mono text-emerald-400/80">01</span>
              <h3 className="text-base font-bold text-white">Initial Inquiry &amp; Project Briefing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect directly with our team via phone or inquiry portal. We review your land location, structural requirements, target floor area, and preliminary investment parameters.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 bg-[#0a1128] border border-[#1e293b] rounded-2xl space-y-3 relative">
              <span className="text-2xl font-black font-mono text-lime-400/80">02</span>
              <h3 className="text-base font-bold text-white">Project Discussion &amp; Site Assessment</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our licensed civil engineers conduct on-site topographic inspection, soil assessment, boundary verification, and local Bataan municipal zoning reviews.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 bg-[#0a1128] border border-[#1e293b] rounded-2xl space-y-3 relative">
              <span className="text-2xl font-black font-mono text-teal-400/80">03</span>
              <h3 className="text-base font-bold text-white">Proposal &amp; Scope Alignment</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Transparent itemized Bill of Quantities (BOQ), material grade specifications, construction schedule milestones, and formal contract alignment without hidden markups.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 bg-[#0a1128] border border-[#1e293b] rounded-2xl space-y-3 relative">
              <span className="text-2xl font-black font-mono text-emerald-400/80">04</span>
              <h3 className="text-base font-bold text-white">Planning, Engineering &amp; Approvals</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Comprehensive architectural blueprints, certified structural calculations, MEP schematics, and processing of municipal building permits with local authorities.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-6 bg-[#0a1128] border border-[#1e293b] rounded-2xl space-y-3 relative">
              <span className="text-2xl font-black font-mono text-lime-400/80">05</span>
              <h3 className="text-base font-bold text-white">Construction Execution &amp; Quality Control</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Site mobilization, foundation excavation, reinforced concrete superstructure framing, and structural steel erection backed by daily safety talks and quality checks.
              </p>
            </div>

            {/* Step 6 */}
            <div className="p-6 bg-[#0a1128] border border-[#1e293b] rounded-2xl space-y-3 relative">
              <span className="text-2xl font-black font-mono text-teal-400/80">06</span>
              <h3 className="text-base font-bold text-white">Finishing Works, Inspection &amp; Handover</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Precision architectural finishes, fixture commissioning, joint 200-point punchlist walk-through, Certificate of Occupancy, and official key handover.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Historical Heritage, Leadership & Mission / Vision (PDF Historical Sections) */}
      <section id="heritage" className="py-20 px-6 lg:px-12 border-b border-[#1e293b]">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Historical Story */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                HISTORICAL HERITAGE · COMPANY PROFILE
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Transforming Land into Blocks, Bricks &amp; Realized Visions
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Rooted in Mariveles, Bataan, De Rueda Construction (historically De Rueda Builders &amp; Construction Supply) has steadfastly championed the power of design, uncompromising engineering integrity, and the realization of our clients’ lifelong dreams.
              </p>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Every project is approached as an enduring testament of workmanship, dedicated to the service of God Almighty, the economic vitality of Bataan, and the safety of the communities we build.
              </p>

              <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Licensed General Contractor</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Engineering Mentorship</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Christian Faith &amp; Integrity</span>
                </div>
              </div>
            </div>

            {/* Leadership Spotlight Cards */}
            <div className="space-y-4">
              <div className="p-5 bg-[#0a1128] border border-[#1e293b] rounded-2xl flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold">
                  EV
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider">
                    PRINCIPAL ENGINEER &amp; SENIOR MENTOR
                  </div>
                  <h3 className="text-base font-bold text-white">Engr. Emy Villar De Rueda</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Decades of structural engineering stewardship across Bataan. Longstanding affiliation with Bataan Peninsula State University civil engineering mentorship, shaping premier engineering talent.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-[#0a1128] border border-[#1e293b] rounded-2xl flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400 shrink-0 font-bold">
                  ER
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase text-lime-400 tracking-wider">
                    CHIEF EXECUTIVE OFFICER
                  </div>
                  <h3 className="text-base font-bold text-white">Emerita De Rueda</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Corporate governance, client relations, and operational leadership. Directing strategic expansion, financial integrity, and modern cloud construction management for De Rueda Construction.
                  </p>
                  <div className="text-xs text-emerald-400 font-mono mt-1">
                    Direct Contact: emrueda07@gmail.com
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mission & Vision Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-[#0a1128] border border-[#1e293b] rounded-2xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Historical Company Mission</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                To transform raw land and architectural concepts into resilient, premium residential and commercial structures throughout Bataan and the Philippines. We are steadfastly committed to applying modern engineering technologies, seasoned craftsmanship, and uncompromising safety standards that honor our clients’ investments.
              </p>
            </div>

            <div className="p-8 bg-[#0a1128] border border-[#1e293b] rounded-2xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/5 rounded-full blur-2xl" />
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Historical Company Vision</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                To stand as Central Luzon’s premier general contractor of choice, recognized for high-standard construction packages custom-tailored to client needs, ethical corporate conduct, enduring structural longevity, and exceptional workmanship dedicated to the glory of God Almighty.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Portals: Consultation Form & Worker Turnstile QR Generator */}
      <section id="inquiry" className="py-20 px-6 lg:px-12 border-b border-[#1e293b] bg-[#070d1f]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              DIRECT CLIENT &amp; WORKFORCE PORTALS
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Project Consultation &amp; Turnstile Gate Access
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Request a comprehensive proposal for your construction project or generate your official De Rueda field badge immediately without needing system login credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Comprehensive Consultation Inquiry Form */}
            <div className="bg-[#0a1128] border border-[#1e293b] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                    DIRECT INTAKE
                  </div>
                  <h3 className="text-xl font-black text-white">
                    Request Project Consultation
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800">
                  MARIVELES HQ
                </span>
              </div>

              {inquirySuccess && (
                <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div>Your proposal request has been recorded in the De Rueda ERP intake queue!</div>
                    <div className="text-[11px] font-normal text-slate-300">
                      Our project estimation engineering desk will review your details and contact you via phone or email (<span className="text-white font-mono">emrueda07@gmail.com</span>).
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleInquirySubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Client / Representative Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                      className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                      placeholder="e.g. Engr. Gabriel Santos"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Project Category *
                    </label>
                    <select
                      value={inquiryForm.project_category}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, project_category: e.target.value })}
                      className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                    >
                      <option value="New Residential Construction">New Residential Construction</option>
                      <option value="Commercial Shophouse / Hub">Commercial Shophouse / Hub</option>
                      <option value="Industrial Steel Framing / Warehouse">Industrial Steel Framing / Warehouse</option>
                      <option value="Structural & Civil Retaining">Structural &amp; Civil Retaining</option>
                      <option value="Architectural Finishing & Renovation">Architectural Finishing &amp; Renovation</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Target Project Location *
                    </label>
                    <select
                      value={inquiryForm.location}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, location: e.target.value })}
                      className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                    >
                      <option value="Mariveles, Bataan">Mariveles, Bataan</option>
                      <option value="Limay, Bataan">Limay, Bataan</option>
                      <option value="Balanga City, Bataan">Balanga City, Bataan</option>
                      <option value="Orion, Bataan">Orion, Bataan</option>
                      <option value="Hermosa, Bataan">Hermosa, Bataan</option>
                      <option value="Dinalupihan, Bataan">Dinalupihan, Bataan</option>
                      <option value="Other Central Luzon Location">Other Central Luzon Location</option>
                      <option value="Greater Manila Area">Greater Manila Area</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={inquiryForm.contact_number}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, contact_number: e.target.value })}
                      className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-400 transition-colors"
                      placeholder="+63 917 123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                    className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                    placeholder="client@company.ph"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project Scope, Square Meters &amp; Specific Details *
                  </label>
                  <textarea
                    required
                    value={inquiryForm.business_motive}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, business_motive: e.target.value })}
                    className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white h-24 placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                    placeholder="Describe estimated lot size, proposed building area (sq.m.), number of storeys, desired completion timeline, or structural steel requirements..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Project Consultation Request</span>
                </button>
              </form>
            </div>

            {/* Right Column: Public Worker QR Turnstile Access Generator */}
            <PublicQrCodeGenerator />
          </div>
        </div>
      </section>

      {/* Careers & Field Workforce Hiring Form */}
      <section id="careers" className="py-20 px-6 lg:px-12 border-b border-[#1e293b]">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              JOIN OUR ON-SITE WORKFORCE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Field Construction Careers &amp; Trade Onboarding
            </h2>
            <p className="text-xs text-slate-400">
              We are continuously onboarding skilled masons, structural welders, master carpenters, heavy equipment operators, timekeepers, and safety aides in Mariveles and across Bataan.
            </p>
          </div>

          <div className="bg-[#0a1128] border border-[#1e293b] rounded-2xl p-6 sm:p-8 shadow-xl">
            {hiringSuccess && (
              <div className="mb-4 p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Job application received! Our HR department in Bataan will contact you for trade interview and site scheduling.</span>
              </div>
            )}

            <form onSubmit={handleHiringSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={hiringForm.name}
                    onChange={(e) => setHiringForm({ ...hiringForm, name: e.target.value })}
                    className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
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
                    className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={hiringForm.contact_number}
                    onChange={(e) => setHiringForm({ ...hiringForm, contact_number: e.target.value })}
                    className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-400"
                    placeholder="+63 917 000 0000"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={hiringForm.email}
                    onChange={(e) => setHiringForm({ ...hiringForm, email: e.target.value })}
                    className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                    placeholder="applicant@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Complete Home Address (Bataan / Nearby) *</label>
                <input
                  type="text"
                  required
                  value={hiringForm.address}
                  onChange={(e) => setHiringForm({ ...hiringForm, address: e.target.value })}
                  className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                  placeholder="Barangay, Municipality, Bataan"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Trade Experience &amp; Certifications *</label>
                <textarea
                  required
                  value={hiringForm.experience}
                  onChange={(e) => setHiringForm({ ...hiringForm, experience: e.target.value })}
                  className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white h-20 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  placeholder="Detail your construction trade (e.g. 5 years master carpenter, SMAW structural welder, backhoe operator, masonry foreman)..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Briefcase className="w-4 h-4" />
                <span>Submit Field Job Application</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Official Verified Company Contact Section */}
      <section id="contact" className="py-20 px-6 lg:px-12 border-b border-[#1e293b] bg-[#070d1f]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              OFFICIAL CONTACT CHANNELS
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Connect With De Rueda Construction
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Reach our corporate headquarters in Mariveles, Bataan or coordinate directly with our project engineers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Headquarters Card */}
            <div className="p-6 bg-[#0a1128] border border-[#1e293b] rounded-2xl space-y-4 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Corporate Headquarters</h3>
                <p className="text-slate-300 mt-2 leading-relaxed">
                  #7 Doña Adela Heights<br />
                  Brgy. Mt. View, Mariveles<br />
                  Bataan 2105, Philippines
                </p>
              </div>
              <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800">
                Office Hours: Monday - Saturday<br />
                7:00 AM – 5:00 PM PHT
              </div>
            </div>

            {/* Direct Line Card */}
            <div className="p-6 bg-[#0a1128] border border-[#1e293b] rounded-2xl space-y-4 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Direct Hotlines</h3>
                <p className="text-slate-300 mt-2 leading-relaxed font-mono">
                  Primary Mobile:<br />
                  <a href="tel:+639994444854" className="text-white hover:text-emerald-400 font-bold text-sm">
                    +63 999 444 4854
                  </a>
                </p>
              </div>
              <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800">
                Click-to-call enabled for mobile &amp; WhatsApp inquiries
              </div>
            </div>

            {/* Email & Facebook Card */}
            <div className="p-6 bg-[#0a1128] border border-[#1e293b] rounded-2xl space-y-4 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Electronic Inquiries</h3>
                <p className="text-slate-300 mt-2 leading-relaxed font-mono">
                  Official CEO Email:<br />
                  <a href="mailto:emrueda07@gmail.com" className="text-white hover:text-emerald-400 font-bold">
                    emrueda07@gmail.com
                  </a>
                </p>
              </div>
              <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800">
                Facebook Profile: <a href="https://facebook.com/emy.derueda" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">facebook.com/emy.derueda</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-14 px-6 lg:px-12 bg-[#040812] text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <DeRuedaLogo size="sm" variant="horizontal" theme="dark" showSubtitle={true} />
            <p className="text-slate-400 max-w-md">
              #7 Doña Adela Heights, Brgy. Mt. View, Mariveles, Bataan, Philippines. Licensed general contractor delivering quality construction services across Central Luzon.
            </p>
            <div className="text-[11px] text-slate-500">
              Primary: +63 999 444 4854 · Email: emrueda07@gmail.com
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex items-center gap-3">
              <a
                href="/assets/aistudio/De_Rueda_Construction_Company_Profile_WITH_Historical_Projects_Mission_Vision_894d16ed.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Company Profile PDF</span>
              </a>

              <button
                onClick={onOpenLogin}
                className="px-3.5 py-2 border border-slate-700 hover:border-slate-500 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                aria-label="Sign In"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>ERP Sign In</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 text-center md:text-right">
              De Rueda Construction &copy; 2026. All Rights Reserved. Dedicated to God Almighty.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicWebsiteView;
