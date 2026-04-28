import { useState, useEffect } from "react"
import { Users, Activity, Clock, ShieldCheck, AlertCircle } from "lucide-react"
import { supabase } from "@/utils/supabase/client"
import { motion, AnimatePresence } from "framer-motion"

type OccupantRecord = {
  id: string
  name: string
  role: string
  zone: string
  status: 'SAFE' | 'NEED_HELP' | 'EVACUATED'
  created_at: string
}

export default function OccupantTracker({ incidentId, zone }: { incidentId: string, zone: string }) {
  const [records, setRecords] = useState<OccupantRecord[]>([])
  const [stats, setStats] = useState({
    safe: 0,
    help: 0,
    unknown: 12, // Mock base unknown assumption for the zone
    evacuated: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase
        .from('occupant_status')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false })

      if (data) {
        setRecords(data as OccupantRecord[])
        const counts = {
          safe: data.filter(d => d.status === 'SAFE').length,
          help: data.filter(d => d.status === 'NEED_HELP').length,
          evacuated: data.filter(d => d.status === 'EVACUATED').length,
          unknown: Math.max(0, 12 - data.length)
        }
        setStats(counts)
      }
      setLoading(false)
    }

    fetchStats()

    const channel = supabase
      .channel('occupant-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'occupant_status', filter: `incident_id=eq.${incidentId}` }, 
        () => fetchStats()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [incidentId])

  const total = stats.safe + stats.help + stats.unknown + stats.evacuated

  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-md overflow-hidden shadow-xl flex flex-col h-[500px]">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/10">
         <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">Live Roster</h3>
         </div>
         <span className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-1 rounded-md">{zone}</span>
      </div>

      <div className="p-5 space-y-6 flex-shrink-0">
         {/* Main Stats */}
         <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 text-center">
               <div className="text-3xl font-black text-emerald-400">{stats.safe}</div>
               <div className="text-[10px] font-bold uppercase text-emerald-500 tracking-widest mt-1">Safe</div>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 text-center relative overflow-hidden">
               {stats.help > 0 && <div className="absolute inset-0 bg-red-500/5 animate-pulse" />}
               <div className="text-3xl font-black text-red-400 relative z-10">{stats.help}</div>
               <div className="text-[10px] font-bold uppercase text-red-500 tracking-widest mt-1 relative z-10">At Risk</div>
            </div>
         </div>

         {/* Distribution Bar */}
         <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-400">
               <span>Accountability Check</span>
               <span>{stats.safe + stats.help} / {total} Checked In</span>
            </div>
            <div className="h-2 flex rounded-full overflow-hidden bg-white/5 border border-white/5">
               <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(stats.safe / total) * 100}%` }} />
               <div className="bg-red-500 transition-all duration-500" style={{ width: `${(stats.help / total) * 100}%` }} />
               <div className="bg-blue-500 transition-all duration-500" style={{ width: `${(stats.evacuated / total) * 100}%` }} />
            </div>
         </div>
      </div>

      {/* Live Roster Feed */}
      <div className="flex-1 overflow-hidden flex flex-col border-t border-white/5 bg-black/20">
         <div className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/[0.01] border-b border-white/5 flex items-center gap-2">
            <Activity className="h-3 w-3" /> Recent Check-ins
         </div>
         <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            <AnimatePresence initial={false}>
               {records.length === 0 ? (
                 <motion.div 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   className="text-center p-6 text-sm text-slate-500 font-medium"
                 >
                   Awaiting field check-ins...
                 </motion.div>
               ) : (
                 records.map((record) => (
                   <motion.div
                     key={record.id}
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3"
                   >
                     {record.status === 'SAFE' ? (
                       <div className="p-1.5 rounded-lg bg-emerald-500/10 flex-shrink-0 mt-0.5">
                         <ShieldCheck className="h-4 w-4 text-emerald-400" />
                       </div>
                     ) : (
                       <div className="p-1.5 rounded-lg bg-red-500/10 flex-shrink-0 mt-0.5 animate-pulse">
                         <AlertCircle className="h-4 w-4 text-red-400" />
                       </div>
                     )}
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between gap-2">
                         <span className="text-sm font-semibold text-white truncate">{record.name} ({record.role})</span>
                         <span className="text-[10px] text-slate-500 flex items-center gap-1 flex-shrink-0">
                           <Clock className="h-3 w-3" />
                           {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                         </span>
                       </div>
                       <div className="text-xs text-slate-400 mt-1 truncate">
                         Location: <span className="text-slate-300">{record.zone}</span>
                       </div>
                     </div>
                   </motion.div>
                 ))
               )}
            </AnimatePresence>
         </div>
      </div>
    </div>
  )
}
