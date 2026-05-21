import { useState, useEffect } from 'react';
import { ArrowUpDown, Building2, Droplets, CheckCircle, FileText, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { fetchAPI } from '../utils/apiClient';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function HospitalTransfer() {
  const { user, token } = useAuthStore();
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('O-');
  const [transferUnits, setTransferUnits] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [fulfilling, setFulfilling] = useState(false);
  const [error, setError] = useState('');

  const myHospitalName = user?.profile?.hospitalName || 'Your Hospital';
  const myLicense = user?.profile?.cdscoBankLicenseNumber || 'N/A';

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetchAPI('/api/requests/all', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        // Filter out our own requests
        setAllRequests(Array.isArray(data) ? data.filter(r => r.hospitalId !== user?.id) : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchRequests();
  }, [token]);

  const filteredRequests = allRequests.filter(r => r.bloodType === selectedType);

  const handleFulfill = async () => {
    if (!selectedRequest) return;
    setFulfilling(true);
    setError('');
    try {
      const res = await fetchAPI(`/api/requests/${selectedRequest._id}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transferUnits, type: selectedType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Transfer failed');

      // Generate a Digital Transfer Manifest
      setManifest({
        manifestId: `DNT-${Date.now().toString().slice(-8)}`,
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        fromHospital: myHospitalName,
        fromLicense: myLicense,
        toHospital: selectedRequest.hospitalName,
        bloodType: selectedType,
        units: transferUnits,
        remainingUnits: data.remainingUnitsNeeded
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setFulfilling(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] pt-32 pb-20 px-6 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[100px] animate-float dark:hidden" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-crimson-50/30 rounded-full blur-[100px] animate-float dark:hidden" />

      <div className="relative max-w-5xl mx-auto z-10">
        <header className="mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-[#141414] text-white text-[10px] font-bold px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
            <ArrowUpDown className="w-3 h-3 text-crimson-500" /> Inter-Hospital Transfer
          </div>
          <h1 className="text-5xl font-black text-neutral-900 dark:text-white font-header mb-3">B2B Stock Transfer</h1>
          <p className="text-lg text-neutral-500 font-medium max-w-2xl">
            View active shortage requests from other verified hospitals. Fulfill a request to generate a Digital Transfer Manifest.
          </p>
        </header>

        {/* Manifest Modal */}
        {manifest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-neutral-900/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-[#141414] rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-neutral-100 dark:border-[#2a2a2a] overflow-hidden animate-fade-in-up">
              <div className="p-8 bg-neutral-900 dark:bg-[#0a0a0a] text-white">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-[10px] font-black tracking-widest uppercase text-green-400">Transfer Confirmed</span>
                </div>
                <h3 className="text-3xl font-black font-header">Digital Transfer Manifest</h3>
              </div>
              <div className="p-8 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Manifest ID', manifest.manifestId],
                    ['Timestamp (IST)', manifest.timestamp],
                    ['Blood Type', manifest.bloodType],
                    ['Units Transferred', `${manifest.units} unit${manifest.units !== 1 ? 's' : ''}`],
                  ].map(([label, val]) => (
                    <div key={label} className="p-3 bg-neutral-50 dark:bg-[#0a0a0a] rounded-xl">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
                      <p className="font-bold text-neutral-900 dark:text-white mt-0.5">{val}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-[#0a0a0a] rounded-xl">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">From (Supplying Hospital)</p>
                  <p className="font-bold text-neutral-900 dark:text-white">{manifest.fromHospital}</p>
                  <p className="text-xs text-neutral-400 font-mono">CDSCO: {manifest.fromLicense}</p>
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-[#0a0a0a] rounded-xl">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">To (Receiving Hospital)</p>
                  <p className="font-bold text-neutral-900 dark:text-white">{manifest.toHospital}</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/20 text-xs text-amber-700 dark:text-amber-400">
                  <strong>Next Step:</strong> Send your authorized vehicle to {manifest.toHospital} with this manifest printed/on-screen. Blood must be transported under standard temperature-controlled protocols.
                </div>
              </div>
              <div className="px-8 pb-8 flex gap-3">
                <button onClick={() => window.print()} className="flex-1 py-3 rounded-2xl border-2 border-neutral-200 dark:border-[#2a2a2a] font-bold text-sm text-neutral-700 dark:text-neutral-300 flex items-center justify-center gap-2 hover:bg-neutral-50 dark:hover:bg-[#0a0a0a] transition-all">
                  <FileText className="w-4 h-4" /> Print Manifest
                </button>
                <button onClick={() => { setManifest(null); setSelectedRequest(null); }} className="flex-1 btn-primary py-3 rounded-2xl text-sm">
                  Done <ArrowRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Blood type filter */}
          <div className="glass p-8 rounded-[2.5rem] animate-fade-in-up h-fit">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-header mb-4 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-crimson-600" /> Filter by Type
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {BLOOD_TYPES.map(type => (
                <button key={type} onClick={() => setSelectedType(type)}
                  className={`h-11 rounded-xl font-black text-sm border-2 transition-all ${
                    selectedType === type
                      ? 'bg-crimson-600 text-white border-crimson-700 scale-105'
                      : 'bg-white dark:bg-[#141414] text-neutral-600 dark:text-neutral-300 border-neutral-100 dark:border-[#2a2a2a] hover:border-crimson-200'
                  }`}>
                  {type}
                </button>
              ))}
            </div>

            {selectedRequest && (
              <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-[#2a2a2a]">
                <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3">Fulfill Transfer</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1 block mb-1">Units to Send</label>
                    <input type="number" min="1" value={transferUnits}
                      onChange={e => setTransferUnits(parseInt(e.target.value) || 1)}
                      className="input-field" />
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <button onClick={handleFulfill} disabled={fulfilling}
                    className="btn-primary w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                    {fulfilling ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</> : <><CheckCircle className="w-4 h-4" /> Confirm Transfer</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Requests list */}
          <div className="lg:col-span-2 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-header">
                Hospitals Needing <span className="text-crimson-600">{selectedType}</span>
              </h2>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{filteredRequests.length} requests</span>
            </div>

            {loading ? (
              <div className="glass p-12 rounded-[2.5rem] text-center">
                <div className="w-12 h-12 bg-crimson-50 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
                  <RefreshCw className="w-6 h-6 text-crimson-600 animate-spin" />
                </div>
                <p className="text-neutral-400 font-bold text-sm uppercase tracking-widest">Loading network...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="glass p-12 rounded-[2.5rem] text-center border-2 border-dashed border-neutral-100 dark:border-[#2a2a2a]">
                <AlertCircle className="w-8 h-8 text-neutral-300 mx-auto mb-4" />
                <p className="font-bold text-neutral-400">No hospitals currently need {selectedType}</p>
                <p className="text-sm text-neutral-300 mt-1">Try another blood type or check back later.</p>
              </div>
            ) : (
              filteredRequests.map(req => (
                <div
                  key={req._id}
                  onClick={() => setSelectedRequest(req._id === selectedRequest?._id ? null : req)}
                  className={`glass p-6 rounded-[2rem] cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                    selectedRequest?._id === req._id
                      ? 'border-crimson-300 dark:border-crimson-700 shadow-xl shadow-crimson-100/20 dark:shadow-none'
                      : 'hover:border-crimson-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${req.urgencyLevel === 'critical' ? 'bg-red-600 text-white' : 'bg-crimson-50 text-crimson-600'}`}>
                        <Droplets className="w-4 h-4 mb-0.5" />
                        <span className="text-sm font-header">{req.bloodType}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-neutral-400" />
                          <p className="font-bold text-neutral-900 dark:text-white">{req.hospitalName}</p>
                        </div>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">
                          Needs {req.unitsNeeded} unit{req.unitsNeeded !== 1 ? 's' : ''} · {req.urgencyLevel} priority
                        </p>
                        {req.city && <p className="text-xs text-neutral-400 mt-0.5">{req.city}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                        req.urgencyLevel === 'critical' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}>{req.urgencyLevel}</span>
                      <span className={`text-xs font-bold ${selectedRequest?._id === req._id ? 'text-crimson-600' : 'text-neutral-400'}`}>
                        {selectedRequest?._id === req._id ? '✓ Selected' : 'Click to select'}
                      </span>
                    </div>
                  </div>
                  {req.message && (
                    <p className="mt-4 text-sm text-neutral-500 italic bg-neutral-50 dark:bg-[#0a0a0a] p-3 rounded-xl">"{req.message}"</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
