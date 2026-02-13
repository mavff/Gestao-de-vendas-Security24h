import { KitCategoria, KitPreset, Marca } from '../types';

export const KIT_CATEGORIA_LABELS: Record<KitCategoria, string> = {
  alarme_residencial: 'Alarme Residencial',
  alarme_comercial: 'Alarme Comercial',
  alarme_cftv: 'Alarme + CFTV',
  cftv_analogico: 'CFTV Analógico',
  cftv_ip: 'CFTV IP',
  cftv_inteligente: 'CFTV Inteligente',
};

export const kitPresets: KitPreset[] = [
  // ── Intelbras ──────────────────────────────────────
  {
    id: 'KP-INT-01',
    nome: 'Alarme Residencial',
    descricao: 'Sensores internos, externos e magnéticos com central e comunicador.',
    categoria: 'alarme_residencial',
    marca: 'Intelbras',
    itens: [
      { equipmentId: 'E9', quantidade: 2 },   // Sensor externo IVP 5002
      { equipmentId: 'E2', quantidade: 3 },   // Sensor interno IVP 3000
      { equipmentId: 'E6', quantidade: 2 },   // Sensor porta XAS 4010
      { equipmentId: 'E3', quantidade: 1 },   // Central AMT 4010
      { equipmentId: 'E14', quantidade: 1 },  // Comunicador XE 4000
    ],
  },
  {
    id: 'KP-INT-02',
    nome: 'Alarme + CFTV Loja',
    descricao: 'Alarme completo com 4 câmeras dome e DVR para comércios.',
    categoria: 'alarme_cftv',
    marca: 'Intelbras',
    itens: [
      { equipmentId: 'E9', quantidade: 2 },
      { equipmentId: 'E2', quantidade: 2 },
      { equipmentId: 'E6', quantidade: 2 },
      { equipmentId: 'E1', quantidade: 4 },   // Câmera Dome VHD 1220
      { equipmentId: 'E7', quantidade: 1 },   // DVR MHDX 1008
      { equipmentId: 'E3', quantidade: 1 },
      { equipmentId: 'E14', quantidade: 1 },
      { equipmentId: 'E15', quantidade: 1 },  // Fonte VFP 1210
      { equipmentId: 'E8', quantidade: 1 },   // Cabo coaxial 100m
    ],
  },
  {
    id: 'KP-INT-03',
    nome: 'CFTV Analógico 4 Câmeras',
    descricao: 'DVR 8 canais com 4 câmeras dome Full HD e acessórios.',
    categoria: 'cftv_analogico',
    marca: 'Intelbras',
    itens: [
      { equipmentId: 'E1', quantidade: 4 },
      { equipmentId: 'E7', quantidade: 1 },
      { equipmentId: 'E15', quantidade: 1 },
      { equipmentId: 'E8', quantidade: 1 },
    ],
  },
  {
    id: 'KP-INT-04',
    nome: 'CFTV IP 4 Câmeras',
    descricao: 'NVR com 4 câmeras IP bullet 2MP via rede PoE.',
    categoria: 'cftv_ip',
    marca: 'Intelbras',
    itens: [
      { equipmentId: 'E5', quantidade: 4 },   // Câmera IP VIP 1230
      { equipmentId: 'E13', quantidade: 1 },  // NVR NVD 1308
      { equipmentId: 'E30', quantidade: 1 },  // Cabo UTP 100m
    ],
  },
  {
    id: 'KP-INT-05',
    nome: 'CFTV Inteligente (IA)',
    descricao: '2 câmeras com IA + 2 câmeras IP auxiliares e NVR.',
    categoria: 'cftv_inteligente',
    marca: 'Intelbras',
    itens: [
      { equipmentId: 'E12', quantidade: 2 },  // Câmera IA VIP 7230
      { equipmentId: 'E5', quantidade: 2 },
      { equipmentId: 'E13', quantidade: 1 },
      { equipmentId: 'E30', quantidade: 1 },
    ],
  },

  // ── Hikvision ──────────────────────────────────────
  {
    id: 'KP-HIK-01',
    nome: 'Alarme Residencial',
    descricao: 'Hub AX PRO wireless com sensores PIR e magnéticos.',
    categoria: 'alarme_residencial',
    marca: 'Hikvision',
    itens: [
      { equipmentId: 'E20', quantidade: 2 },  // Sensor externo PDC15
      { equipmentId: 'E21', quantidade: 3 },  // Sensor interno PD2
      { equipmentId: 'E22', quantidade: 2 },  // Sensor magnético PDMC
      { equipmentId: 'E23', quantidade: 1 },  // Hub AX PRO PWA96
    ],
  },
  {
    id: 'KP-HIK-02',
    nome: 'Alarme + CFTV',
    descricao: 'Alarme wireless + 4 câmeras Turbo HD com DVR.',
    categoria: 'alarme_cftv',
    marca: 'Hikvision',
    itens: [
      { equipmentId: 'E20', quantidade: 2 },
      { equipmentId: 'E21', quantidade: 2 },
      { equipmentId: 'E22', quantidade: 2 },
      { equipmentId: 'E16', quantidade: 4 },  // Câmera Turbo HD
      { equipmentId: 'E19', quantidade: 1 },  // DVR 5MP
      { equipmentId: 'E23', quantidade: 1 },
    ],
  },
  {
    id: 'KP-HIK-03',
    nome: 'CFTV Turbo HD 4 Câmeras',
    descricao: 'DVR 5MP com 4 câmeras bullet Turbo HD.',
    categoria: 'cftv_analogico',
    marca: 'Hikvision',
    itens: [
      { equipmentId: 'E16', quantidade: 4 },
      { equipmentId: 'E19', quantidade: 1 },
    ],
  },
  {
    id: 'KP-HIK-04',
    nome: 'CFTV IP ColorVu',
    descricao: '4 câmeras IP ColorVu com mic integrado e DVR.',
    categoria: 'cftv_ip',
    marca: 'Hikvision',
    itens: [
      { equipmentId: 'E17', quantidade: 4 },  // Câmera IP ColorVu
      { equipmentId: 'E19', quantidade: 1 },
      { equipmentId: 'E30', quantidade: 1 },
    ],
  },
  {
    id: 'KP-HIK-05',
    nome: 'CFTV Inteligente AcuSense',
    descricao: '2 câmeras AcuSense panorâmicas + 2 câmeras IP e DVR.',
    categoria: 'cftv_inteligente',
    marca: 'Hikvision',
    itens: [
      { equipmentId: 'E18', quantidade: 2 },  // Câmera IA AcuSense
      { equipmentId: 'E17', quantidade: 2 },
      { equipmentId: 'E19', quantidade: 1 },
      { equipmentId: 'E30', quantidade: 1 },
    ],
  },

  // ── DSC ────────────────────────────────────────────
  {
    id: 'KP-DSC-01',
    nome: 'Alarme Residencial',
    descricao: 'Central PowerSeries Neo com sensores wireless e comunicador 4G.',
    categoria: 'alarme_residencial',
    marca: 'DSC',
    itens: [
      { equipmentId: 'E24', quantidade: 2 },  // Sensor externo LC-100
      { equipmentId: 'E25', quantidade: 3 },  // Sensor interno LC-104
      { equipmentId: 'E26', quantidade: 2 },  // Sensor magnético DW4975
      { equipmentId: 'E27', quantidade: 1 },  // Central HS2032 Neo
      { equipmentId: 'E28', quantidade: 1 },  // Comunicador TL405LE
    ],
  },
  {
    id: 'KP-DSC-02',
    nome: 'Alarme Comercial',
    descricao: 'Cobertura ampliada para comércios com 12 sensores e central Neo.',
    categoria: 'alarme_comercial',
    marca: 'DSC',
    itens: [
      { equipmentId: 'E24', quantidade: 4 },
      { equipmentId: 'E25', quantidade: 4 },
      { equipmentId: 'E26', quantidade: 4 },
      { equipmentId: 'E27', quantidade: 1 },
      { equipmentId: 'E28', quantidade: 1 },
    ],
  },
];

export function getPresetsForMarca(marca: Marca): KitPreset[] {
  return kitPresets.filter((k) => k.marca === marca);
}
