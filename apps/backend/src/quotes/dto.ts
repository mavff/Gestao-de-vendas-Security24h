import { IsArray, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteDto {
  @IsString()
  @MinLength(2)
  clienteNome!: string;

  @IsOptional()
  @IsInt()
  prospect?: number;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class CreateQuoteItemDto {
  @IsInt()
  codProduto!: number;

  @IsString()
  descricao!: string;

  @Type(() => Number)
  @Min(0.01)
  quantidade!: number;

  @Type(() => Number)
  @Min(0.01)
  unitario!: number;
}

export class CreateQuoteItemsBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  items!: CreateQuoteItemDto[];
}
