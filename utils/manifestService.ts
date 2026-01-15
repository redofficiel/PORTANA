
import { Manifest, ContainerRow, AnalysisResult, LCLContainer, SpecialCargoContainer, ContainerError } from '../types';
import * as XLSX from 'xlsx';

/**
 * Validates the raw JSON input to ensure it adheres to the Manifest structure.
 */
export const validateManifestJson = (data: any): Manifest[] => {
  if (!Array.isArray(data)) {
    throw new Error("Format Invalide : L'élément racine doit être un tableau d'objets Manifeste.");
  }

  if (data.length === 0) {
    throw new Error("Format Invalide : Le tableau du manifeste est vide.");
  }

  // Check first item to see if it looks like a manifest
  const firstItem = data[0];
  if (!firstItem || typeof firstItem !== 'object') {
     throw new Error("Format Invalide : Les éléments du manifeste doivent être des objets.");
  }

  // Loose check for mandatory fields on the first item to fail fast
  if (!('connaissements' in firstItem) && !('numero_escale' in firstItem)) {
    throw new Error("Format Invalide : Champs clés manquants (numero_escale ou connaissements).");
  }

  return data as Manifest[];
};

/**
 * Flattens the hierarchical Manifest -> BL -> Container structure into a flat array.
 * Includes automatic detection of Dangerous Goods based on commodity description text.
 */
export const flattenManifestData = (manifests: Manifest[]): ContainerRow[] => {
  const rows: ContainerRow[] = [];
  
  // Regex to detect dangerous goods keywords in text
  // Matches "DGX", "DANGEROUS", "HAZ", "IMO" (case insensitive, whole words or distinct segments)
  const dgRegex = /\b(DGX|DANGEROUS|HAZ|IMO|HAZMAT)\b/i;

  manifests.forEach((manifest, mIdx) => {
    // Safety check for connaissements array
    const bls = Array.isArray(manifest.connaissements) ? manifest.connaissements : [];

    if (bls.length === 0) {
      console.warn(`Manifeste à l'index ${mIdx} (Escale: ${manifest.numero_escale}) sans connaissements.`);
    }

    bls.forEach((bl) => {
      // Safety check for conteneurs array
      const containers = Array.isArray(bl.conteneurs) ? bl.conteneurs : [];

      // Determine commodity description (support multiple field names)
      // Prioritize description_marchandise, then article.
      const commodity = bl.description_marchandise || bl.article || '';
      
      // Check if commodity implies dangerous goods
      const isTextDetectedIMDG = dgRegex.test(commodity);

      containers.forEach((cnt) => {
        // Refined size normalization logic
        let size = Number(cnt.taille_conteneur);
        if (isNaN(size)) {
            size = parseInt(String(cnt.taille_conteneur), 10);
        }
        if (isNaN(size)) {
            size = 0;
        }

        // Robust parsing for IMDG fields (handle numbers/strings/nulls)
        let rawImdgClass = cnt.classe_imdg !== undefined ? cnt.classe_imdg : (cnt as any).imdg_class;
        const rawUnCode = cnt.code_un !== undefined ? cnt.code_un : (cnt as any).un_number;

        // --- IMDG DETECTION LOGIC ---
        // If no explicit class/UN is provided, but text says "DGX", we force it.
        if (!rawImdgClass && !rawUnCode && isTextDetectedIMDG) {
            rawImdgClass = "DÉTECTÉ (DGX)";
        }

        const row: ContainerRow = {
          // Manifest Fields
          numero_escale: manifest.numero_escale || '',
          nom_navire: manifest.nom_navire || '',
          num_voyage: manifest.num_voyage || '',
          date_manifeste: manifest.date_manifeste || '',
          type_manifeste: manifest.type_manifeste || '',
          regime: manifest.regime || '',

          // BL Fields
          num_bl: bl.num_bl || '',
          port_chargement: bl.port_chargement || '',
          client_final: bl.client_final || '',
          nif_client_final: bl.nif_client_final || '',
          marchandise: commodity,

          // Container Fields
          num_conteneur: cnt.num_conteneur || 'INCONNU',
          taille_conteneur: size,
          code_iso: cnt.code_iso || '',
          indicateur_groupage: cnt.indicateur_groupage || '0',
          categorie: cnt.categorie || '',
          poids: Number(cnt.poids) || 0,
          statut: cnt.statut || '',

          // Special Cargo Fields (IMDG / Reefer)
          // Explicitly cast to string to handle numeric 1/0 in JSON safely
          indicateur_reefer: cnt.indicateur_reefer !== undefined ? String(cnt.indicateur_reefer) : '0',
          temperature: cnt.temperature ? String(cnt.temperature) : '',
          
          // IMDG: Convert to string if present (handles numbers like 3 or 9)
          classe_imdg: rawImdgClass ? String(rawImdgClass) : '',
          code_un: rawUnCode ? String(rawUnCode) : '',
        };

        rows.push(row);
      });
    });
  });

  return rows;
};

