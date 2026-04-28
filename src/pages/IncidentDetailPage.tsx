import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { supabase } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { 
  MapPin, 
  Clock, 
  CheckSquare, 
  ChevronLeft,
  Loader2,
  Activity,
  Globe
} from "lucide-react"
import { runFullTriage, translateDescription } from "@/utils/gemini"
import type { TriageResult } from "@/utils/gemini"
import type { Incident } from "@/hooks/useIncidents"
import TriageCard from "@/components/TriageCard"

import OrchestrationPanel from "@/components/OrchestrationPanel"
import RoleInstructions from "@/components/RoleInstructions"
import EscalationBrief from "@/components/EscalationBrief"
import { generatePIR } from "@/utils/gemini"
import type { PostIncidentReport } from "@/utils/gemini"
import AfterActionReport from "@/components/AfterActionReport"
import OccupantTracker from "@/components/OccupantTracker"
import EvacuationMap from "@/components/EvacuationMap"

export default function IncidentDetailPage() {
  const { id } = useParams()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [triage, setTriage] = useState<TriageResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [triageLoading, setTriageLoading] = useState(false)
  const [showEscalation, setShowEscalation] = useState(false)
  const [pir, setPir] = useState<PostIncidentReport | null>(null)
  const [resolving, setResolving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translation, setTranslation] = useState<string | null>(null)

  const handleTranslate = async () => {
    if (!incident?.description) return;
    setTranslating(true);
    const result = await translateDescription(incident.description);
    setTranslation(result);
    setTranslating(false);
  }

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', id)
        .single()
      
      setIncident(data)
      setLoading(false)

      if (data && data.status !== 'RESOLVED') {
        setTriageLoading(true);
        const result = await runFullTriage(data.type, data.location, data.description || "", data.metadata);
        setTriage(result);
        setTriageLoading(false);
      }
    }
    if (id) fetchData()
  }, [id])

  async function handleResolve() {
    if (!incident) return
    setResolving(true)
    
    const { error } = await supabase
      .from('incidents')
      .update({ status: 'RESOLVED' })
      .eq('id', incident.id)

    if (!error) {
      const generatedPir = await generatePIR(incident, triage || undefined)
      setPir(generatedPir)
      setIncident({ ...incident, status: 'RESOLVED' })
    }
    setResolving(false)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Activity className="w-12 h-12 text-blue-500 animate-pulse" />
      <span className="text-slate-400 font-medium tracking-wide">Syncing Incident Data...</span>
    </div>
  )

  if (!incident) return <div className="p-20 text-center font-mono">Incident not found.</div>

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", bounce: 0.4 } }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {showEscalation && (
        <EscalationBrief 
          incident={incident} 
          triage={triage} 
          onClose={() => setShowEscalation(false)} 
        />
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/admin">
          <Button variant="ghost" className="gap-2 text-slate-400 hover:text-white bg-white/5 rounded-xl border border-white/5 hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" /> Back to Monitor
          </Button>
        </Link>
        <div className="flex gap-2">
          {incident.status !== 'RESOLVED' ? (
            <>
              <Button 
                variant="outline" 
                className="font-semibold text-red-400 border-red-500/30 hover:bg-red-500/10 rounded-xl"
                onClick={() => setShowEscalation(true)}
              >
                Escalate
              </Button>
              <Button 
                className="font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] w-36"
                onClick={handleResolve}
                disabled={resolving}
              >
                {resolving ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Mark Resolved'}
              </Button>
            </>
          ) : (
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold px-4 py-2 rounded-xl text-sm">
              <CheckSquare className="w-4 h-4 mr-2" /> RESOLVED
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {pir && <AfterActionReport report={pir} />}
          
          {/* AI TRIAGE LAYER - Hide if PIR is visible to focus on report */}
          {!pir && <TriageCard triage={triage} loading={triageLoading} />}

          <Card className="border-white/5 bg-white/[0.02] backdrop-blur-md rounded-3xl overflow-hidden shadow-xl divide-y divide-white/5">
            <div className="p-8 relative">
              {/* STATUS INDICATOR OVERLAY */}
              <div className="absolute top-0 right-0 p-6">
                 <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-ping absolute opacity-75" />
                    <div className="h-2 w-2 rounded-full bg-red-500 relative" />
                    <span className="text-xs font-bold text-red-400">Live Feed</span>
                 </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${incident.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
                  {incident.severity}
                </span>
                <span className="text-slate-500 font-mono text-xs bg-black/20 px-2 py-1 rounded-md">#{incident.id.slice(0,8)}</span>
                {incident.is_silent && <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-full animate-pulse">COVERT</span>}
              </div>
              
              <h1 className="text-3xl font-bold tracking-tight text-white mb-3">{incident.type} Emergency</h1>
              
              <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-400 pt-2">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-400" /> {incident.location}</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-blue-400" /> {new Date(incident.created_at).toLocaleTimeString()}</div>
              </div>

              {/* DYNAMIC METADATA GRID */}
              {incident.metadata && Object.keys(incident.metadata).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8">
                   {Object.entries(incident.metadata).map(([k, v]) => (
                     <div key={k} className="bg-black/20 border border-white/5 p-3 rounded-2xl flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-500 capitalize">{k}</span>
                        <span className="text-sm font-bold text-white">{String(v)}</span>
                     </div>
                   ))}
                </div>
              )}

              <div className="mt-8 relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-full" />
                <div className="bg-gradient-to-r from-blue-500/5 to-transparent p-5 pl-6 rounded-2xl border border-white/5 relative">
                  <p className="text-slate-300 leading-relaxed font-medium">
                    "{translation || incident.description || 'No additional description provided.'}"
                  </p>
                  
                  {incident.description && !translation && (
                    <button 
                      onClick={handleTranslate}
                      disabled={translating}
                      className="mt-3 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-md"
                    >
                      {translating ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Globe className="h-3 w-3" /> Translate to English</>}
                    </button>
                  )}
                  {translation && (
                    <span className="mt-3 block text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Translated via AI
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6 bg-black/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <CheckSquare className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tactical SOP</h3>
                  <p className="text-sm text-slate-400">AI-generated response checklist</p>
                </div>
              </div>

              {triageLoading && (
                <div className="flex items-center gap-3 text-slate-400 animate-pulse p-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Synthesizing optimal response protocol...</span>
                </div>
              )}

              {!triageLoading && triage && (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 gap-3"
                >
                  {triage.checklist.map((s, i) => (
                    <motion.div 
                      variants={itemVariants}
                      key={i} 
                      className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors cursor-pointer group"
                    >
                      <div className="h-6 w-6 rounded-lg border-2 border-slate-600 group-hover:border-emerald-400 group-hover:bg-emerald-400/20 transition-all flex-shrink-0 mt-0.5 relative">
                         <div className="absolute inset-0 bg-emerald-400 scale-0 group-hover:scale-50 rounded-sm transition-transform" />
                      </div>
                      <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors leading-relaxed">{s}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </Card>
        </div>

        <div className="flex flex-col h-full space-y-6">
          {/* ACCOUNTABILITY & EVAC LAYERS */}
          {incident.status !== 'RESOLVED' && (
            <>
              <OccupantTracker incidentId={incident.id} zone={triage?.zone || incident.location} />
              <Card className="border-white/5 bg-white/[0.02] backdrop-blur-md rounded-3xl overflow-hidden shadow-xl p-1">
                <EvacuationMap zone={triage?.zone || incident.location} />
              </Card>
            </>
          )}

          {/* ORCHESTRATION PANEL */}
          <OrchestrationPanel startTime={incident.created_at} />

          {/* ROLE-AWARE INSTRUCTIONS */}
          <RoleInstructions 
             type={incident.type} 
             severity={incident.severity} 
             zone={triage?.zone || incident.location} 
          />
        </div>
      </div>
    </div>
  )
}
