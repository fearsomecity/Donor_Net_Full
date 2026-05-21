import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Plus, X, Trash2, CheckCircle, Activity, Droplets, MapPin, Calendar, Terminal } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { fetchAPI } from '../utils/apiClient';

export default function HospitalRequests() {
  const { user, token } = useAuthStore();
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // New Request Form State
  const [newRequest, setNewRequest] = useState({
    bloodType: 'O-',
    unitsNeeded: 5,
    urgencyLevel: 'high',
    zipCode: user?.profile?.zipCode || '',
    message: ''
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI('/api/requests/hospital');
      const data = await res.json();
      setMyRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setMyRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchRequests();
  }, [token]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setModalError('');

    const zipCode = newRequest.zipCode || user?.profile?.zipCode || user?.profile?.zip || '';
    if (!zipCode) {
      setModalError('Zip code is required. Please enter your hospital\'s zip code.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchAPI('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodType: newRequest.bloodType,
          unitsNeeded: newRequest.unitsNeeded,
          urgencyLevel: newRequest.urgencyLevel,
          message: newRequest.message,
          zipCode,
          city: user?.profile?.city || '',
          hospitalName: user?.profile?.hospitalName || 'City Hospital'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setModalError('');
        showToast('Request broadcasted successfully!', 'success');
        fetchRequests();
      } else {
        setModalError(data.message || 'Failed to create request. Try again.');
      }
    } catch (err) {
      console.error('Error creating request:', err);
      setModalError('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      const res = await fetchAPI(`/api/requests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchRequests();
    } catch (err) {
      console.error('Error deleting request:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-crimson-50 rounded-2xl flex items-center justify-center animate-pulse-slow">
            <RefreshCw className="w-8 h-8 text-crimson-600 animate-spin" />
          </div>
          <span className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Syncing Requests...</span>
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
      {/* Aesthetic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-crimson-100/30 rounded-full blur-[100px] animate-float dark:hidden" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/30 rounded-full blur-[100px] animate-float dark:hidden" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-6xl mx-auto z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 animate-fade-in-up">
          <div>
            <div className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-[#141414] text-white text-[10px] font-bold px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
              <Activity className="w-3 h-3 text-crimson-500" />
              Live Demand Center
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-neutral-900 dark:text-white tracking-tightest mb-4 font-header">My Requests</h1>
            <p className="text-xl text-neutral-500 max-w-2xl font-medium">Manage and monitor your hospital's urgent blood requirements in real-time.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="btn-primary px-8 py-5 rounded-2xl font-bold flex items-center gap-3 group active:scale-95 shadow-xl dark:shadow-none shadow-crimson-100 overflow-hidden"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="relative z-10">Broadcast New Request</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          </button>
        </header>

        <div className="glass rounded-[3rem] overflow-hidden shadow-2xl dark:shadow-none shadow-neutral-200/50 dark:shadow-none animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
           <div className="p-10 border-b border-neutral-100 dark:border-[#2a2a2a] flex items-center justify-between bg-white/50 dark:bg-transparent">
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white font-header flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-crimson-600" />
                Active Broadcasts
              </h2>
              <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-crimson-600 animate-pulse" />
                    {myRequests.length} Active Requests
                 </div>
              </div>
           </div>

          <div className="p-8 space-y-6 min-h-[400px]">
            {myRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-24 h-24 bg-neutral-50 dark:bg-[#0a0a0a] rounded-[2.5rem] flex items-center justify-center mb-6 border border-neutral-100 dark:border-[#2a2a2a]">
                  <Terminal className="w-10 h-10 text-neutral-300" />
                </div>
                <p className="text-xl font-bold text-neutral-400 font-header">No active requests found.</p>
                <p className="text-sm text-neutral-300 font-medium mt-2">Your current inventory levels seem stable.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myRequests.map((req, i) => (
                  <div 
                    key={req._id} 
                    className="group p-8 rounded-[2.5rem] bg-white dark:bg-[#141414] border border-neutral-100 dark:border-[#2a2a2a] hover:border-crimson-200 transition-all duration-500 shadow-sm dark:shadow-none hover:shadow-xl dark:shadow-none hover:shadow-crimson-500/5 animate-fade-in-up"
                    style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-6">
                        <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center font-black transition-all group-hover:scale-110 ${
                          req.urgencyLevel === 'critical' 
                            ? 'bg-red-600 text-white shadow-xl dark:shadow-none shadow-red-100' 
                            : 'bg-crimson-50 text-crimson-600'
                        }`}>
                           <Droplets className="w-5 h-5 mb-1" />
                           <span className="text-2xl font-header leading-none">{req.bloodType}</span>
                        </div>
                        <div>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 ${
                            req.urgencyLevel === 'critical' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            <Activity className="w-3 h-3" />
                            {req.urgencyLevel} Urgency
                          </div>
                          <h3 className="text-2xl font-black text-neutral-900 dark:text-white font-header">{req.unitsNeeded} Units Required</h3>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                       <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest py-3 border-b border-neutral-50">
                          <span className="text-neutral-400">Broadcast Date</span>
                          <span className="text-neutral-900 dark:text-white flex items-center gap-2">
                             <Calendar className="w-3.5 h-3.5 text-crimson-600" />
                             {new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                       </div>
                       {req.message && (
                         <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-[#0a0a0a] text-sm text-neutral-500 font-medium italic border border-neutral-100 dark:border-[#2a2a2a]/50">
                           "{req.message}"
                         </div>
                       )}
                    </div>

                    <div className="flex items-center gap-3">
                       <button onClick={() => handleDeleteRequest(req._id)} className="flex-1 py-4 rounded-2xl bg-green-50 text-green-700 font-bold text-xs uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Mark Resolved
                       </button>
                       <button onClick={() => handleDeleteRequest(req._id)} className="w-14 h-14 rounded-2xl bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-400 hover:bg-crimson-50 hover:text-crimson-600 transition-all flex items-center justify-center">
                          <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-neutral-900/60 backdrop-blur-md dark:backdrop-blur-none animate-fade-in">
           <div className="relative bg-white dark:bg-[#141414] rounded-[3.5rem] w-full max-w-xl shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] border border-neutral-100 dark:border-[#2a2a2a] overflow-hidden flex flex-col animate-fade-in-up">
              <div className="p-10 bg-neutral-900 dark:bg-[#141414] text-white flex items-center justify-between">
                 <div>
                    <div className="inline-flex items-center gap-2 text-crimson-500 text-[10px] font-black tracking-widest uppercase mb-2">
                       <Activity className="w-3 h-3" />
                       Emergency Broadcast
                    </div>
                    <h3 className="text-4xl font-black font-header tracking-tight">Post Request</h3>
                 </div>
                 <button onClick={() => setShowModal(false)} className="w-14 h-14 bg-white/10 hover:border-neutral-900 dark:hover:border-white/20 rounded-2xl flex items-center justify-center transition-colors cursor-pointer active:scale-90">
                    <X className="w-8 h-8" />
                 </button>
              </div>
              
              <form onSubmit={handleCreateRequest} className="p-12 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest ml-1">Target Blood Type</label>
                       <div className="relative group">
                          <select 
                             value={newRequest.bloodType} 
                             onChange={(e) => setNewRequest({...newRequest, bloodType: e.target.value})} 
                             className="w-full h-16 px-6 rounded-2xl bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-[#2a2a2a] outline-none text-lg font-black font-header appearance-none focus:bg-white dark:bg-[#141414] focus:border-crimson-500 transition-all"
                          >
                            {bloodTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-300">
                             <Droplets className="w-6 h-6" />
                          </div>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest ml-1">Units Required</label>
                       <input 
                         type="number" 
                         value={newRequest.unitsNeeded} 
                         onChange={(e) => setNewRequest({...newRequest, unitsNeeded: parseInt(e.target.value) || 0})} 
                         className="w-full h-16 px-6 rounded-2xl bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-[#2a2a2a] outline-none text-xl font-black font-header focus:bg-white dark:bg-[#141414] focus:border-crimson-500 transition-all" 
                       />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest ml-1">Urgency Priority</label>
                    <div className="grid grid-cols-3 gap-3">
                       {['normal', 'high', 'critical'].map(level => (
                         <button 
                           key={level} 
                           type="button" 
                           onClick={() => setNewRequest({...newRequest, urgencyLevel: level})} 
                           className={`h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                             newRequest.urgencyLevel === level 
                               ? 'bg-crimson-600 text-white border-crimson-700 shadow-xl dark:shadow-none shadow-crimson-100 scale-[1.02]' 
                               : 'bg-white dark:bg-[#141414] text-neutral-400 border-neutral-100 dark:border-[#2a2a2a] hover:bg-neutral-50 dark:bg-[#0a0a0a]'
                           }`}
                         >
                            {level}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest ml-1">Additional Context (Optional)</label>
                    <textarea
                      placeholder="Special instructions or patient requirements..."
                      value={newRequest.message}
                      onChange={(e) => setNewRequest({...newRequest, message: e.target.value})}
                      className="w-full h-32 p-6 rounded-[2rem] bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-[#2a2a2a] outline-none text-base font-medium resize-none focus:bg-white dark:bg-[#141414] focus:border-crimson-500 transition-all shadow-inner"
                    />
                 </div>

                 <div className="space-y-2">
                   <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <MapPin className="w-3 h-3" /> Hospital Zip Code
                   </label>
                   <input
                     type="text"
                     required
                     value={newRequest.zipCode}
                     onChange={(e) => setNewRequest({...newRequest, zipCode: e.target.value})}
                     placeholder="e.g. 110001"
                     className="w-full h-14 px-6 rounded-2xl bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-[#2a2a2a] outline-none font-bold focus:bg-white dark:bg-[#141414] focus:border-crimson-500 transition-all"
                   />
                 </div>

                 {modalError && (
                   <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-bold border border-red-100 dark:border-red-800/30">
                     <AlertCircle className="w-4 h-4 flex-shrink-0" />
                     {modalError}
                   </div>
                 )}

                 <button
                   type="submit"
                   disabled={submitting}
                   className="btn-primary w-full py-6 rounded-[2rem] font-black text-lg shadow-2xl dark:shadow-none shadow-crimson-100 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-3"
                 >
                   {submitting
                     ? <><RefreshCw className="w-5 h-5 animate-spin" /> Broadcasting...</>
                     : "Broadcast Request"}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
