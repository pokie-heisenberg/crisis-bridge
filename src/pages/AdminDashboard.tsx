import { useState } from "react"
import { useIncidents } from "@/hooks/useIncidents"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import { supabase } from "@/utils/supabase/client"
import { 
  AlertTriangle, 
  MapPin, 
  Activity,
  User,
  Clock,
  ExternalLink,
  ShieldAlert,
  Search,
  Siren,
  CheckCircle2,
  Megaphone,
  Send
} from "lucide-react"

import TacticalMap from "@/components/TacticalMap"
import TerminalCommand from "@/components/TerminalCommand"

export default function AdminDashboard() {
  const { incidents, loading } = useIncidents()
  const [broadcastMsg, setBroadcastMsg] = useState("")
  const [broadcasting, setBroadcasting] = useState(false)

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return
    setBroadcasting(true)
    await supabase.channel('public-alerts').send({
      type: 'broadcast',
      event: 'alert',
      payload: { message: broadcastMsg, timestamp: new Date().toISOString() }
    })
    setBroadcastMsg("")
    setBroadcasting(false)
  }

  const stats = [
    { name: "Active Crisis", value: incidents.filter(i => i.status !== 'RESOLVED').length, color: "text-red-400", bg: "bg-red-500/10", icon: AlertTriangle },
    { name: "Avg Response", value: "1m 12s", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: Clock },
    { name: "Team Sync", value: "100%", color: "text-blue-400", bg: "bg-blue-500/10", icon: Activity },
    { name: "Personnel", value: "18 On-Site", color: "text-purple-400", bg: "bg-purple-500/10", icon: User },
  ]

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <ShieldAlert className="h-12 w-12 text-blue-500 animate-pulse" />
          <p className="text-sm font-medium text-slate-400">Syncing Command Feed...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-white/5 bg-white/[0.02] backdrop-blur-md rounded-3xl overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} blur-[50px] -z-10 rounded-full translate-x-1/2 -translate-y-1/2`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-400">{stat.name}</CardTitle>
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <div>
              <h3 className="text-2xl font-bold flex items-center gap-2 text-white">
                <Siren className="h-6 w-6 text-red-500 animate-pulse" />
                Live Command Feed
              </h3>
              <p className="text-sm text-slate-400 mt-1">Real-time incident ingestion and status.</p>
            </div>
            <div className="relative group flex gap-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
              <input 
                placeholder="Search active incidents..." 
                className="h-10 w-full sm:w-64 pl-10 pr-4 text-sm bg-black/20 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white placeholder:text-slate-500" 
              />
            </div>
          </div>

          <Card className="border-white/5 bg-white/[0.02] backdrop-blur-md rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs font-semibold text-slate-400 bg-white/[0.02] border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-medium">Incident Details</th>
                    <th className="px-6 py-4 font-medium">Location</th>
                    <th className="px-6 py-4 font-medium">Severity</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence mode="popLayout">
                    {incidents.slice(0, 5).map((incident) => (
                      <motion.tr 
                        key={incident.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="hover:bg-white/[0.04] transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{incident.type}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">#{incident.id.slice(0,8)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-300 font-medium">
                            <MapPin className="h-4 w-4 text-blue-400" /> {incident.location}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${incident.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
                            {incident.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${incident.status === 'REPORTED' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <span className="font-medium text-slate-300 capitalize text-xs">
                              {incident.status.toLowerCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link to={`incidents/${incident.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {incidents.length === 0 && (
                <div className="p-12 text-center flex flex-col items-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500/50 mb-3" />
                  <p className="text-slate-400 font-medium">No active incidents</p>
                  <p className="text-xs text-slate-500 mt-1">All systems nominal.</p>
                </div>
              )}
            </div>
          </Card>
          
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
             <TerminalCommand />
             
             {/* Megaphone Broadcast Panel */}
             <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl flex flex-col h-[300px]">
                <div className="px-4 py-3 border-b border-red-500/10 flex items-center gap-2 bg-red-500/10">
                   <Megaphone className="h-4 w-4 text-red-500" />
                   <span className="text-sm font-bold text-red-400">Global PA System</span>
                </div>
                <div className="p-4 flex-1 flex flex-col space-y-3">
                   <p className="text-[10px] uppercase tracking-widest text-red-400/80 font-bold mb-2">
                     Warning: This will push an immediate alert to all connected guest devices.
                   </p>
                   <textarea 
                     value={broadcastMsg}
                     onChange={(e) => setBroadcastMsg(e.target.value)}
                     placeholder="Type mass broadcast message (e.g. EVACUATE EAST WING)..."
                     className="w-full flex-1 bg-black/40 border border-red-500/20 rounded-xl p-3 text-sm text-red-100 focus:ring-2 focus:ring-red-500/50 outline-none resize-none placeholder:text-red-500/50"
                   />
                   <Button 
                     onClick={handleBroadcast} 
                     disabled={broadcasting || !broadcastMsg.trim()}
                     className="w-full bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                   >
                     {broadcasting ? <Siren className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Transmit Alert</>}
                   </Button>
                </div>
             </Card>
          </div>
          
        </div>

        {/* Map Column */}
        <div className="space-y-6">
            <Card className="border-white/5 bg-white/[0.02] backdrop-blur-md rounded-3xl overflow-hidden p-1 shadow-xl h-[600px] flex flex-col">
               <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                 <span className="text-sm font-semibold text-white flex items-center gap-2">
                   <MapPin className="h-4 w-4 text-blue-400" /> Tactical Overview
                 </span>
                 <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </span>
               </div>
               <div className="flex-1 rounded-2xl overflow-hidden m-1 border border-white/5 relative bg-black/20">
                  <TacticalMap incidents={incidents} />
               </div>
            </Card>
        </div>
      </div>
    </div>
  )
}
