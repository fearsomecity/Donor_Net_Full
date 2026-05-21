import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { Heart, Activity, ArrowRight, Calendar, Droplets, Clock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchAPI } from '../utils/apiClient';

// Computes days remaining and a label for the eligibility countdown
function getEligibilityStatus(user) {
  const gender = user?.profile?.gender;
  const lastDate = user?.profile?.lastDonationDate;
  const cooldownDays = gender === 'female' ? 120 : 90; // NBTC: 90d men, 120d women

  if (!lastDate) return { eligible: true, label: 'Eligible to Donate', daysLeft: 0, percent: 100 };
  
  const last = new Date(lastDate);
  const now = new Date();
  const daysSince = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, cooldownDays - daysSince);
  const percent = Math.min(100, Math.round((daysSince / cooldownDays) * 100));

  if (daysLeft === 0) return { eligible: true, label: 'Eligible to Donate', daysLeft: 0, percent: 100 };
  return {
    eligible: false,
    label: `Eligible in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    daysLeft,
    percent,
    nextDate: new Date(last.getTime() + cooldownDays * 24 * 60 * 60 * 1000)
  };
}

export default function DonorDashboard() {
  const { user, token } = useAuthStore();
  const [liveRequests, setLiveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptedIds, setAcceptedIds] = useState(new Set());
  const [acceptStatus, setAcceptStatus] = useState({}); // id → { loading, token, error }

  const eligibility = getEligibilityStatus(user);
  const totalDonations = user?.profile?.donations?.length || 0;
  const livesSaved = totalDonations * 3;

  useEffect(() => {
    const fetchNearbyRequests = async () => {
      try {
        const zipCode = user?.profile?.zipCode;
        if (!zipCode || !token) return;
        const res = await fetchAPI(`/api/requests/nearby?zipCode=${zipCode}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setLiveRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch live requests', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNearbyRequests();
  }, [user, token]);

  const handleAccept = async (requestId) => {
    setAcceptStatus(prev => ({ ...prev, [requestId]: { loading: true } }));
    try {
      const res = await fetchAPI(`/api/requests/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to accept');
      setAcceptedIds(prev => new Set([...prev, requestId]));
      setAcceptStatus(prev => ({ ...prev, [requestId]: { donationToken: data.donationToken, hospital: data.hospital } }));
    } catch (err) {
      setAcceptStatus(prev => ({ ...prev, [requestId]: { error: err.message } }));
    }
  };

  const healthOk = user?.profile?.healthCheckCompleted;

  return (
    <div className="relative min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] pt-32 pb-20 px-6 overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-crimson-100/30 rounded-full blur-[100px] animate-float dark:hidden" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-crimson-50/30 rounded-full blur-[100px] animate-float dark:hidden" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-6xl mx-auto z-10">
        <header className="mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-crimson-50 text-crimson-700 text-[10px] font-bold px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
            <Droplets className="w-3 h-3" /> Active Donor Status
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-neutral-900 dark:text-white tracking-tightest mb-4 font-header">
            Welcome back, <span className="text-gradient">{user?.profile?.name?.split(' ')[0] || 'Hero'}</span>!
          </h1>
          <p className="text-xl text-neutral-500 max-w-2xl font-medium">
            Your contributions have already impacted multiple lives. Ready for your next mission?
          </p>
        </header>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Eligibility Countdown */}
          <div className={`glass p-8 rounded-[2.5rem] ${eligibility.eligible ? 'border-crimson-100' : ''}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${eligibility.eligible ? 'bg-crimson-600 text-white' : 'bg-amber-50 text-amber-600'}`}>
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Next Eligible Date</p>
            <p className={`text-2xl font-black font-header mb-3 ${eligibility.eligible ? 'text-crimson-600' : 'text-neutral-900 dark:text-white'}`}>
              {eligibility.label}
            </p>
            {!eligibility.eligible && (
              <>
                <div className="w-full bg-neutral-100 dark:bg-[#2a2a2a] rounded-full h-2 mb-2 overflow-hidden">
                  <div className="bg-crimson-600 h-2 rounded-full transition-all duration-700" style={{ width: `${eligibility.percent}%` }} />
                </div>
                <p className="text-xs text-neutral-400 font-medium">
                  {eligibility.percent}% of cooldown passed · {user?.profile?.gender === 'female' ? '120-day (female)' : '90-day (male)'} rule
                </p>
              </>
            )}
          </div>

          <Link to="/donor/urgent-needs" className="group glass p-8 rounded-[2.5rem] hover:-translate-y-2 transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-600 group-hover:bg-crimson-50 group-hover:text-crimson-600 flex items-center justify-center mb-6 transition-all">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Live Requests Near You</p>
            <p className="text-2xl font-black font-header text-neutral-900 dark:text-white mb-3">
              {loading ? '...' : `${liveRequests.length} Active`}
            </p>
            <p className="text-sm text-neutral-400 font-medium mb-4">Hospitals in your area requesting your blood type.</p>
            <div className="flex items-center gap-2 text-xs font-bold text-crimson-600 uppercase tracking-widest group-hover:gap-4 transition-all">
              View All <ArrowRight className="w-3 h-3" />
            </div>
          </Link>

          <div className="glass p-8 rounded-[2.5rem]">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-600 flex items-center justify-center mb-6">
              <Heart className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Total Impact</p>
            <p className="text-2xl font-black font-header text-neutral-900 dark:text-white mb-3">{livesSaved} Lives</p>
            <p className="text-sm text-neutral-400 font-medium">
              {totalDonations} donation{totalDonations !== 1 ? 's' : ''} completed. Amazing work!
            </p>
          </div>
        </div>

        {/* Privacy + health check notices */}
        {!healthOk && (
          <div className="mb-8 p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-2xl flex items-center gap-4 animate-fade-in-up">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-400 text-sm">Health Declaration Incomplete</p>
              <p className="text-amber-700 dark:text-amber-500 text-xs">Complete your NBTC health checklist to appear in emergency broadcasts.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Live Emergency Request Feed */}
          <div className="glass p-10 rounded-[2.5rem] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white font-header">Emergency Feed</h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-crimson-600 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-crimson-600 animate-pulse" /> Live
              </div>
            </div>
            <div className="space-y-4 flex-1">
              {loading ? (
                <div className="p-8 text-center animate-pulse text-neutral-400 font-bold uppercase tracking-widest text-[10px]">Loading...</div>
              ) : liveRequests.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-neutral-100 dark:border-[#2a2a2a] rounded-3xl text-center">
                  <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">No active requests near you</p>
                  <p className="text-xs text-neutral-300 mt-2">You'll be notified when a matching request appears.</p>
                </div>
              ) : (
                liveRequests.slice(0, 3).map(req => (
                  <RequestCard
                    key={req._id}
                    req={req}
                    accepted={acceptedIds.has(req._id)}
                    status={acceptStatus[req._id]}
                    onAccept={() => handleAccept(req._id)}
                    eligible={eligibility.eligible}
                    healthOk={healthOk}
                  />
                ))
              )}
            </div>
            {liveRequests.length > 3 && (
              <Link to="/donor/urgent-needs" className="mt-6 text-center text-sm font-bold text-crimson-600 hover:underline flex items-center justify-center gap-1">
                View all {liveRequests.length} requests <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Privacy + AI section */}
          <div className="space-y-8 flex flex-col">
            {/* Privacy Visibility Card */}
            <div className="glass p-8 rounded-[2.5rem]">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 font-header">Privacy Settings</h2>
              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-[#141414] rounded-2xl border border-neutral-100 dark:border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                  {user?.profile?.privacyVisible !== false ? <Eye className="w-5 h-5 text-crimson-600" /> : <EyeOff className="w-5 h-5 text-neutral-400" />}
                  <div>
                    <p className="text-sm font-bold text-neutral-800 dark:text-white">
                      {user?.profile?.privacyVisible !== false ? 'Visible to Hospitals' : 'Hidden from Broadcasts'}
                    </p>
                    <p className="text-xs text-neutral-400">Hospitals cannot see your contact details until you accept.</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
                Your phone number and email are <strong className="text-neutral-600 dark:text-neutral-300">never shared</strong> with any hospital unless you explicitly click "Accept" on an emergency request.
              </p>
            </div>

            {/* AI Assistant */}
            <div className="glass p-8 rounded-[2.5rem] flex-1">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 font-header">AI Health Assistant</h2>
              <div className="bg-neutral-900 dark:bg-[#141414] rounded-3xl p-6 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-crimson-600/20 blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <p className="text-sm font-medium mb-6 relative z-10">
                  Have questions about donation eligibility or post-donation care? Our AI is here 24/7.
                </p>
                <Link to="/donor/ai-assistant" className="btn-primary inline-flex items-center gap-2 relative z-10 text-sm py-3 px-5">
                  Start Consultation <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ req, accepted, status, onAccept, eligible, healthOk }) {
  const urgencyColors = {
    critical: 'bg-red-600 text-white',
    high: 'bg-crimson-50 text-crimson-600',
    normal: 'bg-neutral-100 text-neutral-600',
  };

  if (accepted && status?.donationToken) {
    return (
      <div className="p-5 rounded-2xl bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800/30">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-bold text-green-700 dark:text-green-400">Accepted — {status.hospital}</span>
        </div>
        <p className="text-xs text-green-600 dark:text-green-500">Your donation token:</p>
        <div className="mt-1 inline-block bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-lg font-mono font-black text-green-700 dark:text-green-400 text-lg tracking-widest">
          {status.donationToken}
        </div>
        <p className="text-xs text-green-600 dark:text-green-400 mt-2">Show this token at the hospital reception desk.</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#141414] border border-neutral-100 dark:border-[#2a2a2a] hover:border-crimson-100 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${urgencyColors[req.urgencyLevel] || urgencyColors.normal}`}>
            {req.bloodType}
          </div>
          <div>
            <p className="font-bold text-neutral-900 dark:text-white text-sm">{req.hospitalName}</p>
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest">{req.urgencyLevel} urgency · {req.unitsNeeded} units</p>
          </div>
        </div>
        <button
          onClick={onAccept}
          disabled={!eligible || !healthOk || status?.loading}
          title={!eligible ? 'You are not currently eligible to donate' : !healthOk ? 'Complete health declaration first' : ''}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            !eligible || !healthOk
              ? 'bg-neutral-100 dark:bg-[#2a2a2a] text-neutral-400 cursor-not-allowed'
              : 'bg-crimson-600 text-white hover:bg-crimson-700 active:scale-95'
          }`}
        >
          {status?.loading ? '...' : 'Accept'}
        </button>
      </div>
      {status?.error && <p className="text-xs text-red-500 mt-1">{status.error}</p>}
    </div>
  );
}
