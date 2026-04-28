import { useState, useEffect, useRef } from "react"
import { supabase } from "@/utils/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Siren, Flame, Plus, Lock, CheckCircle2, History, User, MapPin, EyeOff, Shield, Mic, MicOff, AlertTriangle } from "lucide-react"
import EvacuationMap from "@/components/EvacuationMap"

type Step = 'initial' | 'role' | 'category' | 'assessment' | 'reported'
type Category = 'Fire' | 'Medical' | 'Security' | 'Silent'
type Role = 'Guest' | 'Staff' | 'Kitchen' | 'Security'

export default function GuestPage() {
  const [loading, setLoading] = useState(false)
  const [incidentId, setIncidentId] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('initial')
  
  // Incident State
  const [role, setRole] = useState<Role>('Guest')
  const [category, setCategory] = useState<Category>('Fire')
  const [location, setLocation] = useState('')
  const [useLiveLocation, setUseLiveLocation] = useState(false)
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null)
  const [gpsStatus, setGpsStatus] = useState('Awaiting fix...')
  const [metadata, setMetadata] = useState<Record<string, any>>({})
  const [description, setDescription] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [broadcastAlert, setBroadcastAlert] = useState<string | null>(null)

  // Siren Audio Setup
  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const lfoRef = useRef<OscillatorNode | null>(null)

  const startSiren = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass();
    }
    const ctx = audioCtxRef.current;
    
    if (ctx.state === 'suspended') ctx.resume();

    stopSiren(); // ensure no duplicates

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Classic dual-tone European style siren or wailing
    osc.type = 'square';
    osc.frequency.value = 700;

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 1; // 1 sweep per sec

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 300; // Sweeps between 400 and 1000 Hz

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.value = 0.3; // keep volume reasonable

    osc.start();
    lfo.start();
    
    oscRef.current = osc;
    lfoRef.current = lfo;
  };

  const stopSiren = () => {
    if (oscRef.current) {
      try { oscRef.current.stop() } catch (e) {}
      oscRef.current = null;
    }
    if (lfoRef.current) {
      try { lfoRef.current.stop() } catch (e) {}
      lfoRef.current = null;
    }
  };

  // Listen for Admin Broadcasts
  useEffect(() => {
    const channel = supabase.channel('public-alerts')
      .on('broadcast', { event: 'alert' }, (payload) => {
        setBroadcastAlert(payload.payload.message)
        startSiren()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const toggleSpeechToText = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice reporting is not supported in this browser.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription((prev) => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  }

  // Silent Mode Logic
  const longPressTimer = useRef<any>(null)

  // Live GPS Capture
  useEffect(() => {
    if (!useLiveLocation) {
      setGpsStatus('Manual address enabled')
      return
    }

    if (!('geolocation' in navigator)) {
      setGpsStatus('GPS unsupported')
      return
    }

    if (step !== 'role' && step !== 'assessment') return

    setGpsStatus('Acquiring GPS...')
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsStatus('GPS Locked')
      },
      (err) => {
        console.warn('GPS Denied', err)
        setGpsStatus('GPS unavailable')
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [step, useLiveLocation])

  const startSilentTimer = () => {
    longPressTimer.current = setTimeout(() => {
      submitSilentReport()
    }, 4000)
  }

  const cancelSilentTimer = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  async function submitSilentReport() {
    setLoading(true)
    const { data, error } = await supabase.from('incidents').insert({
      type: 'Silent Distress',
      severity: 'CRITICAL',
      location: 'COVERT_SIGNAL',
      description: 'Covert signal triggered via long-press.',
      status: 'REPORTED',
      is_silent: true,
      latitude: coords?.lat,
      longitude: coords?.lng
    }).select().single()
    
    if (!error) {
      setIncidentId(data.id)
      setStep('reported')
    }
    setLoading(false)
  }

  async function submitFullReport() {
    setLoading(true)
    
    const reportedLocation = location ? location : (useLiveLocation && coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : 'Unknown Sector')
    const { data, error } = await supabase.from('incidents').insert({
      type: category,
      severity: (category === 'Fire' || metadata.trapped === 'Yes') ? 'CRITICAL' : 'HIGH',
      location: reportedLocation,
      description: description || `${category} emergency reported by ${role}.`,
      status: 'REPORTED',
      reported_by: role,
      metadata,
      latitude: coords?.lat,
      longitude: coords?.lng,
      is_silent: category === 'Silent'
    }).select().single()

    if (error) {
       console.error(error)
      alert("Transmission failure. Please check connection.")
    } else {
      setIncidentId(data.id)
      setStep('reported')
    }
    setLoading(false)
  }

  async function updateStatus(status: 'SAFE' | 'NEED_HELP') {
    if (!incidentId) return
    const statusLocation = useLiveLocation && coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : location
    const { error } = await supabase.from('occupant_status').insert({
      incident_id: incidentId,
      name: role === 'Guest' ? 'Guest' : role,
      zone: statusLocation,
      role: role,
      status: status
    })
    
    if (!error) {
      alert(status === 'SAFE' ? "Status updated: You are marked SAFE." : "SOS sent: Responders alerted that you need help.")
    }
  }

  return (
    <div className="min-h-screen bg-[#060913] text-white flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Premium Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Global Broadcast Overlay */}
      <AnimatePresence>
        {broadcastAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-red-950/90 backdrop-blur-xl"
          >
            <motion.div 
               initial={{ scale: 0.8 }}
               animate={{ scale: 1 }}
               className="text-center space-y-6"
            >
               <AlertTriangle className="h-24 w-24 text-red-500 mx-auto animate-pulse" />
               <h1 className="text-4xl font-black text-white tracking-widest uppercase text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
                  EMERGENCY ALERT
               </h1>
               <p className="text-2xl font-bold text-white max-w-2xl leading-relaxed">
                  "{broadcastAlert}"
               </p>
               <button 
                  onClick={() => {
                    setBroadcastAlert(null)
                    stopSiren()
                  }}
                  className="mt-8 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-full font-bold text-white transition-colors"
               >
                  Acknowledge
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === 'initial' && (
          <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-12 relative z-10 w-full max-w-sm">
            <div 
              onMouseDown={startSilentTimer} 
              onMouseUp={cancelSilentTimer}
              onTouchStart={startSilentTimer}
              onTouchEnd={cancelSilentTimer}
              className="cursor-pointer select-none active:scale-95 transition-transform flex flex-col items-center"
            >
              <div className="bg-white/5 p-3 rounded-2xl backdrop-blur-md border border-white/10 mb-4">
                <Siren className="h-8 w-8 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">CrisisBridge</h1>
              <p className="text-sm font-medium text-slate-400">Emergency Response Portal</p>
            </div>

            <div className="flex justify-center py-8">
              <button 
                onClick={() => setStep('role')}
                className="group relative w-48 h-48 rounded-full bg-gradient-to-b from-red-500 to-red-700 flex items-center justify-center shadow-[0_0_80px_rgba(239,68,68,0.4)] hover:shadow-[0_0_120px_rgba(239,68,68,0.6)] transition-all duration-300 active:scale-95 border-4 border-red-400/30"
              >
                <div className="absolute inset-0 rounded-full animate-ping bg-red-500/20" />
                <span className="text-5xl font-black text-white tracking-widest drop-shadow-md">SOS</span>
              </button>
            </div>
            
            <p className="text-xs text-slate-500 font-medium tracking-wide">
              Tap to request immediate assistance
            </p>
          </motion.div>
        )}

        {step === 'role' && (
          <motion.div key="role" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full max-w-md space-y-8 z-10">
             <div className="flex flex-col text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2">Who are you?</h2>
                <p className="text-slate-400">Select your role so we can send the right help.</p>
             </div>
             <div className="grid grid-cols-2 gap-4">
               {[
                 { id: 'Guest', icon: User, label: 'Guest', desc: 'Visitor/Resident' },
                 { id: 'Staff', icon: Shield, label: 'Staff', desc: 'Hotel/Facility' },
                 { id: 'Kitchen', icon: Flame, label: 'Kitchen', desc: 'Culinary Team' },
                 { id: 'Security', icon: Lock, label: 'Security', desc: 'Guard/Patrol' }
               ].map((r) => (
                 <button 
                   key={r.id} 
                   className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border border-white/5 bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08] hover:border-blue-500/30 transition-all duration-300 group"
                   onClick={() => { setRole(r.id as Role); setStep('category'); }}
                 >
                   <div className="p-4 rounded-2xl bg-blue-500/10 group-hover:scale-110 transition-transform">
                     <r.icon className="h-6 w-6 text-blue-400" />
                   </div>
                   <div className="text-center">
                     <span className="block text-base font-semibold text-white">{r.label}</span>
                     <span className="block text-xs text-slate-400 mt-1">{r.desc}</span>
                   </div>
                 </button>
               ))}
             </div>
             <button onClick={() => setStep('initial')} className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors mt-8">Cancel</button>
          </motion.div>
        )}

        {step === 'category' && (
          <motion.div key="cat" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full max-w-md space-y-6 z-10">
            <div className="flex flex-col text-center mb-6">
                <h2 className="text-3xl font-bold tracking-tight mb-2">What's the emergency?</h2>
                <p className="text-slate-400">Select the category that fits best.</p>
             </div>
            <div className="space-y-4">
              {[
                { id: 'Fire', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'hover:border-orange-500/40', desc: 'Smoke, visible fire, explosion' },
                { id: 'Medical', icon: Plus, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'hover:border-emerald-500/40', desc: 'Injury, unconsciousness, cardiac' },
                { id: 'Security', icon: Lock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'hover:border-blue-500/40', desc: 'Hostile guest, theft, violence' },
                { id: 'Silent', icon: EyeOff, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'hover:border-purple-500/40', desc: 'Discreet help (Hidden mode)' }
              ].map((c) => (
                <button 
                  key={c.id} 
                  className={`w-full flex items-center p-4 rounded-2xl border border-white/5 bg-white/[0.04] backdrop-blur-md transition-all duration-300 group ${c.border}`}
                  onClick={() => { setCategory(c.id as Category); setStep('assessment'); }}
                >
                  <div className={`p-4 rounded-xl ${c.bg} mr-4 group-hover:scale-105 transition-transform`}>
                    <c.icon className={`h-6 w-6 ${c.color}`} />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-white">{c.id}</div>
                    <div className="text-xs text-slate-400 mt-1">{c.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep('role')} className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors mt-4">Back</button>
          </motion.div>
        )}

        {step === 'assessment' && (
          <motion.div key="assess" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full max-w-md space-y-6 z-10">
             <div className="flex flex-col text-center mb-4">
                <h2 className="text-2xl font-bold tracking-tight mb-2">Final Details</h2>
                <p className="text-slate-400 text-sm">Help us locate and assist you faster.</p>
             </div>

             <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl">
                {category === 'Fire' && (
                  <>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-300">Smoke Density</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map(v => (
                          <button 
                            key={v} 
                            className={`py-2 rounded-xl text-sm font-medium transition-colors ${metadata.smoke === v ? 'bg-orange-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`} 
                            onClick={() => setMetadata({...metadata, smoke: v})}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-300">Are people trapped?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Yes', 'No'].map(v => (
                          <button 
                            key={v} 
                            className={`py-2 rounded-xl text-sm font-medium transition-colors ${metadata.trapped === v ? 'bg-orange-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`} 
                            onClick={() => setMetadata({...metadata, trapped: v})}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <label className="text-sm font-semibold text-slate-300">Location Details</label>
                     <button 
                       onClick={() => setUseLiveLocation(!useLiveLocation)}
                       className={`text-xs px-2 py-1 rounded-md transition-colors ${useLiveLocation ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'}`}
                     >
                       {useLiveLocation ? 'GPS Active' : 'Use GPS'}
                     </button>
                   </div>
                   <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-blue-400" />
                      <input 
                        placeholder="Room #, Floor, or Area..." 
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                   </div>
                   <p className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {gpsStatus}{coords ? ` (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : ''}
                   </p>
                </div>

                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <label className="text-sm font-semibold text-slate-300">Additional Info (Optional)</label>
                     <button 
                       onClick={toggleSpeechToText}
                       className={`text-xs px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${isListening ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'}`}
                     >
                       {isListening ? <><Mic className="h-3 w-3" /> Listening...</> : <><MicOff className="h-3 w-3" /> Tap to Speak</>}
                     </button>
                   </div>
                   <textarea 
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-none transition-all placeholder:text-slate-500"
                      placeholder="Any specific details..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                   />
                </div>

                <button 
                  className="w-full h-14 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-2" 
                  onClick={submitFullReport} 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Dispatch Help <Siren className="w-5 h-5" /></>
                  )}
                </button>
             </div>
             <button onClick={() => setStep('category')} className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors">Back</button>
          </motion.div>
        )}

        {step === 'reported' && (
          <motion.div key="done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6 w-full max-w-md z-10">
             <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
             </div>
             
             <div>
               <h2 className="text-2xl font-bold mb-2">Help is on the way</h2>
               <p className="text-slate-400 text-sm">Responders have been alerted. Stay calm and follow evacuation protocols if necessary.</p>
             </div>

             <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                <EvacuationMap zone={location} />
             </div>

             <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.04] backdrop-blur-md space-y-4 text-left">
                <p className="text-sm font-semibold text-white">Provide a status update</p>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                      className="bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-sm rounded-xl py-3 transition-colors"
                      onClick={() => updateStatus('SAFE')}
                   >
                      I am Safe
                   </button>
                   <button 
                      className="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-semibold text-sm rounded-xl py-3 transition-colors"
                      onClick={() => updateStatus('NEED_HELP')}
                   >
                      I Need Help
                   </button>
                </div>
             </div>

             <button 
               onClick={() => { setStep('initial'); setMetadata({}); setDescription(''); setLocation(''); }} 
               className="flex items-center justify-center gap-2 mx-auto text-slate-400 hover:text-white transition-colors text-sm font-medium mt-8"
             >
                <History className="h-4 w-4" /> Start New Report
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