/**
 * Analyzes the flattened rows to produce unique container statistics and identify LCL, IMDG, Reefer, and Error containers.
 */
export const analyzeManifestData = (rows: ContainerRow[]): AnalysisResult => {
  // Map to track unique containers and their aggregated data
  const containerMap = new Map<string, {
    size: number;
    iso: string;
    reeferFlag: boolean;
    temp: string;
    imdgClass: string;
    unCode: string;
    commodity: string; // Store primary commodity for detection evidence
    bls: Map<string, { client: string, weight: number }>;
  }>();

  rows.forEach(row => {
    const contNum = row.num_conteneur;
    
    if (!containerMap.has(contNum)) {
      containerMap.set(contNum, {
        size: row.taille_conteneur,
        iso: row.code_iso,
        // Flags and special data are taken from the first occurrence, 
        // though typically they should be consistent across BLs for the same container.
        reeferFlag: row.indicateur_reefer === '1', 
        temp: row.temperature,
        imdgClass: row.classe_imdg,
        unCode: row.code_un,
        commodity: row.marchandise,
        bls: new Map()
      });
    }

    const entry = containerMap.get(contNum)!;
    
    // Accumulate Special Data if missing from previous rows for same container (merge logic)
    if (!entry.imdgClass && row.classe_imdg) entry.imdgClass = row.classe_imdg;
    if (!entry.unCode && row.code_un) entry.unCode = row.code_un;
    if (!entry.reeferFlag && row.indicateur_reefer === '1') entry.reeferFlag = true;
    if (!entry.temp && row.temperature) entry.temp = row.temperature;
    
    // Fallback commodity if first was empty
    if (!entry.commodity && row.marchandise) entry.commodity = row.marchandise;

    // Track unique BLs
    if (!entry.bls.has(row.num_bl)) {
      entry.bls.set(row.num_bl, {
        client: row.client_final,
        weight: row.poids
      });
    }
  });

  // Calculate Stats
  let totalUnique = 0;
  let c20 = 0;
  let c40 = 0;
  let c45 = 0;
  let cUnknown = 0;
  let fcl = 0;
  let lcl = 0;

  // Detailed Counters
  let rf20 = 0;
  let rf40 = 0;
  let im20 = 0;
  let im40 = 0;
  
  const lclList: LCLContainer[] = [];
  const imdgList: SpecialCargoContainer[] = [];
  const reeferList: SpecialCargoContainer[] = [];
  const errorList: ContainerError[] = [];

  containerMap.forEach((data, num) => {
    totalUnique++;

    // Size Stats
    if (data.size === 20) c20++;
    else if (data.size === 40) c40++;
    else if (data.size === 45) c45++;
    else cUnknown++;

    // 1. LCL Logic: Linked to > 1 distinct BL
    const blList = Array.from(data.bls.entries()).map(([num_bl, info]) => ({
      num_bl,
      client: info.client,
      weight: info.weight
    }));

    if (data.bls.size > 1) {
      lcl++;
      lclList.push({
        num_conteneur: num,
        taille_conteneur: data.size,
        bls: blList
      });
    } else {
      fcl++;
    }

    // 2. IMDG Logic
    // Check if either Class OR UN Code is present
    if (data.imdgClass || data.unCode) {
      // Stats Breakdown
      if (data.size === 20) im20++;
      if (data.size === 40 || data.size === 45) im40++; 
      
      imdgList.push({
        num_conteneur: num,
        taille_conteneur: data.size,
        code_iso: data.iso,
        bls: blList,
        classe_imdg: data.imdgClass,
        code_un: data.unCode,
        marchandise: data.commodity
      });
    }

    // 3. Reefer Logic
    const isReefer = data.reeferFlag || (data.iso && data.iso.toUpperCase().startsWith('R'));
    if (isReefer) {
      // Stats Breakdown
      if (data.size === 20) rf20++;
      if (data.size === 40 || data.size === 45) rf40++; 

      reeferList.push({
        num_conteneur: num,
        taille_conteneur: data.size,
        code_iso: data.iso,
        bls: blList,
        temperature: data.temp,
        is_active_reefer: data.reeferFlag,
        marchandise: data.commodity
      });
    }

    // 4. Error / Anomaly Logic
    const reasons: string[] = [];
    if (!data.iso || data.iso.trim() === '') reasons.push('Type ISO Manquant');
    if (data.size === 0) reasons.push('Taille Inconnue');
    if (!num || num === 'UNKNOWN' || num === 'INCONNU') reasons.push('Numéro Invalide');

    if (reasons.length > 0) {
      errorList.push({
        num_conteneur: num,
        taille_conteneur: data.size,
        code_iso: data.iso,
        bls: blList,
        reasons: reasons
      });
    }
  });

  // Sorting Lists (ascending by container number)
  const sortFn = (a: { num_conteneur: string }, b: { num_conteneur: string }) => 
    a.num_conteneur.localeCompare(b.num_conteneur);

  lclList.sort(sortFn);
  imdgList.sort(sortFn);
  reeferList.sort(sortFn);
  errorList.sort(sortFn);

  return {
    stats: {
      totalContainers: totalUnique,
      count20: c20,
      count40: c40,
      count45: c45,
      countLCL: lcl,
      countFCL: fcl,
      countUnknownSize: cUnknown,
      countIMDG: imdgList.length,
      countReefer: reeferList.length,
      countErrors: errorList.length,
      // Detailed
      countReefer20: rf20,
      countReefer40: rf40,
      countIMDG20: im20,
      countIMDG40: im40
    },
    lclContainers: lclList,
    imdgContainers: imdgList,
    reeferContainers: reeferList,
    errorContainers: errorList
  };
};

