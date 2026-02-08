export type UserRole = 'ADMIN' | 'SDR' | 'VENDEDOR' | 'TECNICO' | 'INFRA' | 'MONITOR';

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    name: string;
    role: UserRole;
  };
}

export interface CreateLeadDto {
  nome: string;
  email?: string;
  fone1?: string;
  cidade?: string;
  estado?: string;
  origem?: number;
}

export interface CreateQuoteItemDto {
  codProduto: number;
  descricao: string;
  quantidade: number;
  unitario: number;
}
