import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Lock, MapPin, Phone, ArrowRight, Activity, FileText, IdCard, Clock, CheckCircle } from 'lucide-react';
import { fetchAPI } from '../utils/apiClient';

export default function RegisterHospital() {
  const [formData, setFormData] = useState({
    hospitalName: '',
    email: '',
    password: '',
    address: '',
    city: '',
    zipCode: '',
    contactNumber: '',
    cdscoBankLicenseNumber: '',
    eRaktKoshId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingName, setPendingName] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetchAPI('/api/auth/register/hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Hospital is in "pending" state — show confirmation screen
      setPendingName(data.hospitalName || formData.hospitalName);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Pending Confirmation Screen ───────────────────────────────
  if (submitted) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-neutral-50/50 dark:bg-[#0a0a0a]">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100/40 rounded-full blur-[100px] dark:hidden" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-crimson-50/40 rounded-full blur-[100px] dark:hidden" />

        <div className="relative w-full max-w-lg glass p-12 rounded-[2.5rem] animate-fade-in-up text-center">
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
            Pending Verification
          </div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white font-header mb-4">
            Application Submitted!
          </h1>
          <p className="text-neutral-500 font-medium leading-relaxed mb-8">
            Thank you, <strong className="text-neutral-800 dark:text-white">{pendingName}</strong>. 
            Your CDSCO Blood Bank License and e-RaktKosh ID are under review. 
            Our team will verify your credentials within <strong>24–48 hours</strong>.
          </p>
          <div className="space-y-3 text-left mb-10">
            {[
              'License verification against CDSCO portal',
              'e-RaktKosh ID cross-reference',
              'Admin approval & account activation',
              'Email notification with login access',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-[#141414] rounded-2xl">
                <div className="w-6 h-6 rounded-full bg-crimson-600 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">{i + 1}</div>
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{step}</span>
              </div>
            ))}
          </div>
          <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2 py-4 rounded-2xl">
            <CheckCircle className="w-4 h-4" /> Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration Form ─────────────────────────────────────────
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-neutral-50/50 dark:bg-[#0a0a0a]">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-crimson-100/50 rounded-full blur-[100px] animate-float dark:hidden" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[100px] animate-float dark:hidden" style={{ animationDelay: '2s' }} />

      <div className="relative w-full max-w-2xl glass p-10 rounded-[2.5rem] animate-fade-in-up mt-20 mb-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-900 dark:bg-[#141414] rounded-2xl mb-6 animate-pulse-slow">
            <Activity className="w-8 h-8 text-crimson-500" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white tracking-tight mb-2 font-header">Hospital Onboarding</h1>
          <p className="text-neutral-500 font-medium font-sans">Join our verified network of licensed blood banks & hospitals.</p>
        </div>

        {/* Verification notice */}
        <div className="mb-8 p-4 bg-amber-50/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm rounded-xl border border-amber-100 dark:border-amber-800/30 flex items-start gap-3">
          <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>Your account will be <strong>manually reviewed</strong> by our team before activation. Provide accurate license details to speed up approval.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50/80 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-3 animate-fade-in-up">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hospital Name + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 group">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                <Building2 className="w-4 h-4 text-neutral-400 group-focus-within:text-crimson-500 transition-colors" /> Hospital Name
              </label>
              <input type="text" name="hospitalName" required value={formData.hospitalName} onChange={handleChange}
                className="input-field" placeholder="AIIMS Delhi" />
            </div>
            <div className="space-y-2 group">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                <Phone className="w-4 h-4 text-neutral-400 group-focus-within:text-crimson-500 transition-colors" /> Contact Number
              </label>
              <input type="text" name="contactNumber" required value={formData.contactNumber} onChange={handleChange}
                className="input-field" placeholder="+91 98765 43210" />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2 group">
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
              <MapPin className="w-4 h-4 text-neutral-400 group-focus-within:text-crimson-500 transition-colors" /> Street Address
            </label>
            <input type="text" name="address" required value={formData.address} onChange={handleChange}
              className="input-field" placeholder="Ansari Nagar East, New Delhi" />
          </div>

          {/* City + PIN */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 group">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                <MapPin className="w-4 h-4 text-neutral-400" /> City
              </label>
              <input type="text" name="city" required value={formData.city} onChange={handleChange}
                className="input-field" placeholder="New Delhi" />
            </div>
            <div className="space-y-2 group">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                <MapPin className="w-4 h-4 text-neutral-400" /> PIN Code
              </label>
              <input type="text" name="zipCode" required value={formData.zipCode} onChange={handleChange}
                className="input-field" placeholder="110029" />
            </div>
          </div>

          {/* Regulatory section */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-px bg-neutral-100 dark:bg-[#2a2a2a]" />
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-2">Regulatory Details</span>
              <div className="flex-1 h-px bg-neutral-100 dark:bg-[#2a2a2a]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                  <FileText className="w-4 h-4 text-neutral-400 group-focus-within:text-crimson-500 transition-colors" /> CDSCO License No.
                </label>
                <input type="text" name="cdscoBankLicenseNumber" required value={formData.cdscoBankLicenseNumber} onChange={handleChange}
                  className="input-field" placeholder="BB/MH/2024/001234" />
                <p className="text-[10px] text-neutral-400 ml-1">Central Drugs Standard Control Organisation</p>
              </div>
              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                  <IdCard className="w-4 h-4 text-neutral-400 group-focus-within:text-crimson-500 transition-colors" /> e-RaktKosh ID
                </label>
                <input type="text" name="eRaktKoshId" required value={formData.eRaktKoshId} onChange={handleChange}
                  className="input-field" placeholder="ERK-MH-45678" />
                <p className="text-[10px] text-neutral-400 ml-1">National Blood Transfusion Council portal</p>
              </div>
            </div>
          </div>

          {/* Email + Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 group">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                <Mail className="w-4 h-4 text-neutral-400 group-focus-within:text-crimson-500 transition-colors" /> Official Email
              </label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange}
                className="input-field" placeholder="admin@aiims.edu" />
            </div>
            <div className="space-y-2 group">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                <Lock className="w-4 h-4 text-neutral-400 group-focus-within:text-crimson-500 transition-colors" /> Password
              </label>
              <input type="password" name="password" required minLength="6" value={formData.password} onChange={handleChange}
                className="input-field" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full group overflow-hidden">
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting Application...</>
              ) : (
                <>Submit for Verification <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-[#2a2a2a] text-center">
          <p className="text-sm text-neutral-500 font-medium">
            Already a verified partner?{' '}
            <Link to="/login" className="text-crimson-600 font-bold hover:text-crimson-700 hover:underline transition-all">Log in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
