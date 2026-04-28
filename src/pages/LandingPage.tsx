import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ShieldAlert, Siren, Zap, Globe, ShieldCheck } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white selection:bg-red-500/30 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-red-600/5 blur-[120px] -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8"
        >
          <Zap className="h-3 w-3" /> Next-Gen Emergency Ops
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.9] text-white mb-8"
        >
          Accelerated <span className="text-red-600">Crisis</span> <br />
          Coordination
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-12"
        >
          CrisisBridge eliminates communication siloes during high-stakes hospitality emergencies.
          Uniting guests, staff, and responders through a unified tactical link.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link to="/guest">
            <Button size="lg" className="h-16 px-10 rounded-xl text-lg group">
              Guest SOS Portal <Siren className="ml-2 h-5 w-5 group-hover:animate-pulse" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="h-16 px-10 rounded-xl text-lg backdrop-blur-xl">
              Command Center
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Globe, title: "Universal Sync", desc: "Instantly coordinate between guests and on-site security on any device." },
          { icon: ShieldCheck, title: "AI Triage", desc: "Automated intensity scoring and emergency SOP generation via Gemini." },
          { icon: Zap, title: "Zero Latency", desc: "Powered by Supabase Realtime for sub-second incident reporting & status." }
        ].map((feat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -10 }}
            className="p-8 rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-md group hover:border-red-600/30 transition-all duration-500"
          >
            <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <feat.icon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-black uppercase italic italic mb-3">{feat.title}</h3>
            <p className="text-slate-500 text-sm font-bold leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Footer System Audit */}
      <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-800 flex flex-col items-center gap-12 opacity-30">
        <div className="flex items-center gap-4">
          <ShieldAlert className="h-8 w-8" />
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">CrisisBridge</h2>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-center">
          SECURE GLOBAL OPERATIONAL NETWORK // GOOGLE SOLUTION CHALLENGE 2026
        </p>
      </footer>
    </div>
  )
}
