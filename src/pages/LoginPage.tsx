import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ShieldAlert, Fingerprint, Lock, Siren } from "lucide-react"
import { 
  UiverseFormContainer, 
  UiverseInput, 
  UiversePearlButton, 
  UiverseToggle,
  UiverseLoader,
  UiverseRadio
} from "@/components/ui/uiverse-components"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin() {
    setLoading(true)
    setTimeout(() => {
      navigate('/admin')
      setLoading(false)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white flex flex-col items-center justify-center p-6 selection:bg-red-500/30 overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-red-600/10 blur-[150px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-12 w-full max-w-md"
      >
        <div className="text-center">
          <ShieldAlert className="h-16 w-16 text-red-600 mx-auto mb-6 shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">CrisisBridge</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2">OPERATIONS ACCESS TERMINAL</p>
        </div>

        <UiverseFormContainer style={{ padding: "40px 30px", width: "100%", position: "relative" }}>
          
          <div className="text-center space-y-2 mb-4">
            <h2 className="text-2xl font-bold text-slate-800">System Authentication</h2>
            <p className="text-xs text-slate-500 font-bold uppercase">Enter Credentials</p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <UiverseInput 
                  type="email" 
                  placeholder="Terminal Identity" 
                  defaultValue="admin@crisisbridge.com"
                  style={{ width: "100%", paddingLeft: "45px" }}
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <UiverseInput 
                  type="password" 
                  placeholder="Pass-Authorization-Code" 
                  defaultValue="••••••••"
                  style={{ width: "100%", paddingLeft: "45px" }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center px-1">
              <UiverseToggle label="Remember Me" />
            </div>

            <div className="flex justify-center items-center py-2">
              <UiverseRadio name="protocol" label="Standard Auth" defaultChecked />
              <div className="w-4"></div>
              <UiverseRadio name="protocol" label="Emergency Bypass" />
            </div>

            <div className="flex justify-center mt-6 h-16 items-center">
              {loading ? (
                <UiverseLoader />
              ) : (
                <UiversePearlButton onClick={handleLogin}>
                  <Siren className="pearl-icon" /> Establish Connection
                </UiversePearlButton>
              )}
            </div>

            <div className="flex items-center justify-between px-1 mt-4">
              <Link to="/" className="text-[10px] font-black uppercase text-slate-600 hover:text-slate-900 transition-colors">Request Access</Link>
            </div>
          </div>
        </UiverseFormContainer>

        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 text-center leading-relaxed">
          AUTHORIZED USE ONLY. ALL OPERATIONS ARE LOGGED UNDER <br />
          CRISISBRIDGE AUDIT PROTOCOL SECTION 4.C.
        </p>
      </motion.div>
    </div>
  )
}
