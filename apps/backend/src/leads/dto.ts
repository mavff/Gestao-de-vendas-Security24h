import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @MinLength(2)
  nome!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  fone1?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsInt()
  origem?: number;
}

export class CreateTimelineDto {
  @IsString()
  @MinLength(3)
  descricao!: string;

  @IsOptional()
  @IsInt()
  acao?: number;
}
