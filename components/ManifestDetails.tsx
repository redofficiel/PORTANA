
import React from 'react';
import { Manifest } from '../types';
import { 
  Ship, Hash, MapPin, FileText, Building2, Anchor, 
  Package, Calendar, User, Info
} from 'lucide-react';

interface ManifestDetailsProps {
  data: Manifest;
}

interface DetailItemProps {
    label: string;
    value?: string;
    subValue?: string;
    icon: React.ElementType;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, subValue, icon: Icon }) => (
  <div className="flex items-center gap-3 p-3">
    <div className="p-2 rounded-lg bg-slate-50 text-slate-400 shrink-0">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-slate-800 truncate" title={value || ""}>
        {value || "—"}
      </p>
      {subValue && (
        <p className="text-xs text-slate-500 font-mono truncate" title={subValue}>
          {subValue}
        </p>
      )}
    </div>
  </div>
);

export const ManifestDetails: React.FC<ManifestDetailsProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
        <Info className="h-4 w-4 text-slate-400" />
        <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Référence Navire & Voyage</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-6 p-4">
        {/* Column 1: Vessel */}
        <div className="space-y-1 border-r border-slate-100 last:border-0 pr-4">
            <DetailItem 
                label="Nom du Navire" 
                value={data.nom_navire} 
                subValue={data.call_sign}
                icon={Ship} 
            />
            <DetailItem 
                label="IMO Navire" 
                value={data.imo_navire} 
                icon={Hash} 
            />
        </div>
        
        {/* Column 2: Voyage */}
        <div className="space-y-1 border-r border-slate-100 last:border-0 pr-4">
            <DetailItem 
                label="Référence Escale" 
                value={data.numero_escale} 
                icon={MapPin} 
            />
            <DetailItem 
                label="N° Voyage / Gros" 
                value={data.num_voyage} 
                subValue={data.num_gros}
                icon={FileText} 
            />
        </div>

        {/* Column 3: Operator */}
        <div className="space-y-1 border-r border-slate-100 last:border-0 pr-4">
            <DetailItem 
                label="Consignataire" 
                value={data.consignataire} 
                icon={Building2} 
            />
            <DetailItem 
                label="Régime Douanier" 
                value={data.regime} 
                icon={Anchor} 
            />
        </div>

        {/* Column 4: Date & Type */}
        <div className="space-y-1 pr-4">
            <DetailItem 
                label="Type Manifeste" 
                value={data.type_manifeste} 
                icon={Package} 
            />
            <DetailItem 
                label="Date Manifeste" 
                value={data.date_manifeste} 
                icon={Calendar} 
            />
        </div>
      </div>
    </div>
  );
};
