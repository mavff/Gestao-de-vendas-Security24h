export type VendedorPerformance = {
  vendedor: string;
  produtosVendidos: number;       // R$ valor total de produtos
  mensalidadeMonitoramento: number;
  mensalidadeLocacao: number;
  mensalidadeTecnico: number;
  mensalidadeOutros: number;
  periodo: string;                // 'YYYY-MM'
};

export const mockPerformance: VendedorPerformance[] = [
  // Janeiro 2026
  { vendedor: 'Ana Lima',      produtosVendidos: 18400, mensalidadeMonitoramento: 6200, mensalidadeLocacao: 2800, mensalidadeTecnico: 1100, mensalidadeOutros: 400, periodo: '2026-01' },
  { vendedor: 'Carlos Souza',  produtosVendidos: 12700, mensalidadeMonitoramento: 4800, mensalidadeLocacao: 1900, mensalidadeTecnico:  850, mensalidadeOutros: 250, periodo: '2026-01' },
  { vendedor: 'Renata Dias',   produtosVendidos: 21300, mensalidadeMonitoramento: 7400, mensalidadeLocacao: 3200, mensalidadeTecnico: 1500, mensalidadeOutros: 600, periodo: '2026-01' },
  { vendedor: 'Felipe Moura',  produtosVendidos:  9600, mensalidadeMonitoramento: 3100, mensalidadeLocacao: 1200, mensalidadeTecnico:  600, mensalidadeOutros: 150, periodo: '2026-01' },
  { vendedor: 'Juliana Costa', produtosVendidos: 15800, mensalidadeMonitoramento: 5500, mensalidadeLocacao: 2400, mensalidadeTecnico:  980, mensalidadeOutros: 320, periodo: '2026-01' },

  // Fevereiro 2026
  { vendedor: 'Ana Lima',      produtosVendidos: 22100, mensalidadeMonitoramento: 7800, mensalidadeLocacao: 3400, mensalidadeTecnico: 1300, mensalidadeOutros: 500, periodo: '2026-02' },
  { vendedor: 'Carlos Souza',  produtosVendidos: 14300, mensalidadeMonitoramento: 5200, mensalidadeLocacao: 2100, mensalidadeTecnico:  950, mensalidadeOutros: 280, periodo: '2026-02' },
  { vendedor: 'Renata Dias',   produtosVendidos: 19800, mensalidadeMonitoramento: 6900, mensalidadeLocacao: 2900, mensalidadeTecnico: 1400, mensalidadeOutros: 550, periodo: '2026-02' },
  { vendedor: 'Felipe Moura',  produtosVendidos: 11200, mensalidadeMonitoramento: 3800, mensalidadeLocacao: 1500, mensalidadeTecnico:  720, mensalidadeOutros: 180, periodo: '2026-02' },
  { vendedor: 'Juliana Costa', produtosVendidos: 17500, mensalidadeMonitoramento: 6100, mensalidadeLocacao: 2700, mensalidadeTecnico: 1100, mensalidadeOutros: 360, periodo: '2026-02' },

  // Dezembro 2025
  { vendedor: 'Ana Lima',      produtosVendidos: 16900, mensalidadeMonitoramento: 5800, mensalidadeLocacao: 2500, mensalidadeTecnico: 1050, mensalidadeOutros: 380, periodo: '2025-12' },
  { vendedor: 'Carlos Souza',  produtosVendidos: 10800, mensalidadeMonitoramento: 4100, mensalidadeLocacao: 1600, mensalidadeTecnico:  780, mensalidadeOutros: 210, periodo: '2025-12' },
  { vendedor: 'Renata Dias',   produtosVendidos: 24600, mensalidadeMonitoramento: 8200, mensalidadeLocacao: 3700, mensalidadeTecnico: 1700, mensalidadeOutros: 680, periodo: '2025-12' },
  { vendedor: 'Felipe Moura',  produtosVendidos:  8400, mensalidadeMonitoramento: 2700, mensalidadeLocacao: 1050, mensalidadeTecnico:  520, mensalidadeOutros: 130, periodo: '2025-12' },
  { vendedor: 'Juliana Costa', produtosVendidos: 13200, mensalidadeMonitoramento: 4600, mensalidadeLocacao: 2000, mensalidadeTecnico:  820, mensalidadeOutros: 270, periodo: '2025-12' },
];

/** Agrega os dados de múltiplos meses por vendedor */
export function aggregateByVendedor(data: VendedorPerformance[]): VendedorPerformance[] {
  const map = new Map<string, VendedorPerformance>();
  for (const row of data) {
    const existing = map.get(row.vendedor);
    if (!existing) {
      map.set(row.vendedor, { ...row, periodo: 'aggregated' });
    } else {
      existing.produtosVendidos += row.produtosVendidos;
      existing.mensalidadeMonitoramento += row.mensalidadeMonitoramento;
      existing.mensalidadeLocacao += row.mensalidadeLocacao;
      existing.mensalidadeTecnico += row.mensalidadeTecnico;
      existing.mensalidadeOutros += row.mensalidadeOutros;
    }
  }
  return Array.from(map.values());
}

/** Filtra os dados pelo preset de período selecionado */
export function filterByPreset(data: VendedorPerformance[], preset: PerformancePreset): VendedorPerformance[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-based

  function monthDiff(periodo: string): number {
    const [y, m] = periodo.split('-').map(Number);
    return (currentYear - y) * 12 + (currentMonth - m);
  }

  switch (preset) {
    case 'mes_atual':
      return data.filter((d) => monthDiff(d.periodo) === 0);
    case '3m':
      return data.filter((d) => monthDiff(d.periodo) < 3);
    case '6m':
      return data.filter((d) => monthDiff(d.periodo) < 6);
    case '1a':
      return data.filter((d) => monthDiff(d.periodo) < 12);
    default:
      return data;
  }
}

export type PerformancePreset = 'mes_atual' | '3m' | '6m' | '1a';
