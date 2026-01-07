
export interface Container {
  num_conteneur: string;
  taille_conteneur: number | string; // Can come in as string in some bad JSONs, we handle it
  code_iso?: string;
  indicateur_groupage?: string; // "0" or "1"
  categorie?: string;
  indicateur_reefer?: string;
  poids?: number;
  tare?: number;
  statut?: string;
  // IMDG Fields
  classe_imdg?: string;
  code_un?: string;
  dangerous_goods?: boolean;
  // Reefer Fields
  temperature?: string | number;
}

export interface Connaissement {
  num_bl: string;
  article?: string;
  port_chargement?: string;
  client_final?: string;
  nif_client_final?: string;
  poids_brute?: number;
  nombre_tcs?: number;
  conteneurs: Container[];
  roulants?: any[]; // Optional, to be ignored
}

export interface Manifest {
  numero_escale: string;
  consignataire?: string;
  code_consignataire?: string;
  nom_navire?: string;
  imo_navire?: string;
  call_sign?: string;
  num_voyage?: string;
  num_gros?: string;
  date_manifeste?: string;
  lieu_livraison?: string;
  manutentionnaire?: string;
  regime?: string;
  type_manifeste?: string;
  connaissements: Connaissement[];
}

// The flattened structure for XLSX and Analysis
export interface ContainerRow {
  // Manifest Level
  numero_escale: string;
  nom_navire: string;
  num_voyage: string;
  date_manifeste: string;
  type_manifeste: string;
  regime: string;

  // BL Level
  num_bl: string;
  port_chargement: string;
  client_final: string;
  nif_client_final: string;

  // Container Level
  num_conteneur: string;
  taille_conteneur: number; // Normalized to number
  code_iso: string;
  indicateur_groupage: string;
  categorie: string;
  poids: number;
  statut: string;
  
  // Special Cargo Fields
  indicateur_reefer: string;
  temperature: string;
  classe_imdg: string;
  code_un: string;
}

export interface AnalyticsStats {
  totalContainers: number; // Unique physical containers
  count20: number;
  count40: number;
  count45: number;
  countLCL: number; // Multi-BL containers
  countFCL: number; // Single-BL containers
  countUnknownSize: number;
  countIMDG: number;
  countReefer: number;
  countErrors: number; // Data quality errors
}

// Analysis Structures
export interface BLInfo {
  num_bl: string;
  client: string;
  weight?: number;
}

export interface LCLContainer {
  num_conteneur: string;
  taille_conteneur: number;
  bls: BLInfo[];
}

export interface SpecialCargoContainer {
  num_conteneur: string;
  taille_conteneur: number;
  code_iso: string;
  bls: BLInfo[];
  // IMDG specific
  classe_imdg?: string;
  code_un?: string;
  // Reefer specific
  temperature?: string;
  is_active_reefer?: boolean; // Derived from flag
}

export interface ContainerError {
  num_conteneur: string;
  taille_conteneur: number;
  code_iso: string;
  bls: BLInfo[];
  reasons: string[]; // List of what's wrong (e.g. "Missing ISO", "Unknown Size")
}

export interface AnalysisResult {
  stats: AnalyticsStats;
  lclContainers: LCLContainer[];
  imdgContainers: SpecialCargoContainer[];
  reeferContainers: SpecialCargoContainer[];
  errorContainers: ContainerError[];
}
