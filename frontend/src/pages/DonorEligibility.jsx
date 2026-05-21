import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Calendar, Heart, MapPin, Droplets, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { fetchAPI } from '../utils/apiClient';

export default function DonorEligibility() {
  const { user, token } = useAuthStore();
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEligibility = async () => {
      try {
        const res = await fetchAPI('/api/donors/eligibility', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        setEligibility(data);
      } catch (err) {
        console.error('Error fetching eligibility:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchEligibility();
  }, [token]);

  const handleDonate = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI('/api/donors/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ lastDonationDate: new Date().toISOString() })
      });
      if (res.ok) {
        alert('🎉 Thank you for your donation! Your status is being updated.');
        window.location.reload();
      }
    } catch (err) {
      console.error('Error recording donation:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-crimson-50 rounded-2xl flex items-center justify-center animate-pulse-slow">
             <RefreshCw className="w-8 h-8 text-crimson-600 animate-spin" />
          </div>
          <span className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Verifying Status...</span>
        </div>
      </div>
    );
  }

  const isEligible = eligibility ? eligibility.eligible : true;
  const nextDate = eligibility?.nextEligibleDate || user?.profile?.nextEligibleDate;

  return (
    <div className="relative min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] pt-32 pb-20 px-6 overflow-hidden">
      {/* Aesthetic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-crimson-100/30 rounded-full blur-[100px] animate-float dark:hidden" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-crimson-50/30 rounded-full blur-[100px] animate-float dark:hidden" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-5xl mx-auto z-10">
        <header className="mb-16 animate-fade-in-up">
           <div className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-[#141414] text-white text-[10px] font-bold px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
            <ShieldCheck className="w-3 h-3 text-crimson-500" />
            Health Verification
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-neutral-900 dark:text-white tracking-tightest mb-4 font-header">My Eligibility</h1>
          <p className="text-xl text-neutral-500 max-w-2xl font-medium">Verify your current donation status and track your recovery cycle.</p>
        </header>

        <div className="glass p-12 rounded-[3rem] animate-fade-in-up shadow-2xl dark:shadow-none shadow-neutral-200/50 dark:shadow-none" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            {/* Left Column: Status & Info */}
            <div className="flex-1 space-y-10">
              <div className="space-y-6">
                <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full font-black text-[11px] uppercase tracking-widest ${
                  isEligible 
                    ? 'bg-green-50 text-green-600 ring-1 ring-green-100' 
                    : 'bg-amber-50 text-amber-600 ring-1 ring-amber-100'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isEligible ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                  {isEligible ? 'Active Donor' : 'Recovery Phase'}
                </div>
                
                <h2 className="text-5xl font-black text-neutral-900 dark:text-white font-header leading-tight">
                  {isEligible ? 'Ready to save another life?' : 'Your body is currently recovering.'}
                </h2>
                
                <p className="text-xl text-neutral-500 font-medium leading-relaxed">
                  {eligibility?.message || 'We carefully monitor your donation frequency to ensure your health comes first.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-6 pt-4">
                {isEligible ? (
                  <Link 
                    to="/donor/book-appointment" 
                    className="btn-primary px-10 py-5 rounded-2xl font-bold flex items-center gap-3 group overflow-hidden"
                  >
                    <Calendar className="w-5 h-5" />
                    Book Appointment
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  </Link>
                ) : (
                  nextDate && (
                    <div className="p-8 rounded-[2rem] bg-amber-50/50 border border-amber-100 flex items-center gap-6 group hover:border-neutral-900 dark:hover:border-white dark:bg-[#141414] transition-all duration-500">
                      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#141414] flex items-center justify-center text-amber-600 shadow-sm dark:shadow-none ring-4 ring-amber-50">
                        <Clock className="w-8 h-8 group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-amber-600/60 uppercase tracking-widest mb-1">Available On</p>
                        <p className="text-2xl font-black text-neutral-900 dark:text-white font-header">
                           {new Date(nextDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )
                )}
                <Link to="/donor/urgent-needs" className="px-10 py-5 rounded-2xl bg-white dark:bg-[#141414] border border-neutral-100 dark:border-[#2a2a2a] text-neutral-900 dark:text-white font-bold hover:bg-neutral-50 dark:bg-[#0a0a0a] transition-all flex items-center gap-3 active:scale-95 shadow-sm dark:shadow-none">
                   Find Local Centers
                </Link>
              </div>
            </div>

            {/* Right Column: Blood Type Visual */}
            <div className="relative group">
               <div className="absolute inset-0 bg-crimson-100 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
               <div className="relative w-72 h-72 rounded-[3.5rem] bg-white dark:bg-[#141414] border border-neutral-100 dark:border-[#2a2a2a] shadow-2xl dark:shadow-none flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-crimson-50/50 rounded-full blur-2xl" />
                  
                  <div className="relative space-y-2 text-center">
                    <div className="inline-flex items-center gap-2 text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-2">
                       <Droplets className="w-3 h-3 text-crimson-500" />
                       Patient Match
                    </div>
                    <div className="text-[8rem] font-black text-crimson-600 tracking-tighter leading-none font-header select-none group-hover:scale-110 transition-transform duration-700">
                       {user?.profile?.bloodType || '??'}
                    </div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] mt-4">Verified Type</p>
                  </div>

                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-crimson-50 rounded-full">
                     <CheckCircle className="w-3 h-3 text-crimson-600" />
                     <span className="text-[10px] font-black text-crimson-700 uppercase">Secured</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
        
        {/* Help Tip */}
        <div className="mt-12 flex items-center justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
           <div className="h-px w-20 bg-neutral-200" />
           <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-3">
              Need help? <Link to="/donor/ai-assistant" className="text-crimson-600 hover:underline">Ask our AI Assistant</Link>
           </p>
           <div className="h-px w-20 bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}