/**
 * Generates a unique ID for a vessel based on immutable properties.
 * Useful for preventing duplicates in history.
 */
export const generateVesselId = (manifest: Manifest): string => {
  // Use a combination of Ship Name, Voyage Number, and Arrival Number (Escale)
  const name = manifest.nom_navire || 'INCONNU';
  const voyage = manifest.num_voyage || 'INCONNU';
  const escale = manifest.numero_escale || 'INCONNU';
  return `${name}-${voyage}-${escale}`.replace(/\s+/g, '').toUpperCase();
};

// --- Export Helper Functions ---

const triggerDownload = (workbook: XLSX.WorkBook, filename: string) => {
  XLSX.writeFile(workbook, filename);
};

export const downloadXlsx = (rows: ContainerRow[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Données Manifeste");
  const cleanName = fileName.replace('.json', '') + '_Export_Complet.xlsx';
  triggerDownload(workbook, cleanName);
};

export const downloadLCLReport = (data: LCLContainer[], fileName: string) => {
  const rows = data.flatMap(c => 
    c.bls.map(bl => ({
      'N° Conteneur': c.num_conteneur,
      'Taille': c.taille_conteneur,
      'N° BL': bl.num_bl,
      'Réceptionnaire': bl.client,
      'Poids (Kg)': bl.weight
    }))
  );
  
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Conteneurs LCL");
  const cleanName = fileName.replace('.json', '') + '_Rapport_LCL.xlsx';
  triggerDownload(workbook, cleanName);
};

export const downloadSpecialCargoReport = (data: SpecialCargoContainer[], type: 'IMDG' | 'REEFER', fileName: string) => {
  const rows = data.flatMap(c => 
    c.bls.map(bl => {
      const base = {
        'N° Conteneur': c.num_conteneur,
        'Taille': c.taille_conteneur,
        'ISO': c.code_iso,
        'N° BL': bl.num_bl,
        'Réceptionnaire': bl.client,
        'Poids (Kg)': bl.weight,
        'Marchandise': c.marchandise || '' // Added description to export
      };
      
      if (type === 'IMDG') {
        return { ...base, 'Classe IMDG': c.classe_imdg, 'Code UN': c.code_un };
      } else {
        return { ...base, 'Température': c.temperature, 'Indicateur Reefer': c.is_active_reefer ? 'OUI' : 'NON' };
      }
    })
  );

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Conteneurs ${type}`);
  const cleanName = fileName.replace('.json', '') + `_Rapport_${type}.xlsx`;
  triggerDownload(workbook, cleanName);
};

export const downloadErrorReport = (data: ContainerError[], fileName: string) => {
  const rows = data.flatMap(c => 
    c.bls.map(bl => ({
      'N° Conteneur': c.num_conteneur,
      'Taille Déclarée': c.taille_conteneur,
      'ISO': c.code_iso,
      'Erreurs': c.reasons.join(', '),
      'N° BL': bl.num_bl,
      'Réceptionnaire': bl.client,
      'Poids (Kg)': bl.weight
    }))
  );

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Anomalies");
  const cleanName = fileName.replace('.json', '') + '_Rapport_Anomalies.xlsx';
  triggerDownload(workbook, cleanName);
};
