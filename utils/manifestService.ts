import { Manifest, ContainerRow, AnalysisResult, LCLContainer, SpecialCargoContainer } from '../types';
import * as XLSX from 'xlsx';

/**
 * Validates the raw JSON input to ensure it adheres to the Manifest structure.
 */
export const validateManifestJson = (data: any): Manifest[] => {
  if (!Array.isArray(data)) {
    throw new Error("Invalid Format: Root element must be an array of Manifest objects.");
  }

  if (data.length === 0) {
    throw new Error("Invalid Format: The manifest array is empty.");
  }

  // Check first item to see if it looks like a manifest
  const firstItem = data[0];
  if (!firstItem || typeof firstItem !== 'object') {
     throw new Error("Invalid Format: Manifest items must be objects.");
  }

  // Loose check for mandatory fields on the first item to fail fast
  if (!('connaissements' in firstItem) && !('numero_escale' in firstItem)) {
    throw new Error("Invalid Format: Missing key manifest fields (numero_escale or connaissements).");
  }

  return data as Manifest[];
};

/**
 * Flattens the hierarchical Manifest -> BL -> Container structure into a flat array.
 */
export const flattenManifestData = (manifests: Manifest[]): ContainerRow[] => {
  const rows: ContainerRow[] = [];

  manifests.forEach((manifest, mIdx) => {
    // Safety check for connaissements array
    const bls = Array.isArray(manifest.connaissements) ? manifest.connaissements : [];

    if (bls.length === 0) {
      console.warn(`Manifest at index ${mIdx} (Escale: ${manifest.numero_escale}) has no BLs.`);
    }

    bls.forEach((bl) => {
      // Safety check for conteneurs array
      const containers = Array.isArray(bl.conteneurs) ? bl.conteneurs : [];

      containers.forEach((cnt) => {
        // Refined size normalization logic
        let size = Number(cnt.taille_conteneur);
        if (isNaN(size)) {
            size = parseInt(String(cnt.taille_conteneur), 10);
        }
        if (isNaN(size)) {
            size = 0;
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

          // Container Fields
          num_conteneur: cnt.num_conteneur || 'UNKNOWN',
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
          // Check common IMDG keys
          classe_imdg: cnt.classe_imdg || (cnt as any).imdg_class || '',
          code_un: cnt.code_un || (cnt as any).un_number || '',
        };

        rows.push(row);
      });
    });
  });

  return rows;
};

/**
 * Analyzes the flattened rows to produce unique container statistics and identify LCL, IMDG, and Reefer containers.
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
        bls: new Map()
      });
    }

    const entry = containerMap.get(contNum)!;
    
    // Accumulate Special Data if missing from previous rows for same container (merge logic)
    if (!entry.imdgClass && row.classe_imdg) entry.imdgClass = row.classe_imdg;
    if (!entry.unCode && row.code_un) entry.unCode = row.code_un;
    if (!entry.reeferFlag && row.indicateur_reefer === '1') entry.reeferFlag = true;
    if (!entry.temp && row.temperature) entry.temp = row.temperature;

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
  
  const lclList: LCLContainer[] = [];
  const imdgList: SpecialCargoContainer[] = [];
  const reeferList: SpecialCargoContainer[] = [];

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
    // Has IMDG class OR UN Code OR explicitly marked
    if (data.imdgClass || data.unCode) {
      imdgList.push({
        num_conteneur: num,
        taille_conteneur: data.size,
        code_iso: data.iso,
        bls: blList,
        classe_imdg: data.imdgClass,
        code_un: data.unCode
      });
    }

    // 3. Reefer Logic
    // Flag is '1' OR ISO code starts with 'R'
    const isReefer = data.reeferFlag || (data.iso && data.iso.toUpperCase().startsWith('R'));
    if (isReefer) {
      reeferList.push({
        num_conteneur: num,
        taille_conteneur: data.size,
        code_iso: data.iso,
        bls: blList,
        temperature: data.temp,
        is_active_reefer: data.reeferFlag // For "Power Required" check
      });
    }
  });

  // Sorting Lists (ascending by container number)
  const sortFn = (a: { num_conteneur: string }, b: { num_conteneur: string }) => 
    a.num_conteneur.localeCompare(b.num_conteneur);

  lclList.sort(sortFn);
  imdgList.sort(sortFn);
  reeferList.sort(sortFn);

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
      countReefer: reeferList.length
    },
    lclContainers: lclList,
    imdgContainers: imdgList,
    reeferContainers: reeferList
  };
};

/**
 * Generates and triggers a download of the XLSX file.
 */
export const downloadXlsx = (rows: ContainerRow[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Manifest Data");
  
  // Clean filename
  const cleanName = fileName.replace('.json', '') + '_Processed.xlsx';
  XLSX.writeFile(workbook, cleanName);
};