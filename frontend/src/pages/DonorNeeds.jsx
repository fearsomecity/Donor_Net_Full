import { useState, useEffect } from 'react';
import { MapPin, AlertCircle, RefreshCw, Droplets, ArrowRight, Heart, Calendar, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { fetchAPI } from '../utils/apiClient';

export default function DonorNeeds() {
  const { user, token } = useAuthStore();
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const zipCode = user?.profile?.zipCode;
        if (!zipCode) { setLoading(false); return; }
        const res = await fetchAPI(`/api/requests/nearby?zipCode=${zipCode}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setUrgentRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setUrgentRequests([]);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchRequests();
    else setLoading(false);
  }, [token, user]);

  const navigate = useNavigate();

  const handleDonate = (req) => {
    navigate('/donor/book-appointment', { 
      state: { 
        selectedHospital: { 
          id: req.hospitalId, 
          name: req.hospitalName,
          address: req.address || 'Local Medical Center',
          zip: req.zipCode
        } 
      } 
    });
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-crimson-50 rounded-2xl flex items-center justify-center animate-pulse-slow">
             <RefreshCw className="w-8 h-8 text-crimson-600 animate-spin" />
          </div>
          <span className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Finding urgent needs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] pt-32 pb-20 px-6 overflow-hidden">
      {/* Aesthetic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-crimson-100/30 rounded-full blur-[100px] animate-float dark:hidden" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-crimson-50/30 rounded-full blur-[100px] animate-float dark:hidden" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-6xl mx-auto z-10">
        <header className="mb-16 animate-fade-in-up">
           <div className="inline-flex items-center gap-2 bg-crimson-50 text-crimson-700 text-[10px] font-bold px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
            <Droplets className="w-3 h-3" />
            Live Emergency Network
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-neutral-900 dark:text-white tracking-tightest mb-4 font-header">Urgent Needs</h1>
          <p className="text-xl text-neutral-500 max-w-2xl font-medium">Local patients are waiting for your specific blood type. Every minute counts.</p>
        </header>

        <div className="glass p-10 rounded-[2.5rem] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
           <div className="flex items-center justify-between mb-12">
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-crimson-500 animate-ping" />
               <h3 className="text-2xl font-bold text-neutral-900 dark:text-white font-header">Nearby Requests</h3>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full">
                <MapPin className="w-3 h-3 text-neutral-400" />
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                   {user?.profile?.zipCode || 'AREA CODE'}
                </span>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {urgentRequests.length === 0 ? (
                <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center text-center py-20 bg-neutral-50/50 dark:bg-[#0a0a0a] rounded-3xl border border-dashed border-neutral-200 dark:border-[#333]">
                   <AlertCircle className="w-16 h-16 text-neutral-200 mb-6" />
                   <p className="text-xl font-bold text-neutral-400 font-header">No Active Shortages</p>
                   <p className="text-sm text-neutral-400 font-medium mt-2">All local hospitals are currently stable. Great job!</p>
                </div>
              ) : (
                urgentRequests.map((req, i) => (
                  <div key={i} className="group p-8 rounded-[2.5rem] bg-white dark:bg-[#141414] border border-neutral-100 dark:border-[#2a2a2a] hover:border-crimson-100 transition-all duration-500 shadow-sm dark:shadow-none hover:shadow-xl dark:shadow-none hover:shadow-crimson-100/10">
                     <div className="flex items-center justify-between mb-8">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          req.urgencyLevel === 'critical' ? 'bg-red-50 text-red-600 ring-1 ring-red-100' : 
                          req.urgencyLevel === 'high' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100' : 'bg-blue-50 text-blue-600 ring-1 ring-blue-100'
                        }`}>
                          {req.urgencyLevel} Urgency
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                           <Calendar className="w-3 h-3" />
                           {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                     </div>
                     
                     <div className="flex gap-6 mb-8">
                        <div className="w-20 h-20 rounded-[1.5rem] bg-crimson-50 flex flex-col items-center justify-center group-hover:bg-crimson-600 group-hover:scale-110 transition-all duration-500 shadow-sm dark:shadow-none">
                           <span className="text-3xl font-black text-crimson-600 tracking-tighter group-hover:text-white">{req.bloodType}</span>
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                              <Building2 className="w-3 h-3" /> Requested By
                           </div>
                           <h4 className="text-xl font-bold text-neutral-900 dark:text-white font-header line-clamp-1 mb-2">{req.hospitalName}</h4>
                           <div className="flex items-center gap-2 text-sm font-bold text-crimson-600">
                              <Heart className="w-4 h-4 fill-crimson-600" />
                              {req.unitsNeeded} Units Required
                           </div>
                        </div>
                     </div>
                     
                     {req.message && (
                       <div className="p-6 rounded-2xl bg-neutral-50/50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-[#2a2a2a] text-sm font-medium text-neutral-500 italic mb-8 relative">
                         <div className="absolute top-0 left-6 -translate-y-1/2 w-8 h-4 bg-neutral-50 dark:bg-[#0a0a0a] rounded-t-lg border-t border-x border-neutral-100 dark:border-[#2a2a2a]" />
                         "{req.message}"
                       </div>
                     )}
                     
                     <button 
                        onClick={() => handleDonate(req)} 
                        className="btn-primary w-full py-4 text-xs flex items-center justify-center gap-3 overflow-hidden group/btn"
                      >
                        <Heart className="w-4 h-4" />
                        I Can Save a Life Here
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                     </button>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
