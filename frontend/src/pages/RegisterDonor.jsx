import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, MapPin, Droplet, ArrowRight, Heart, ChevronDown, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { fetchAPI } from '../utils/apiClient';

// NBTC self-declaration checklist items
const HEALTH_CHECKLIST = [
  "I have not had a tattoo or piercing in the last 6 months.",
  "I do not have any active infections, fever, or cold right now.",
  "I have not taken antibiotics or steroids in the last 72 hours.",
  "I have not donated blood in the last 90 days (male) / 120 days (female).",
  "I do not have a history of HIV, Hepatitis B, or Hepatitis C.",
  "I weigh at least 45 kg and am in good general health today.",
  "I have not consumed alcohol in the last 24 hours.",
];

export default function RegisterDonor() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    bloodType: 'A+',
    age: '',
    gender: '',
    city: '',
    zipCode: '',
    privacyVisible: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [checkedItems, setCheckedItems] = useState(Array(HEALTH_CHECKLIST.length).fill(false));
  const [step, setStep] = useState(1); // 1 = form, 2 = health checklist

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const allChecked = checkedItems.every(Boolean);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setError('');
    const age = parseInt(formData.age);
    if (!age || age < 18 || age > 65) {
      setError('Age must be between 18 and 65 years (NBTC guidelines).');
      return;
    }
    if (!formData.gender) {
      setError('Please select your gender.');
      return;
    }
    setShowHealthModal(true);
  };

  const handleFinalSubmit = async () => {
    if (!allChecked) return;
    setLoading(true);
    setShowHealthModal(false);
    try {
      const res = await fetchAPI('/api/auth/register/donor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, age: parseInt(formData.age) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      login(data.user, data.token);
      navigate('/dashboard/donor');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-neutral-50/50 dark:bg-[#0a0a0a]">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-crimson-100/50 rounded-full blur-[100px] animate-float dark:hidden" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-crimson-50/50 rounded-full blur-[100px] animate-float dark:hidden" style={{ animationDelay: '2s' }} />

      <div className="relative w-full max-w-xl glass p-10 rounded-[2.5rem] animate-fade-in-up mt-20 mb-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-crimson-50 rounded-2xl mb-6 animate-pulse-slow">
            <Heart className="w-8 h-8 text-crimson-600 fill-crimson-600" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white tracking-tight mb-2 font-header">Become a Donor</h1>
          <p className="text-neutral-500 font-medium font-sans">Join thousands of others saving lives across India.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50/80 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-3 animate-fade-in-up">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2 group">
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
              <User className="w-4 h-4 text-neutral-400 group-focus-within:text-crimson-500 transition-colors" />
              Full Name
            </label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange}
              className="input-field" placeholder="Arjun Sharma" />
          </div>

          {/* Age + Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 group">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                <span className="text-neutral-400 text-xs font-bold">AGE</span>
                <span className="text-[10px] text-neutral-400 font-medium">(18–65)</span>
              </label>
              <input type="number" name="age" required min="18" max="65"
                value={formData.age} onChange={handleChange}
                className="input-field" placeholder="25" />
            </div>
            <div className="space-y-2 group">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                <ChevronDown className="w-4 h-4 text-neutral-400" /> Gender
              </label>
              <select name="gender" required value={formData.gender} onChange={handleChange}
                className="input-field appearance-none">
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Blood Type */}
          <div className="space-y-2 group">
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
              <Droplet className="w-4 h-4 text-neutral-400 group-focus-within:text-crimson-500 transition-colors" />
              Blood Group
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                <button key={type} type="button" onClick={() => setFormData({ ...formData, bloodType: type })}
                  className={`h-11 rounded-xl text-sm font-black border-2 transition-all ${
                    formData.bloodType === type
                      ? 'bg-crimson-600 text-white border-crimson-700 scale-105 shadow-lg shadow-crimson-200 dark:shadow-none'
                      : 'bg-white dark:bg-[#141414] text-neutral-600 dark:text-neutral-300 border-neutral-100 dark:border-[#2a2a2a] hover:border-crimson-200'
                  }`}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* City + Zip */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 group">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                <MapPin className="w-4 h-4 text-neutral-400 group-focus-within:text-crimson-500 transition-colors" /> City
              </label>
              <input type="text" name="city" value={formData.city} onChange={handleChange}
                className="input-field" placeholder="Mumbai" />
            </div>
            <div className="space-y-2 group">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                <MapPin className="w-4 h-4 text-neutral-400 group-focus-within:text-crimson-500 transition-colors" /> PIN Code
              </label>
              <input type="text" name="zipCode" required value={formData.zipCode} onChange={handleChange}
                className="input-field" placeholder="400001" />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2 group">
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
              <Mail className="w-4 h-4 text-neutral-400 group-focus-within:text-crimson-500 transition-colors" /> Email Address
            </label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange}
              className="input-field" placeholder="arjun@example.com" />
          </div>

          {/* Password */}
          <div className="space-y-2 group">
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
              <Lock className="w-4 h-4 text-neutral-400 group-focus-within:text-crimson-500 transition-colors" /> Password
            </label>
            <input type="password" name="password" required minLength="6" value={formData.password} onChange={handleChange}
              className="input-field" placeholder="••••••••" />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-[#141414] rounded-2xl border border-neutral-100 dark:border-[#2a2a2a]">
            <div className="flex items-center gap-3">
              {formData.privacyVisible ? <Eye className="w-5 h-5 text-crimson-600" /> : <EyeOff className="w-5 h-5 text-neutral-400" />}
              <div>
                <p className="text-sm font-bold text-neutral-800 dark:text-white">Visible to Emergency Requests</p>
                <p className="text-xs text-neutral-400">Hospitals can notify you for urgent needs</p>
              </div>
            </div>
            <button type="button" onClick={() => setFormData({ ...formData, privacyVisible: !formData.privacyVisible })}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${formData.privacyVisible ? 'bg-crimson-600' : 'bg-neutral-300 dark:bg-[#2a2a2a]'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${formData.privacyVisible ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full group overflow-hidden">
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Account...</>
              ) : (
                <>Continue to Health Declaration <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-[#2a2a2a] text-center">
          <p className="text-sm text-neutral-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-crimson-600 font-bold hover:text-crimson-700 hover:underline transition-all">Log in here</Link>
          </p>
        </div>
      </div>

      {/* NBTC Health Checklist Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-neutral-900/60 backdrop-blur-md animate-fade-in">
          <div className="relative bg-white dark:bg-[#141414] rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-neutral-100 dark:border-[#2a2a2a] overflow-hidden animate-fade-in-up">
            {/* Modal Header */}
            <div className="p-8 bg-neutral-900 dark:bg-[#0a0a0a] text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-crimson-500" />
                  <span className="text-[10px] font-black tracking-widest uppercase text-crimson-500">NBTC Self-Declaration</span>
                </div>
                <button onClick={() => setShowHealthModal(false)} className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-2xl font-black font-header">Health Eligibility Check</h3>
              <p className="text-neutral-400 text-sm mt-1">Please confirm all items are true before proceeding.</p>
            </div>

            <div className="p-8 space-y-4 max-h-[50vh] overflow-y-auto">
              {HEALTH_CHECKLIST.map((item, i) => (
                <label key={i} className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${checkedItems[i] ? 'border-crimson-200 bg-crimson-50/50 dark:bg-crimson-900/10 dark:border-crimson-800' : 'border-neutral-100 dark:border-[#2a2a2a] hover:border-neutral-200 dark:hover:border-[#3a3a3a]'}`}>
                  <input type="checkbox" checked={checkedItems[i]}
                    onChange={() => setCheckedItems(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}
                    className="mt-0.5 w-4 h-4 accent-crimson-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 leading-relaxed">{item}</span>
                </label>
              ))}
            </div>

            <div className="p-8 pt-0">
              <button onClick={handleFinalSubmit} disabled={!allChecked}
                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all ${allChecked ? 'btn-primary' : 'bg-neutral-100 dark:bg-[#2a2a2a] text-neutral-400 cursor-not-allowed'}`}>
                {allChecked ? '✓ I Confirm — Create My Account' : `Confirm all ${HEALTH_CHECKLIST.length} items to continue`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
