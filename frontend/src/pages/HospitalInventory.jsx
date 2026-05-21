import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Save, RefreshCw, TrendingUp, Package, Database, AlertTriangle, ArrowRight, Droplets } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { fetchAPI } from '../utils/apiClient';

export default function HospitalInventory() {
  const { user, token } = useAuthStore();
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editInventory, setEditInventory] = useState(null);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI('/api/hospitals/inventory', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setInventory(data);
      setEditInventory(data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchInventory();
  }, [token]);

  const handleUpdateStock = async () => {
    try {
      setUpdating(true);
      const res = await fetchAPI('/api/hospitals/inventory', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ inventory: editInventory })
      });
      if (res.ok) {
        setInventory(editInventory);
      }
    } catch (err) {
      console.error('Error updating stock:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-crimson-50 rounded-2xl flex items-center justify-center animate-pulse-slow">
             <RefreshCw className="w-8 h-8 text-crimson-600 animate-spin" />
          </div>
          <span className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Syncing Inventory...</span>
        </div>
      </div>
    );
  }

  const chartData = bloodTypes.map(type => ({
    name: type,
    units: inventory?.[type] || 0
  }));

  return (
    <div className="relative min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] pt-32 pb-20 px-6 overflow-hidden">
      {/* Aesthetic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-crimson-100/30 rounded-full blur-[100px] animate-float dark:hidden" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[100px] animate-float dark:hidden" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-7xl mx-auto z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 animate-fade-in-up">
          <div>
            <div className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-[#141414] text-white text-[10px] font-bold px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
              <Database className="w-3 h-3 text-crimson-500" />
              Stock Management
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-neutral-900 dark:text-white tracking-tightest mb-4 font-header">Manage Inventory</h1>
            <p className="text-xl text-neutral-500 max-w-2xl font-medium">Real-time tracking of blood supplies and automated threshold alerts.</p>
          </div>
          <button onClick={fetchInventory} className="w-14 h-14 rounded-2xl bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#333] text-neutral-600 hover:text-crimson-600 transition-all shadow-sm dark:shadow-none flex items-center justify-center group active:scale-95">
            <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Main Chart Section */}
          <div className="lg:col-span-2 glass p-10 rounded-[2.5rem]">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white font-header flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-crimson-600" />
                Supply Analytics
              </h2>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-crimson-500" />
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Low</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Stable</span>
                 </div>
              </div>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }} dy={15} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(241, 11, 44, 0.05)' }} 
                    contentStyle={{ 
                      borderRadius: '24px', 
                      border: 'none', 
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
                      padding: '20px',
                      backgroundColor: 'white'
                    }} 
                  />
                  <Bar dataKey="units" radius={[12, 12, 0, 0]} barSize={45}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.units < 10 ? '#e11d48' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Update List Section */}
          <div className="glass p-10 rounded-[2.5rem] flex flex-col h-fit sticky top-32">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white font-header">Quick Sync</h2>
              <button 
                onClick={handleUpdateStock} 
                disabled={updating} 
                className="btn-primary py-2 px-6 text-xs flex items-center gap-2 group"
              >
                <Save className="w-4 h-4" />
                {updating ? 'Saving...' : 'Sync All'}
              </button>
            </div>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {bloodTypes.map(type => (
                <div key={type} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50/50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-[#2a2a2a]/50 group hover:border-neutral-900 dark:hover:border-white dark:bg-[#141414] hover:border-crimson-100 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-sm dark:shadow-none transition-all duration-300 ${
                      (editInventory?.[type] || 0) < 10 
                        ? 'bg-crimson-100 text-crimson-600 ring-4 ring-crimson-50' 
                        : 'bg-white dark:bg-[#141414] text-neutral-400 border border-neutral-100 dark:border-[#2a2a2a] group-hover:bg-blue-50 group-hover:text-blue-600'
                    }`}>
                      {type}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">Units</p>
                        <p className={`text-xs font-bold ${ (editInventory?.[type] || 0) < 10 ? 'text-crimson-600' : 'text-neutral-900 dark:text-white opacity-0 group-hover:opacity-100'}`}>
                           {(editInventory?.[type] || 0) < 10 ? 'Low Stock' : 'Ready'}
                        </p>
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={editInventory?.[type] || 0} 
                      onChange={(e) => setEditInventory({...editInventory, [type]: parseInt(e.target.value) || 0})} 
                      className="w-16 h-12 bg-white dark:bg-[#141414] rounded-xl border border-neutral-100 dark:border-[#2a2a2a] text-center text-sm font-black outline-none focus:border-crimson-500 focus:ring-4 focus:ring-crimson-500/10 transition-all" 
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-10 pt-8 border-t border-neutral-100 dark:border-[#2a2a2a]">
               <div className="flex items-center gap-3 text-crimson-600 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-bold font-header">Inventory Alert</span>
               </div>
               <p className="text-xs font-medium text-neutral-400 leading-relaxed">
                  System will automatically notify nearby donors when stock falls below 10 units.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
