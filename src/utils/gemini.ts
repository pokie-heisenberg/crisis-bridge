import type { Incident } from '@/hooks/useIncidents';
import { GoogleGenAI } from '@google/genai';
import type { Incident } from "@/hooks/useIncidents";

const genai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export type TriageResult = {
  confirmedType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  zone: string
  spreadRisk: string
  urgencyScore: number
  immediateAction: string
  responseMode: string
  checklist: string[]
}

const FALLBACK_TRIAGE: TriageResult = {
  confirmedType: 'Unknown',
  severity: 'HIGH',
  zone: 'Unknown Zone',
  spreadRisk: 'Unknown — assume worst case',
  urgencyScore: 75,
  immediateAction: 'Dispatch nearest available responder immediately.',
  responseMode: 'Immediate Response',
  checklist: [
    'Confirm incident details and location',
    'Dispatch appropriate emergency personnel',
    'Establish communication with affected zone',
  ]
}

export async function runFullTriage(
  incidentType: string,
  location: string,
  description: string,
  metadata?: Record<string, unknown>
): Promise<TriageResult> {
  const contextBlock = metadata
    ? `Additional context: ${JSON.stringify(metadata)}`
    : ''

  const prompt = `
You are an expert emergency response AI for a hospitality crisis orchestration platform.

An emergency has been reported:
- Type: ${incidentType}
- Location: ${location}
- Description: ${description}
${contextBlock}

Analyze this and return a JSON object with EXACTLY these fields:
{
  "confirmedType": "<confirmed emergency type, e.g. Fire/Smoke, Medical Emergency, Security Threat>",
  "severity": "<one of: LOW, MEDIUM, HIGH, CRITICAL>",
  "zone": "<identify the zone, e.g. Floor 2 East Wing, Kitchen Block, Main Lobby>",
  "spreadRisk": "<one sentence about how this could spread or worsen>",
  "urgencyScore": <number 0-100 representing urgency>,
  "immediateAction": "<one clear sentence: the single most important action right now>",
  "responseMode": "<short label: e.g. Immediate Local Evacuation, Contained Response, Full Evacuation>",
  "checklist": ["<step 1>", "<step 2>", "<step 3>", "<step 4>"]
}

Return ONLY the JSON object. No markdown. No explanation.
`

  try {
    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.1 }
    })

    const raw = response.text || '{}'
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(cleaned) as TriageResult
  } catch (err) {
    console.error('Gemini triage failed:', err)
    return FALLBACK_TRIAGE
  }
}

export type PostIncidentReport = {
  summary: string
  timeline: { time: string, event: string }[]
  recommendations: string[]
  bottlenecks?: string
}

export async function generatePIR(incident: Incident, triage?: TriageResult): Promise<PostIncidentReport> {
  const prompt = `
You are an expert safety consultant providing an After-Action Report (AAR).
An incident has been RESOLVED:
- Type: ${incident.type}
- Location: ${incident.location}
- Description: ${incident.description}
- AI Triage Confirmed: ${triage?.confirmedType}
- Urgency Score: ${triage?.urgencyScore}
- Reported At: ${incident.created_at}

Provide a Post-Incident Report in JSON format:
{
  "summary": "<2-3 sentence summary of what happened>",
  "timeline": [
    {"time": "T+0m", "event": "Incident reported via CrisisBridge Node"},
    {"time": "T+2m", "event": "AI Triage and Auto-Orchestration triggered"},
    {"time": "T+5m", "event": "Field responders confirmed arrival"},
    {"time": "T+15m", "event": "Incident containment verified and resolved"}
  ],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "bottlenecks": "<one observation about potential response delays or success points>"
}

Return ONLY JSON.
`

  try {
    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.2 }
    })

    const raw = response.text || '{}'
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(cleaned) as PostIncidentReport
  } catch (err) {
    console.error('PIR Generation failed:', err)
    return {
      summary: "Incident resolved successfully. High response coordination noted.",
      timeline: [{ time: "T+0m", event: "Initial report received" }],
      recommendations: ["Ensure regular equipment inspections", "Conduct staff drill for similar scenarios"]
    }
  }
}

export async function translateDescription(text: string): Promise<string> {
  const prompt = `
Translate the following emergency incident description to English. 
Return ONLY the English translation. No preamble, no quotes, no markdown.
If it is already in English, return it exactly as is.

Text to translate:
${text}
`;

  try {
    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.1 }
    })
    return response.text?.trim() || text;
  } catch (err) {
    console.error('Translation failed:', err)
    return text;
  }
}
