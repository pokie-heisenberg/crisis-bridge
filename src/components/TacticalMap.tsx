import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Incident } from '@/hooks/useIncidents';
import { Badge } from './ui/badge';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons based on severity
const createDangerIcon = () => L.divIcon({
  className: 'custom-icon',
  html: `<div class="w-4 h-4 bg-red-500 rounded-full animate-ping absolute opacity-75"></div><div class="w-4 h-4 bg-red-600 rounded-full border-2 border-slate-900 relative"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const createWarningIcon = () => L.divIcon({
    className: 'custom-icon',
    html: `<div class="w-4 h-4 bg-amber-500 rounded-full border-2 border-slate-900 absolute relative shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 16);
  }, [center, map]);
  return null;
}

// Pseudo-random coordinates generator anchored near Google HQ (since it's a Google sol challenge)
// Specifically around Mountain View
function getPseudoCoordsFromLocation(locationString: string): [number, number] {
  // Very simplistic hash of string to generate a predictable pseudo-coord
  let hash = 0;
  for (let i = 0; i < locationString.length; i++) {
     hash = locationString.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const baseLat = 37.4220656; // Googleplex
  const baseLng = -122.0840897;
  
  // Add a small offset based on the string hash (roughly within a few miles)
  const offsetLat = (hash % 100) / 10000;
  const offsetLng = ((hash / 10) % 100) / 10000;

  return [baseLat + offsetLat, baseLng + offsetLng];
}


export default function TacticalMap({ incidents }: { incidents: Incident[] }) {
  // Center roughly on Mountain View, CA
  const center: [number, number] = [37.4220656, -122.0840897]; 
  
  // Find the most recent active incident to center on, else default
  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');
  const latestCenter = activeIncidents.length > 0 
    ? (activeIncidents[0].latitude && activeIncidents[0].longitude 
        ? [activeIncidents[0].latitude, activeIncidents[0].longitude] as [number, number]
        : getPseudoCoordsFromLocation(activeIncidents[0].location))
    : center;

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-slate-800 relative shadow-inner z-0">
      <MapContainer 
        center={latestCenter} 
        zoom={15} 
        style={{ height: '100%', width: '100%', background: '#0b0f1a' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapController center={latestCenter} />
        
        {activeIncidents.map((incident) => {
          const coords = incident.latitude && incident.longitude 
            ? [incident.latitude, incident.longitude] as [number, number]
            : getPseudoCoordsFromLocation(incident.location);
          return (
            <Marker 
                key={incident.id} 
                position={coords}
                icon={incident.severity === 'CRITICAL' ? createDangerIcon() : createWarningIcon()}
            >
              <Popup className="tactical-popup">
                <div className="p-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant={incident.severity === 'CRITICAL' ? 'destructive' : 'default'} className="text-[9px]">
                            {incident.severity}
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-mono">#{incident.id.slice(0,6)}</span>
                    </div>
                    <div className="font-black italic text-sm">{incident.type}</div>
                    <div className="text-xs text-slate-400 mt-1">{incident.location}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Overlay to give it a "tactical screen" feel */}
      <div className="absolute inset-0 pointer-events-none border border-emerald-500/10 rounded-xl" style={{
        background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.1) 51%)',
        backgroundSize: '100% 4px'
      }} />
    </div>
  );
}
