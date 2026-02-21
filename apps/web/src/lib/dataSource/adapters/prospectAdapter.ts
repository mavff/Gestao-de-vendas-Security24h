import { Lead, LeadStage } from '../../../types';
import { ProspectApiDto } from '../types';

/**
 * Infere o estágio do kanban a partir do status e da probabilidade da última ação.
 *
 * Regras (espelham o comportamento real do ERP):
 *   status = 'X'           → Fechado  (convertido em cliente)
 *   prob = 100             → Fechado  (venda certa)
 *   prob 61–99             → Negociação
 *   prob 26–60             → Proposta
 *   prob  1–25             → Contato
 *   sem ação / prob = 0    → Novo
 *
 * O stage pode ser sobrescrito por drag-drop (stageOverrides do localStorage).
 */
function inferStage(prospect: ProspectApiDto): LeadStage {
  if (prospect.status === 'X') return 'Fechado';

  const prob = prospect.ultimaProbabilidade;
  if (prob == null || prob === 0) return 'Novo';
  if (prob >= 100) return 'Fechado';
  if (prob >= 61) return 'Negociação';
  if (prob >= 26) return 'Proposta';
  if (prob >= 1)  return 'Contato';
  return 'Novo';
}

/**
 * Formata uma data ISO para o campo `week` (mês/ano legível).
 */
function formatWeek(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

/**
 * Converte um ProspectApiDto (retornado pela API) em um Lead para o Kanban.
 *
 * @param prospect      - dados do prospect vindos da API
 * @param stageOverrides - mapa codProspect(string) → LeadStage, salvo em localStorage
 */
export function prospectToLead(
  prospect: ProspectApiDto,
  stageOverrides: Record<string, LeadStage> = {},
): Lead {
  const id = String(prospect.codProspect);
  const stage = stageOverrides[id] ?? inferStage(prospect);

  // Localidade como "empresa" — melhor campo disponível sem tabela de empresa
  const localidade = [prospect.cidade, prospect.estado].filter(Boolean).join('/') || '—';

  // Timeline: cadastro + última ação (se existir)
  const timeline: Lead['timeline'] = [];
  if (prospect.dataCadastro) {
    timeline.push({ id: 'cad', date: prospect.dataCadastro.slice(0, 10), text: 'Prospect cadastrado' });
  }
  if (prospect.ultimaAcaoData && prospect.ultimaAcaoDescricao) {
    timeline.push({
      id: 'ult',
      date: prospect.ultimaAcaoData.slice(0, 10),
      text: prospect.ultimaAcaoDescricao.length > 140
        ? prospect.ultimaAcaoDescricao.slice(0, 140) + '…'
        : prospect.ultimaAcaoDescricao,
    });
  }

  return {
    id,
    name: prospect.nome,
    company: localidade,
    value: prospect.orcamentoTotal ?? 0,
    stage,
    responsible: prospect.usuario ?? '—',
    origin: prospect.origemDescreve ?? (prospect.origem ? `#${prospect.origem}` : 'Outro'),
    week: formatWeek(prospect.dataCadastro),
    status: prospect.inativo ? 'pausado' : 'ativo',
    notes: [],
    timeline,
    attachments: [],
    email: prospect.email ?? undefined,
    contato: prospect.fone1 ?? undefined,
    endereco: prospect.endereco ?? undefined,
    probabilidade: prospect.ultimaProbabilidade ?? undefined,
  };
}
