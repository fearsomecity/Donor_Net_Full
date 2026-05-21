import { Link } from 'react-router-dom';
import { Heart, ShieldCheck, Zap, Users, ArrowRight, Activity, MapPin, Building2, Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="relative pt-40 pb-32 px-8 flex-1 flex flex-col items-center justify-center overflow-hidden bg-neutral-50/30 dark:bg-[#0a0a0a] transition-colors duration-300">
        {/* Aesthetic Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-crimson-100/30 rounded-full blur-[120px] animate-float dark:hidden" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-crimson-50/30 rounded-full blur-[120px] animate-float dark:hidden" style={{ animationDelay: '3s' }} />

        <div className="relative max-w-4xl mx-auto text-center z-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-3 bg-white/80 dark:bg-[#141414] backdrop-blur-md dark:backdrop-blur-none border border-crimson-100 dark:border-[#2a2a2a] text-crimson-700 dark:text-crimson-500 text-[10px] font-bold px-4 py-1.5 rounded-full mb-10 tracking-widest uppercase shadow-sm dark:shadow-none">
            <span className="w-2 h-2 rounded-full bg-crimson-500 animate-pulse" />
            India's Real-Time Blood Network
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-neutral-900 dark:text-white leading-[1.05] tracking-tightest mb-8 font-header">
            Every Drop <span className="text-gradient">Counts.</span>
          </h1>

          <p className="text-xl text-neutral-500 leading-relaxed max-w-2xl mx-auto mb-12 font-medium">
            Connecting verified donors and licensed hospitals across India — with privacy-first emergency matching, NBTC-compliant onboarding, and real-time inventory transfers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/register/donor"
              className="btn-primary w-full sm:w-auto px-10 py-4 text-lg flex items-center gap-3 group">
              <Heart className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
              Register as a Donor
            </Link>
            <Link to="/register/hospital"
              className="w-full sm:w-auto px-10 py-4 text-lg bg-white dark:bg-[#0a0a0a] border-2 border-neutral-200 dark:border-[#2a2a2a] text-neutral-800 dark:text-neutral-100 font-bold rounded-xl hover:bg-neutral-50 dark:hover:border-neutral-500 transition-all shadow-sm dark:shadow-none flex items-center justify-center gap-3 group">
              <Building2 className="w-5 h-5 text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-white transition-colors" />
              Hospital Onboarding
            </Link>
          </div>
          
          {/* Trust Badges */}
          <div className="mt-20 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-3 px-6 py-3 glass dark:!bg-[#141414] dark:!border-[#2a2a2a] rounded-2xl shadow-sm dark:shadow-none">
              <ShieldCheck className="w-5 h-5 text-crimson-600 dark:text-crimson-500" />
              <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">NBTC Compliant</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 glass dark:!bg-[#141414] dark:!border-[#2a2a2a] rounded-2xl shadow-sm dark:shadow-none">
              <Lock className="w-5 h-5 text-crimson-600 dark:text-crimson-500" />
              <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Privacy-First</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 glass dark:!bg-[#141414] dark:!border-[#2a2a2a] rounded-2xl shadow-sm dark:shadow-none">
              <Activity className="w-5 h-5 text-crimson-600 dark:text-crimson-500" />
              <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Real-Time Matching</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section className="py-32 px-8 bg-white dark:bg-transparent relative z-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4 font-header">
              How It Works
            </h2>
            <p className="text-lg text-neutral-400 max-w-md mx-auto font-medium">
              Seamlessly connecting lifesavers with those in critical need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <FeatureCard 
              icon={<Users className="w-8 h-8" />}
              title="NBTC-Compliant Signup"
              desc="Donors complete a health self-declaration checklist. Hospitals submit CDSCO licenses for admin verification."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8" />}
              title="Emergency Matching"
              desc="Hospitals broadcast urgent needs. Eligible local donors are notified and can accept — their contact is only revealed after they click Accept."
              delay="0.2s"
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8" />}
              title="B2B Stock Transfers"
              desc="Verified hospitals can view nearby blood bank inventories and initiate inter-hospital transfers with a digital manifest."
              delay="0.4s"
            />
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <section className="py-32 px-8 bg-white dark:bg-[#0a0a0a] border border-neutral-100 dark:border-[#2a2a2a] text-neutral-900 dark:text-white rounded-[3rem] mx-6 mb-32 overflow-hidden relative shadow-2xl shadow-neutral-200/50 dark:shadow-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-crimson-600/20 blur-[100px] dark:hidden" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <Stat value="12,500+" label="Verified Donors" />
            <Stat value="450+" label="Partner Hospitals" />
            <Stat value="99.9%" label="Uptime Service" />
            <Stat value="24/7" label="Emergency Support" />
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="px-8 pb-32">
        <div className="max-w-5xl mx-auto glass rounded-[3rem] py-20 px-12 text-center text-neutral-900 dark:text-white relative overflow-hidden border border-neutral-100 dark:border-[#2a2a2a] shadow-2xl shadow-neutral-200/50 dark:shadow-none">
          <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[100%] bg-crimson-600/20 blur-[100px] dark:hidden animate-float" />
          <h2 className="text-5xl font-bold mb-6 font-header">
            Start Your <span className="text-crimson-500">Lifesaving</span> Journey
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-xl font-medium mb-12 max-w-xl mx-auto">
            Join the most technologically advanced blood network. It takes less than 2 minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/register/donor" className="btn-primary px-10 py-5 text-lg flex items-center gap-3">
              <Heart className="w-5 h-5 fill-white" /> Register as a Donor
            </Link>
            <Link to="/register/hospital" className="px-10 py-5 text-lg flex items-center gap-3 bg-neutral-100 dark:bg-white/10 border-2 border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-white/20 transition-all">
              <Building2 className="w-5 h-5" /> Hospital Onboarding <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay = "0s" }) {
  return (
    <div className="group glass p-10 rounded-[2.5rem] hover:border-crimson-100 dark:hover:border-crimson-900/50 transition-all duration-500 hover:-translate-y-2 animate-fade-in-up" style={{ animationDelay: delay }}>
      <div className="w-16 h-16 rounded-[1.25rem] bg-crimson-50 dark:bg-crimson-900/20 text-crimson-600 dark:text-crimson-400 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-crimson-600 group-hover:text-white transition-all duration-500">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4 font-header">{title}</h3>
      <p className="text-neutral-500 leading-relaxed font-medium">
        {desc}
      </p>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="text-center group">
      <div className="text-5xl font-black text-neutral-900 dark:text-white mb-3 group-hover:text-crimson-500 transition-colors duration-500 font-header">{value}</div>
      <div className="text-xs text-neutral-400 uppercase tracking-widest font-bold">{label}</div>
    </div>
  );
}
