import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { PlusCircle, ArrowRight, Activity, Database, CheckCircle, Clock, User, Package, Inbox, AlertCircle, ArrowUpDown, Droplets } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchAPI } from '../utils/apiClient';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function HospitalDashboard() {
  const { user, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('inventory');
  const [myRequests, setMyRequests] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingIncoming, setLoadingIncoming] = useState(false);

  const inventory = user?.profile?.inventory || {};
  const inventoryTotal = Object.values(inventory).reduce((a, b) => a + b, 0);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetchAPI('/api/requests/hospital', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMyRequests(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoadingRequests(false); }
  };

  const fetchIncoming = async () => {
    setLoadingIncoming(true);
    try {
      const res = await fetchAPI('/api/requests/incoming', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setIncoming(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoadingIncoming(false); }
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'requests') fetchRequests();
      if (activeTab === 'incoming') fetchIncoming();
    }
  }, [activeTab, token]);

  const tabs = [
    { id: 'inventory', label: 'Inventory', icon: Database },
    { id: 'requests', label: 'Active Requests', icon: Activity },
    { id: 'incoming', label: 'Incoming Offers', icon: Inbox },
  ];

  return (
    <div className="relative min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] pt-32 pb-20 px-6 overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-crimson-100/30 rounded-full blur-[100px] animate-float dark:hidden" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[100px] animate-float dark:hidden" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-6xl mx-auto z-10">
        <header className="mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-[#141414] text-white text-[10px] font-bold px-3 py-1 rounded-full mb-6 tracking-widest uppercase shadow-lg">
            <Activity className="w-3 h-3 text-crimson-500" /> Hospital Operations
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-neutral-900 dark:text-white tracking-tightest mb-3 font-header">
                Welcome, <span className="text-gradient">{user?.profile?.hospitalName || 'Partner'}</span>
              </h1>
              <p className="text-lg text-neutral-500 font-medium">Manage your blood supplies and coordinate transfers in real-time.</p>
            </div>
            {/* Quick stats */}
            <div className="flex gap-4">
              <div className="glass px-6 py-4 rounded-2xl text-center">
                <p className="text-2xl font-black font-header text-crimson-600">{inventoryTotal}</p>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Total Units</p>
              </div>
              <div className="glass px-6 py-4 rounded-2xl text-center">
                <p className="text-2xl font-black font-header text-neutral-900 dark:text-white">{myRequests.length || '—'}</p>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Active Req.</p>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 p-1.5 bg-white dark:bg-[#141414] rounded-2xl border border-neutral-100 dark:border-[#2a2a2a] w-fit animate-fade-in-up">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-neutral-900 dark:bg-crimson-600 text-white shadow-md'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab: Inventory ── */}
        {activeTab === 'inventory' && (
          <div className="animate-fade-in-up">
            <div className="glass rounded-[2.5rem] p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white font-header flex items-center gap-3">
                  <Database className="w-6 h-6 text-crimson-600" /> Blood Inventory
                </h2>
                <Link to="/hospital/inventory" className="text-sm font-bold text-crimson-600 hover:underline flex items-center gap-1">
                  Manage Stock <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {BLOOD_TYPES.map(type => {
                  const units = inventory[type] || 0;
                  const level = units === 0 ? 'critical' : units < 5 ? 'low' : 'ok';
                  return (
                    <div key={type} className={`p-5 rounded-2xl border-2 text-center transition-all ${
                      level === 'critical' ? 'border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800/30'
                      : level === 'low' ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800/30'
                      : 'border-neutral-100 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]'
                    }`}>
                      <div className={`text-2xl font-black font-header mb-1 ${
                        level === 'critical' ? 'text-red-600' : level === 'low' ? 'text-amber-600' : 'text-neutral-900 dark:text-white'
                      }`}>{type}</div>
                      <div className="text-3xl font-black text-neutral-900 dark:text-white">{units}</div>
                      <div className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${
                        level === 'critical' ? 'text-red-500' : level === 'low' ? 'text-amber-500' : 'text-neutral-400'
                      }`}>{level === 'critical' ? 'OUT OF STOCK' : level === 'low' ? 'LOW STOCK' : 'units'}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 flex gap-4">
                <Link to="/hospital/inventory" className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-sm">
                  <Package className="w-4 h-4" /> Update Inventory
                </Link>
                <Link to="/hospital/transfer" className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border-2 border-neutral-200 dark:border-[#2a2a2a] text-neutral-700 dark:text-neutral-300 hover:border-crimson-200 transition-all">
                  <ArrowUpDown className="w-4 h-4" /> B2B Transfer
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Active Requests ── */}
        {activeTab === 'requests' && (
          <div className="animate-fade-in-up">
            <div className="glass rounded-[2.5rem] overflow-hidden">
              <div className="p-10 border-b border-neutral-100 dark:border-[#2a2a2a] flex items-center justify-between bg-white/50 dark:bg-transparent">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white font-header flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-crimson-600" /> Active Broadcasts
                </h2>
                <Link to="/hospital/requests" className="btn-primary flex items-center gap-2 px-5 py-3 rounded-xl text-sm">
                  <PlusCircle className="w-4 h-4" /> New Request
                </Link>
              </div>
              <div className="p-8">
                {loadingRequests ? (
                  <div className="p-12 text-center text-neutral-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Loading...</div>
                ) : myRequests.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-neutral-100 dark:border-[#2a2a2a] rounded-3xl">
                    <p className="text-neutral-400 font-bold">No active requests. Your inventory levels are stable.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myRequests.map(req => (
                      <div key={req._id} className="flex items-center justify-between p-6 bg-white dark:bg-[#141414] rounded-2xl border border-neutral-100 dark:border-[#2a2a2a]">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${req.urgencyLevel === 'critical' ? 'bg-red-600 text-white' : 'bg-crimson-50 text-crimson-600'}`}>
                            <Droplets className="w-4 h-4 mb-0.5" />
                            <span className="text-sm font-header">{req.bloodType}</span>
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 dark:text-white">{req.unitsNeeded} units needed</p>
                            <p className="text-[10px] text-neutral-400 uppercase tracking-widest">{req.urgencyLevel} priority · {new Date(req.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Donors Accepted</p>
                          <p className="text-xl font-black text-crimson-600 font-header">{req.acceptedDonors?.length || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Incoming Offers ── */}
        {activeTab === 'incoming' && (
          <div className="animate-fade-in-up">
            <div className="glass rounded-[2.5rem] overflow-hidden">
              <div className="p-10 border-b border-neutral-100 dark:border-[#2a2a2a] bg-white/50 dark:bg-transparent">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white font-header flex items-center gap-3">
                  <Inbox className="w-6 h-6 text-crimson-600" /> Donor Offers Received
                </h2>
                <p className="text-neutral-400 text-sm mt-1">Donors who have accepted your emergency requests. Contact them or scan their token at reception.</p>
              </div>
              <div className="p-8">
                {loadingIncoming ? (
                  <div className="p-12 text-center text-neutral-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Loading...</div>
                ) : incoming.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-neutral-100 dark:border-[#2a2a2a] rounded-3xl">
                    <p className="text-neutral-400 font-bold">No incoming offers yet.</p>
                    <p className="text-sm text-neutral-300 mt-2">Donors will appear here once they accept an emergency request.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {incoming.map(req => (
                      <div key={req._id}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-crimson-50 text-crimson-600 flex items-center justify-center font-black text-sm">{req.bloodType}</div>
                          <div>
                            <p className="font-bold text-neutral-800 dark:text-white text-sm">{req.bloodType} · {req.unitsNeeded} units needed</p>
                            <p className="text-[10px] text-neutral-400 uppercase tracking-widest">{req.acceptedDonors?.length} donor{req.acceptedDonors?.length !== 1 ? 's' : ''} accepted</p>
                          </div>
                        </div>
                        <div className="space-y-2 pl-2">
                          {req.acceptedDonors?.map(donor => (
                            <div key={donor._id} className="flex items-center justify-between p-4 bg-white dark:bg-[#141414] rounded-xl border border-neutral-100 dark:border-[#2a2a2a]">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-neutral-50 dark:bg-[#0a0a0a] flex items-center justify-center text-neutral-400">
                                  <User className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-bold text-neutral-900 dark:text-white text-sm">{donor.donorName}</p>
                                  <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {new Date(donor.acceptedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-1">Token</p>
                                <code className="bg-crimson-50 dark:bg-crimson-900/20 text-crimson-700 dark:text-crimson-400 px-2 py-1 rounded-lg font-mono font-black text-sm tracking-widest">
                                  {donor.donationToken}
                                </code>
                                <p className={`text-[9px] uppercase tracking-widest font-bold mt-1 ${donor.donationStatus === 'donated' ? 'text-green-600' : 'text-amber-500'}`}>
                                  {donor.donationStatus}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
