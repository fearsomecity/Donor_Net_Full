import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Calendar, Clock, MapPin, CheckCircle2, ArrowRight, Hospital, ChevronRight } from 'lucide-react';
import { fetchAPI } from '../utils/apiClient';

export default function BookAppointment() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(location.state?.selectedHospital ? 2 : 1);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(location.state?.selectedHospital || null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch nearby hospitals (mocking search for now by zip code)
    const fetchHospitals = async () => {
      try {
        const res = await fetchAPI('/api/hospitals');
        const data = await res.json();
        if (res.ok) {
          // Map to match the expected schema in UI
          const formattedHospitals = data.map(h => ({
            id: h._id,
            name: h.hospitalProfile?.hospitalName || 'Unknown Hospital',
            address: h.hospitalProfile?.address || 'Address not provided',
            zip: h.hospitalProfile?.zipCode || ''
          }));
          setHospitals(formattedHospitals);
        } else {
          console.error('Failed to fetch hospitals:', data.message);
        }
      } catch (err) {
        console.error('Error fetching hospitals:', err);
      }
    };
    fetchHospitals();
  }, []);

  const handleBook = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAPI('/api/donors/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: selectedHospital.id,
          hospitalName: selectedHospital.name,
          date,
          time,
          bloodType: user?.profile?.bloodType || ''
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStep(4); // Success step
      } else {
        setError(data.message || 'Failed to book appointment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"];

  return (
    <div className="relative min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] pt-32 pb-20 px-6 overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-crimson-100/30 rounded-full blur-[100px] animate-float dark:hidden" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-50/50 rounded-full blur-[100px] animate-float dark:hidden" style={{ animationDelay: '3s' }} />

      <div className="relative max-w-2xl mx-auto z-10">
        <header className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tightest mb-4 font-header">
            Book Your <span className="text-gradient">Next Mission</span>
          </h1>
          <p className="text-neutral-500 font-medium">Choose a convenient time and place to save lives.</p>
        </header>

        <div className="glass rounded-[2.5rem] overflow-hidden shadow-2xl dark:shadow-none shadow-neutral-200/50 dark:shadow-none animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Progress Bar */}
          <div className="h-1.5 bg-neutral-100 w-full flex">
            <div className={`h-full bg-crimson-600 transition-all duration-700 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
          </div>

          <div className="p-10 md:p-14">
            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 font-header">Select Hospital</h2>
                  <p className="text-sm text-neutral-500 font-medium">Choose a donation center near you.</p>
                </div>
                <div className="space-y-4">
                  {hospitals.map(h => (
                    <button 
                      key={h.id}
                      onClick={() => setSelectedHospital(h)}
                      className={`w-full flex items-center gap-4 p-6 rounded-3xl border-2 transition-all duration-300 text-left ${selectedHospital?.id === h.id ? 'border-crimson-600 bg-crimson-50/30' : 'border-neutral-50 bg-white dark:bg-[#141414] hover:border-neutral-200 dark:border-[#333]'}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedHospital?.id === h.id ? 'bg-crimson-600 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                        <Hospital className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-neutral-900 dark:text-white">{h.name}</h3>
                        <p className="text-xs font-medium text-neutral-500">{h.address} • {h.zip}</p>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform ${selectedHospital?.id === h.id ? 'translate-x-1 text-crimson-600' : 'text-neutral-300'}`} />
                    </button>
                  ))}
                </div>
                <button 
                  disabled={!selectedHospital}
                  onClick={() => setStep(2)}
                  className="btn-primary w-full disabled:opacity-50 disabled:grayscale transition-all"
                >
                  Continue to Schedule
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 font-header">Pick Date & Time</h2>
                  <p className="text-sm text-neutral-500 font-medium">{selectedHospital.name}</p>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Select Date</label>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      className="input-field"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Available Slots</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {timeSlots.map(t => (
                        <button 
                          key={t}
                          onClick={() => setTime(t)}
                          className={`p-4 rounded-2xl text-sm font-bold transition-all border-2 ${time === t ? 'bg-neutral-900 dark:bg-[#141414] text-white border-neutral-900' : 'bg-white dark:bg-[#141414] text-neutral-600 border-neutral-100 dark:border-[#2a2a2a] hover:border-neutral-300'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 p-5 rounded-3xl font-bold text-neutral-600 hover:bg-neutral-100 transition-all">Back</button>
                  <button 
                    disabled={!date || !time}
                    onClick={() => setStep(3)}
                    className="btn-primary flex-[2] disabled:opacity-50"
                  >
                    Review Booking
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 text-center">
                <div className="w-20 h-20 bg-crimson-50 text-crimson-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-neutral-900 dark:text-white mb-2 font-header">Confirm Details</h2>
                  <p className="text-neutral-500">Please review your appointment summary.</p>
                </div>
                
                <div className="bg-neutral-50 dark:bg-[#0a0a0a] rounded-[2rem] p-8 text-left space-y-4">
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase">Hospital</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{selectedHospital.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase">Date</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{new Date(date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase">Time Slot</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase">Blood Type</span>
                    <span className="font-bold text-crimson-600">{user?.profile?.bloodType || '—'}</span>
                  </div>
                </div>

                {error && <p className="text-crimson-600 text-sm font-bold">⚠️ {error}</p>}

                <div className="flex gap-4">
                  <button onClick={() => setStep(2)} className="flex-1 p-5 rounded-3xl font-bold text-neutral-600 hover:bg-neutral-100 transition-all">Back</button>
                  <button 
                    onClick={handleBook}
                    disabled={loading}
                    className="btn-primary flex-[2]"
                  >
                    {loading ? 'Booking...' : 'Confirm Appointment'}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="text-center py-8 animate-fade-in-up">
                <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-[shimmer_2s_infinite]">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black text-neutral-900 dark:text-white mb-4 font-header">Booking Confirmed!</h2>
                <p className="text-neutral-500 max-w-sm mx-auto mb-12 font-medium">
                  Thank you for your commitment. You'll receive a reminder 24 hours before your session.
                </p>
                <button 
                  onClick={() => navigate('/dashboard/donor')}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  Return to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
