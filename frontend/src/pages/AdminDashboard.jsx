import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
  ShieldCheck, Clock, XCircle, CheckCircle, Users, Building2,
  ExternalLink, RefreshCw, Activity, LogOut, ChevronDown, ChevronUp,
  FileText, IdCard, MapPin, Phone, Mail, AlertTriangle
} from 'lucide-react';
import { fetchAPI } from '../utils/apiClient';

const STATUS_COLORS = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30',
  approved: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30',
  rejected: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30',
};

export default function AdminDashboard() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats]         = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [donors, setDonors]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [expandedId, setExpandedId]       = useState(null);
  const [rejectReason, setRejectReason]   = useState({});
  const [toast, setToast] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStats = async () => {
    try {
      const res = await fetchAPI('/api/admin/stats', { headers });
      setStats(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchHospitals = async (filter = 'pending') => {
    setLoading(true);
    try {
      const endpoint = filter === 'all' ? '/api/admin/hospitals/all' : '/api/admin/hospitals/pending';
      const res = await fetchAPI(endpoint, { headers });
      setHospitals(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/api/admin/donors', { headers });
      setDonors(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchStats();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'pending') fetchHospitals('pending');
    else if (activeTab === 'all')     fetchHospitals('all');
    else if (activeTab === 'donors')  fetchDonors();
  }, [activeTab]);

  const handleApprove = async (id) => {
    setActionLoading(p => ({ ...p, [id]: 'approving' }));
    try {
      const res = await fetchAPI(`/api/admin/hospitals/${id}/approve`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Failed');
      setHospitals(prev => prev.map(h => h._id === id
        ? { ...h, hospitalProfile: { ...h.hospitalProfile, verificationStatus: 'approved' } } : h));
      showToast('Hospital approved! They can now log in.', 'success');
      fetchStats();
    } catch {
      showToast('Approval failed. Try again.', 'error');
    } finally {
      setActionLoading(p => ({ ...p, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    setActionLoading(p => ({ ...p, [id]: 'rejecting' }));
    try {
      const res = await fetchAPI(`/api/admin/hospitals/${id}/reject`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason[id] || '' })
      });
      if (!res.ok) throw new Error('Failed');
      setHospitals(prev => prev.map(h => h._id === id
        ? { ...h, hospitalProfile: { ...h.hospitalProfile, verificationStatus: 'rejected' } } : h));
      showToast('Hospital rejected.', 'error');
      fetchStats();
    } catch {
      showToast('Rejection failed. Try again.', 'error');
    } finally {
      setActionLoading(p => ({ ...p, [id]: null }));
    }
  };

  const handleVerifyDonor = async (id) => {
    setActionLoading(p => ({ ...p, [id]: 'verifying' }));
    try {
      const res = await fetchAPI(`/api/admin/donors/${id}/verify`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Failed');
      setDonors(prev => prev.map(d => d._id === id
        ? { ...d, donorProfile: { ...d.donorProfile, isEligible: true, healthCheckCompleted: true } } : d));
      showToast('Donor health verified and marked as eligible!', 'success');
    } catch {
      showToast('Verification failed. Try again.', 'error');
    } finally {
      setActionLoading(p => ({ ...p, [id]: null }));
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending',       icon: Clock,     count: stats?.pendingHospitals },
    { id: 'all',     label: 'All Hospitals',  icon: Building2, count: stats?.approvedHospitals },
    { id: 'donors',  label: 'Donors',         icon: Users,     count: stats?.totalDonors },
  ];

  return (
    <div className="relative min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] pt-24 pb-20 px-6 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[35%] h-[35%] bg-amber-100/30 rounded-full blur-[100px] animate-float dark:hidden" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[35%] h-[35%] bg-crimson-50/20 rounded-full blur-[100px] animate-float dark:hidden" />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-sm font-bold animate-fade-in-up border ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30'
            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="relative max-w-6xl mx-auto z-10">
        {/* Header */}
        <header className="flex items-start justify-between mb-10 animate-fade-in-up">
          <div>
            <div className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-[#141414] text-white text-[10px] font-bold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
              <ShieldCheck className="w-3 h-3 text-amber-400" /> System Administrator
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white font-header mb-2">
              Admin <span className="text-gradient">Control Panel</span>
            </h1>
            <p className="text-neutral-500 font-medium">Verify hospitals, monitor donors, and manage system health.</p>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-[#2a2a2a] text-neutral-600 dark:text-neutral-400 font-bold text-sm hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-fade-in-up">
          {[
            { label: 'Total Donors',      value: stats?.totalDonors ?? '—',      icon: Users,      color: 'text-crimson-600' },
            { label: 'Pending Review',    value: stats?.pendingHospitals ?? '—', icon: Clock,      color: 'text-amber-600' },
            { label: 'Approved Hospitals',value: stats?.approvedHospitals ?? '—',icon: CheckCircle,color: 'text-green-600' },
            { label: 'Rejected',          value: stats?.rejectedHospitals ?? '—',icon: XCircle,    color: 'text-red-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass p-6 rounded-[2rem]">
              <Icon className={`w-5 h-5 ${color} mb-3`} />
              <p className={`text-3xl font-black font-header ${color} mb-1`}>{value}</p>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1.5 bg-white dark:bg-[#141414] rounded-2xl border border-neutral-100 dark:border-[#2a2a2a] w-fit animate-fade-in-up">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-neutral-900 dark:bg-amber-600 text-white shadow'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-neutral-100 dark:bg-[#2a2a2a] text-neutral-500'
                  }`}>{tab.count}</span>
                )}
              </button>
            );
          })}
          <button onClick={() => { fetchStats(); if (activeTab === 'pending' || activeTab === 'all') fetchHospitals(activeTab); else fetchDonors(); }}
            className="ml-2 p-2.5 rounded-xl text-neutral-400 hover:text-crimson-600 hover:bg-crimson-50 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* ── Pending / All Hospitals Tab ── */}
        {(activeTab === 'pending' || activeTab === 'all') && (
          <div className="space-y-4 animate-fade-in-up">
            {loading ? (
              <div className="glass p-16 rounded-[2.5rem] text-center">
                <RefreshCw className="w-8 h-8 text-neutral-300 mx-auto animate-spin mb-4" />
                <p className="text-neutral-400 font-bold">Loading hospitals...</p>
              </div>
            ) : hospitals.length === 0 ? (
              <div className="glass p-16 rounded-[2.5rem] text-center border-2 border-dashed border-neutral-100 dark:border-[#2a2a2a]">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-4" />
                <p className="font-bold text-neutral-500">
                  {activeTab === 'pending' ? 'No hospitals pending review. All clear!' : 'No hospitals registered yet.'}
                </p>
              </div>
            ) : hospitals.map(h => {
              const p = h.hospitalProfile;
              const status = p?.verificationStatus || 'pending';
              const isExpanded = expandedId === h._id;
              const busy = actionLoading[h._id];

              return (
                <div key={h._id} className={`glass rounded-[2rem] overflow-hidden transition-all ${
                  status === 'pending' ? 'border-amber-200 dark:border-amber-800/30' : ''
                }`}>
                  {/* Card Header */}
                  <div className="p-6 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : h._id)}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-neutral-500" />
                      </div>
                      <div>
                        <p className="font-black text-neutral-900 dark:text-white text-lg">{p?.hospitalName}</p>
                        <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {h.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${STATUS_COLORS[status]}`}>
                        {status}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-neutral-100 dark:border-[#2a2a2a] pt-6 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* License info */}
                        <div className="space-y-3">
                          <InfoRow icon={FileText} label="CDSCO License No." value={p?.cdscoBankLicenseNumber || 'Not provided'} />
                          <InfoRow icon={IdCard}   label="e-RaktKosh ID"     value={p?.eRaktKoshId || 'Not provided'} />
                          <InfoRow icon={MapPin}   label="Address"           value={`${p?.address || ''}${p?.city ? `, ${p.city}` : ''}${p?.zipCode ? ` - ${p.zipCode}` : ''}`} />
                          <InfoRow icon={Phone}    label="Contact"           value={p?.contactNumber || '—'} />
                          <InfoRow icon={Activity} label="Registered On"     value={new Date(h.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
                        </div>

                        {/* Verify links */}
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Verify on Government Portals</p>
                          <a href={`https://cdsco.gov.in/opencms/opencms/en/Blood-Bank/State-wise-Blood-Bank-License-Details/`}
                            target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 p-4 rounded-2xl border border-neutral-200 dark:border-[#2a2a2a] hover:border-amber-300 hover:bg-amber-50 dark:hover:border-amber-700 dark:hover:bg-amber-900/10 transition-all group">
                            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                              <FileText className="w-4 h-4 text-neutral-500 group-hover:text-amber-600 transition-colors" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Verify CDSCO License</p>
                              <p className="text-[10px] text-neutral-400">cdsco.gov.in</p>
                            </div>
                            <ExternalLink className="w-3 h-3 text-neutral-400 ml-auto" />
                          </a>
                          <a href="https://eraktkosh.in/BLDAHIMS/bloodbank/transactions/hbntransaction.cnt?methodCall=showNearestBloodBank"
                            target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 p-4 rounded-2xl border border-neutral-200 dark:border-[#2a2a2a] hover:border-amber-300 hover:bg-amber-50 dark:hover:border-amber-700 dark:hover:bg-amber-900/10 transition-all group">
                            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                              <IdCard className="w-4 h-4 text-neutral-500 group-hover:text-amber-600 transition-colors" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Verify e-RaktKosh ID</p>
                              <p className="text-[10px] text-neutral-400">eraktkosh.in</p>
                            </div>
                            <ExternalLink className="w-3 h-3 text-neutral-400 ml-auto" />
                          </a>
                        </div>
                      </div>

                      {/* Action buttons — only show if pending */}
                      {status === 'pending' && (
                        <div className="pt-4 border-t border-neutral-100 dark:border-[#2a2a2a] space-y-3">
                          <div className="flex gap-3">
                            <button onClick={() => handleApprove(h._id)} disabled={!!busy}
                              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60">
                              {busy === 'approving' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              {busy === 'approving' ? 'Approving...' : '✓ Approve Hospital'}
                            </button>
                            <button onClick={() => handleReject(h._id)} disabled={!!busy}
                              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-600 hover:text-white active:scale-95 transition-all border border-red-200 dark:border-red-800/30 disabled:opacity-60">
                              {busy === 'rejecting' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              {busy === 'rejecting' ? 'Rejecting...' : '✗ Reject'}
                            </button>
                          </div>
                          <input
                            value={rejectReason[h._id] || ''}
                            onChange={e => setRejectReason(p => ({ ...p, [h._id]: e.target.value }))}
                            placeholder="Rejection reason (optional)..."
                            className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#2a2a2a] text-sm text-neutral-700 dark:text-neutral-300 outline-none focus:border-red-300 transition-all"
                          />
                        </div>
                      )}

                      {status !== 'pending' && (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 ${STATUS_COLORS[status]} border`}>
                          {status === 'approved'
                            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                          <p className="text-sm font-bold">
                            {status === 'approved' ? 'This hospital is approved and active on the platform.' : 'This hospital has been rejected.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Donors Tab ── */}
        {activeTab === 'donors' && (
          <div className="glass rounded-[2.5rem] overflow-hidden animate-fade-in-up">
            <div className="p-8 border-b border-neutral-100 dark:border-[#2a2a2a]">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white font-header flex items-center gap-2">
                <Users className="w-5 h-5 text-crimson-600" /> Registered Donors
              </h2>
            </div>
            {loading ? (
              <div className="p-12 text-center text-neutral-400 animate-pulse font-bold text-[10px] uppercase tracking-widest">Loading...</div>
            ) : donors.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 font-bold">No donors registered yet.</div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-[#2a2a2a]">
                {donors.map(d => {
                  const p = d.donorProfile;
                  return (
                    <div key={d._id} className="flex items-center justify-between px-8 py-5 hover:bg-neutral-50 dark:hover:bg-[#141414] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-crimson-50 dark:bg-crimson-900/20 flex items-center justify-center font-black text-crimson-600 text-sm">
                          {p?.bloodType || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 dark:text-white text-sm">{p?.name || '—'}</p>
                          <p className="text-[10px] text-neutral-400">{d.email} · {p?.city || 'No city'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${p?.isEligible ? 'bg-green-50 text-green-600 border-green-200' : 'bg-neutral-50 text-neutral-400 border-neutral-200 dark:bg-[#1a1a1a] dark:border-[#2a2a2a]'}`}>
                            {p?.isEligible ? 'Eligible' : 'Not Eligible'}
                          </p>
                        </div>
                        <div>
                          <p className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${p?.healthCheckCompleted ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-neutral-50 text-neutral-400 border-neutral-200 dark:bg-[#1a1a1a] dark:border-[#2a2a2a]'}`}>
                            {p?.healthCheckCompleted ? 'Declared' : 'Pending Declaration'}
                          </p>
                        </div>
                        <p className="text-[10px] text-neutral-400 min-w-[70px] text-right">{new Date(d.createdAt).toLocaleDateString('en-IN')}</p>
                        
                        {!p?.healthCheckCompleted && (
                          <button 
                            onClick={() => handleVerifyDonor(d._id)}
                            disabled={actionLoading[d._id] === 'verifying'}
                            className="ml-2 flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                          >
                            {actionLoading[d._id] === 'verifying' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{label}</p>
        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{value}</p>
      </div>
    </div>
  );
}
