import React, { useState } from 'react';
import { Report, IssueCluster } from '../types';
import { MapPin, Navigation, Layers, ShieldCheck, ZoomIn, ZoomOut, Eye } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';

interface MapProps {
  reports?: Report[];
  clusters?: IssueCluster[];
  selectedReportId?: string;
  onSelectReport?: (report: Report) => void;
  isPickerMode?: boolean;
  pickerCoords?: { latitude: number; longitude: number };
  onPickCoords?: (coords: { latitude: number; longitude: number; address?: string }) => void;
  isPublicMode?: boolean;
  heightClass?: string;
}

export const InteractiveMap: React.FC<MapProps> = ({
  reports = [],
  clusters = [],
  selectedReportId,
  onSelectReport,
  isPickerMode = false,
  pickerCoords = { latitude: 28.6139, longitude: 77.209 },
  onPickCoords,
  isPublicMode = false,
  heightClass = 'h-[500px]',
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [activePin, setActivePin] = useState<Report | null>(null);

  // Center coordinate reference: Central Ward 14 (Lat: 28.6150, Lon: 77.2100)
  const centerLat = 28.615;
  const centerLon = 77.21;

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (activeCategoryFilter === 'all') return true;
    return r.category === activeCategoryFilter;
  });

  // Only plot reports with real, valid coordinates
  const mappedReports = filteredReports.filter(
    (r) =>
      r.location &&
      typeof r.location.latitude === 'number' &&
      typeof r.location.longitude === 'number' &&
      !isNaN(r.location.latitude) &&
      !isNaN(r.location.longitude)
  );

  const unmappedCount = filteredReports.length - mappedReports.length;

  // Convert lat/lon into container coordinate percentage (approx projection for local ward scale)
  const getCoordinates = (lat: number, lon: number) => {
    const latSpan = 0.025; // ~2.7 km span
    const lonSpan = 0.025;

    // Invert lat for Y axis (higher lat is top)
    const yPct = 50 - ((lat - centerLat) / latSpan) * 100 * zoomLevel;
    const xPct = 50 + ((lon - centerLon) / lonSpan) * 100 * zoomLevel;

    return {
      x: Math.max(5, Math.min(95, xPct)),
      y: Math.max(5, Math.min(95, yPct)),
    };
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPickerMode || !onPickCoords) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width; // 0 to 1
    const clickY = (e.clientY - rect.top) / rect.height; // 0 to 1

    const latSpan = 0.025 / zoomLevel;
    const lonSpan = 0.025 / zoomLevel;

    const newLat = centerLat + (0.5 - clickY) * latSpan;
    const newLon = centerLon + (clickX - 0.5) * lonSpan;

    onPickCoords({
      latitude: Number(newLat.toFixed(5)),
      longitude: Number(newLon.toFixed(5)),
      address: `Ward 14 Pinpoint (${newLat.toFixed(4)}° N, ${newLon.toFixed(4)}° E)`,
    });
  };

  return (
    <div className={`relative w-full ${heightClass} bg-[#E2E8F0] rounded-xl overflow-hidden border border-slate-300 shadow-inner select-none`}>
      {/* Map Graphic Layer (Realistic Municipal Grid Layout) */}
      <div
        className="absolute inset-0 cursor-crosshair transition-transform duration-200"
        onClick={handleMapClick}
        style={{
          background: `
            radial-gradient(circle at 50% 50%, #EDF2F7 0%, #E2E8F0 100%),
            linear-gradient(rgba(148, 163, 184, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      >
        {/* Render simulated road corridors and landmarks */}
        <svg className="w-full h-full opacity-60 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Main Road Corridor (MG Road) */}
          <line x1="10%" y1="65%" x2="90%" y2="40%" stroke="#CBD5E1" strokeWidth="24" strokeLinecap="round" />
          <line x1="10%" y1="65%" x2="90%" y2="40%" stroke="#94A3B8" strokeWidth="2" strokeDasharray="6 6" />
          {/* Cross Avenue */}
          <line x1="45%" y1="10%" x2="55%" y2="90%" stroke="#CBD5E1" strokeWidth="18" strokeLinecap="round" />
          {/* Railway line */}
          <line x1="20%" y1="15%" x2="85%" y2="25%" stroke="#64748B" strokeWidth="3" strokeDasharray="3 3" />
          {/* Sector zones */}
          <rect x="20%" y="45%" width="22%" height="18%" rx="8" fill="#F1F5F9" opacity="0.6" stroke="#CBD5E1" />
          <text x="31%" y="54%" fontSize="11" fill="#64748B" textAnchor="middle" fontWeight="bold">
            Ward 14 Transit Hub & Depot
          </text>

          <rect x="62%" y="30%" width="24%" height="22%" rx="8" fill="#F1F5F9" opacity="0.6" stroke="#CBD5E1" />
          <text x="74%" y="42%" fontSize="11" fill="#64748B" textAnchor="middle" fontWeight="bold">
            Sector 4 Municipal Mandi
          </text>
        </svg>

        {/* Cluster Highlight Regions */}
        {clusters.map((cluster) => {
          const coords = getCoordinates(
            cluster.centerLocation.latitude,
            cluster.centerLocation.longitude
          );
          return (
            <div
              key={cluster.id}
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
            >
              <div className="w-24 h-24 rounded-full bg-[#148F87]/15 border-2 border-[#148F87] border-dashed animate-pulse flex items-center justify-center">
                <span className="bg-[#148F87] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                  {cluster.reportCount} Reports Clustered
                </span>
              </div>
            </div>
          );
        })}

        {/* Picker Mode Selected Pin */}
        {isPickerMode && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-full transition-all duration-150 z-30"
            style={{
              left: `${getCoordinates(pickerCoords.latitude, pickerCoords.longitude).x}%`,
              top: `${getCoordinates(pickerCoords.latitude, pickerCoords.longitude).y}%`,
            }}
          >
            <div className="flex flex-col items-center">
              <div className="bg-[#0B1F2A] text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-lg whitespace-nowrap mb-1">
                Selected Coordinates
              </div>
              <MapPin className="w-8 h-8 text-[#148F87] drop-shadow-md fill-current" />
            </div>
          </div>
        )}

        {/* Report Markers: only for reports with verified or provided coordinates */}
        {!isPickerMode &&
          mappedReports.map((report) => {
            const lat = report.location.latitude;
            const lon = report.location.longitude;
            const coords = getCoordinates(lat, lon);
            const isSelected = selectedReportId === report.id || activePin?.id === report.id;
            const level = report.priorityScore?.level || (report as any)?.priority_score?.level;
            const isCritical = level === 'CRITICAL';
            const isHigh = level === 'HIGH';

            return (
              <div
                key={report.id}
                className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer z-20 group"
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePin(report);
                  if (onSelectReport) onSelectReport(report);
                }}
              >
                <div
                  className={`relative flex items-center justify-center p-1 rounded-full transition-all ${
                    isSelected
                      ? 'scale-125 ring-4 ring-[#148F87]'
                      : 'hover:scale-115'
                  } ${
                    isCritical
                      ? 'bg-rose-600 text-white shadow-lg'
                      : isHigh
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-[#148F87] text-white shadow-md'
                  }`}
                >
                  <MapPin className="w-5 h-5 fill-current" />
                  {report.clusterId && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-1 ring-white" />
                  )}
                </div>

                {/* Compact tooltip */}
                <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-[10px] py-0.5 px-2 rounded-md whitespace-nowrap shadow-md z-30">
                  {report.id}: {report.title.slice(0, 24)}...
                </div>
              </div>
            );
          })}
      </div>

      {/* Floating Controls Top-Right */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-30">
        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.25))}
          className="p-2 bg-white text-slate-700 rounded-lg shadow-md hover:bg-slate-50 border border-slate-200"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
          className="p-2 bg-white text-slate-700 rounded-lg shadow-md hover:bg-slate-50 border border-slate-200"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Top Left Header / Category Filter */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-30 max-w-[80%]">
        <div className="bg-white/95 backdrop-blur-xs px-3 py-1 rounded-lg border border-slate-200 shadow-md text-xs font-semibold text-navy-900 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#148F87]" />
          <span>{isPublicMode ? 'Public Ward 14 Safety View' : 'Ward 14 Spatial Grid'}</span>
        </div>

        {unmappedCount > 0 && !isPickerMode && (
          <div className="bg-amber-50/95 text-amber-900 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-amber-200 shadow-sm">
            {unmappedCount} grievance(s) without GPS coordinates omitted from map
          </div>
        )}

        {!isPickerMode && (
          <div className="bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-slate-200 shadow-md flex items-center gap-1 overflow-x-auto text-xs">
            {['all', 'pothole', 'garbage', 'waterlogging', 'streetlight'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-2 py-0.5 rounded-md font-medium text-[11px] capitalize transition-colors ${
                  activeCategoryFilter === cat
                    ? 'bg-[#148F87] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Pin Details Popup Overlay */}
      {activePin && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-40 animate-in fade-in duration-150">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span className="font-mono text-xs font-bold text-slate-400 mr-2">
                {activePin.id}
              </span>
              <StatusBadge status={activePin.status} size="sm" />
            </div>
            <button
              onClick={() => setActivePin(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>

          <h4 className="text-sm font-bold text-navy-900 mb-1 line-clamp-1">{activePin.title}</h4>
          <p className="text-xs text-slate-600 mb-2 line-clamp-2">{activePin.description}</p>

          <div className="flex items-center gap-2 mb-3">
            <CategoryBadge category={activePin.category} />
            <PriorityBadge level={activePin.priorityScore.level} score={activePin.priorityScore.totalScore} showScore />
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500 truncate max-w-[200px]">
              📍 {activePin.location.address}
            </span>
            {onSelectReport && (
              <button
                onClick={() => onSelectReport(activePin)}
                className="text-[#148F87] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Details</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer Indicator in Picker Mode */}
      {isPickerMode && (
        <div className="absolute bottom-3 left-3 bg-[#0B1F2A]/90 text-white px-3 py-1.5 rounded-lg text-xs backdrop-blur-xs flex items-center gap-2 z-30">
          <Navigation className="w-3.5 h-3.5 text-teal-400" />
          <span>Click anywhere on the map to set the problem location pin</span>
        </div>
      )}
    </div>
  );
};
