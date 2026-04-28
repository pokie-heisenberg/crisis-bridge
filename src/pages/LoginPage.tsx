import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ShieldAlert, Fingerprint, Lock, ArrowRight, Activity } from "lucide-react"

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
    <div className="min-h-screen bg-[#060913] text-white flex flex-col items-center justify-center p-6 selection:bg-blue-500/30 overflow-hidden relative font-sans">
      {/* Ambient Premium Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-8 w-full max-w-md relative z-10"
      >
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8, delay: 0.2 }}
            className="bg-white/5 p-4 rounded-3xl backdrop-blur-md border border-white/10 mb-6 inline-flex shadow-[0_0_40px_rgba(59,130,246,0.2)]"
          >
            <ShieldAlert className="h-10 w-10 text-blue-500" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Command Center</h1>
          <p className="text-sm text-slate-400 font-medium">Secure Operations Portal</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle inner highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 group-focus-within:text-blue-300 transition-colors" />
                <input 
                  type="email" 
                  placeholder="Identity Token" 
                  defaultValue="admin@crisisbridge.com"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 group-focus-within:text-blue-300 transition-colors" />
                <input 
                  type="password" 
                  placeholder="Passphrase" 
                  defaultValue="••••••••"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-center px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="w-5 h-5 rounded border border-white/20 bg-black/20 group-hover:border-blue-500 transition-colors flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                </div>
                <span className="text-sm text-slate-400 font-medium">Remember Session</span>
              </label>
              <span className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer font-medium">Reset Access</span>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-14 mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2 border border-white/10 relative overflow-hidden group"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Activity className="w-5 h-5 group-hover:animate-pulse" />
                  Establish Link
                  <ArrowRight className="w-5 h-5 absolute right-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center gap-4 mt-4"
        >
          <Link to="/" className="text-sm font-medium text-slate-500 hover:text-white transition-colors">Return to Directory</Link>
          <p className="text-[10px] font-medium text-slate-600 text-center leading-relaxed tracking-wide uppercase">
            Authorized personnel only.<br />
            Operations logged via Protocol 4.C.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
