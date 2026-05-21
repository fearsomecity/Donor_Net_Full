import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Heart, Activity, MapPin, Droplets, Calendar, ArrowRight, ShieldCheck, Box, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { fetchAPI } from '../utils/apiClient';

export default function HospitalDonate() {
  const { user } = useAuthStore();
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fulfilling, setFulfilling] = useState(null); // id of request being fulfilled
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI('/api/requests/all');
      const data = await res.json();

      if (!Array.isArray(data)) {
        setAllRequests([]);
        return;
      }

      // Filter out this hospital's own requests
      const filtered = data.filter(req =>
        req.hospitalName !== user?.profile?.hospitalName
      );
      setAllRequests(filtered);
    } catch (err) {
      console.error('Error fetching global requests:', err);
      setAllRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDonate = async (reqId, bloodType, unitsNeeded) => {
    setFulfilling(reqId);
    try {
      const res = await fetchAPI(`/api/requests/${reqId}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferUnits: unitsNeeded, type: bloodType })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Transfer successful! Inventory updated.', 'success');
        fetchRequests();
      } else {
        showToast(data.message || 'Transfer failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error. Try again.', 'error');
    } finally {
      setFulfilling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-crimson-50 rounded-2xl flex items-center justify-center animate-pulse-slow">
            <RefreshCw className="w-8 h-8 text-crimson-600 animate-spin" />
          </div>
          <span className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Scanning Ecosystem...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] pt-32 pb-20 px-6 overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-sm font-bold animate-fade-in-up border ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30'
            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-crimson-100/30 rounded-full blur-[100px] animate-float dark:hidden" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/30 rounded-full blur-[100px] animate-float dark:hidden" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-6xl mx-auto z-10">
        <header className="mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-[#141414] text-white text-[10px] font-bold px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
            <ShieldCheck className="w-3 h-3 text-crimson-500" />
            Medical Logistics
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-neutral-900 dark:text-white tracking-tightest mb-4 font-header">Supply Transfers</h1>
          <p className="text-xl text-neutral-500 max-w-2xl font-medium">Assist other medical centers by fulfilling urgent blood shortages through official peer-to-peer transfers.</p>
        </header>

        <div className="glass rounded-[3rem] overflow-hidden shadow-2xl dark:shadow-none animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="p-10 border-b border-neutral-100 dark:border-[#2a2a2a] flex items-center justify-between bg-white/50 dark:bg-transparent">
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white font-header flex items-center gap-3">
              <Heart className="w-6 h-6 text-crimson-600" />
              Active Market Shortages
            </h2>
            <button onClick={fetchRequests} className="p-2.5 rounded-xl text-neutral-400 hover:text-crimson-600 hover:bg-crimson-50 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="p-8 space-y-6 min-h-[500px]">
            {allRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-24 h-24 bg-neutral-50 dark:bg-[#0a0a0a] rounded-[2.5rem] flex items-center justify-center mb-6 border border-neutral-100 dark:border-[#2a2a2a]">
                  <Box className="w-10 h-10 text-neutral-300" />
                </div>
                <p className="text-xl font-bold text-neutral-400 font-header">Stability Detected.</p>
                <p className="text-sm text-neutral-300 font-medium mt-2">No external shortages are currently reported in your region.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {allRequests.map((req, i) => (
                  <div
                    key={req._id}
                    className="group flex flex-col lg:flex-row items-center justify-between p-8 rounded-[2.5rem] bg-white dark:bg-[#141414] border border-neutral-100 dark:border-[#2a2a2a] hover:border-crimson-200 transition-all duration-500 shadow-sm dark:shadow-none hover:shadow-xl hover:shadow-crimson-500/5 animate-fade-in-up"
                    style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                  >
                    <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                      <div className="w-24 h-24 rounded-3xl bg-crimson-50 flex flex-col items-center justify-center font-black group-hover:scale-105 transition-transform duration-500">
                        <Droplets className="w-6 h-6 text-crimson-600 mb-1" />
                        <span className="text-3xl font-header text-crimson-600 leading-none tracking-tighter">{req.bloodType}</span>
                      </div>

                      <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            req.urgencyLevel === 'critical' ? 'bg-red-50 text-red-600 ring-1 ring-red-100' : 'bg-amber-50 text-amber-600 ring-1 ring-amber-100'
                          }`}>
                            {req.urgencyLevel} Priority
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                            <Calendar className="w-3.5 h-3.5" />
                            Posted {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-2xl font-black text-neutral-900 dark:text-white font-header tracking-tight flex items-center justify-center md:justify-start gap-3">
                            {req.hospitalName}
                            <MapPin className="w-4 h-4 text-neutral-300" />
                          </h3>
                          <p className="text-lg text-neutral-500 font-medium">
                            Deficit of <strong className="text-neutral-900 dark:text-white">{req.unitsNeeded} units</strong>
                          </p>
                        </div>

                        {req.message && (
                          <div className="inline-block p-4 rounded-2xl bg-neutral-50/50 dark:bg-[#0a0a0a] text-sm border border-neutral-100 dark:border-[#2a2a2a]/50 text-neutral-400 font-medium italic">
                            "{req.message}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full lg:w-auto mt-8 lg:mt-0 lg:pl-10 lg:border-l border-neutral-100 dark:border-[#2a2a2a]">
                      <button
                        onClick={() => handleDonate(req._id, req.bloodType, req.unitsNeeded)}
                        disabled={fulfilling === req._id}
                        className="w-full btn-primary px-10 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 group overflow-hidden disabled:opacity-60"
                      >
                        {fulfilling === req._id ? (
                          <><RefreshCw className="w-5 h-5 animate-spin" /> Processing...</>
                        ) : (
                          <><Box className="w-5 h-5" /> Prepare Transfer <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
