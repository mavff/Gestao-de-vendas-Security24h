import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ProductsRepository } from './products.repository';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsRepo: ProductsRepository) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('codMarca') codMarca?: string,
    @Query('codGrupo') codGrupo?: string,
    @Query('codCategoria') codCategoria?: string,
    @Query('cancelado') cancelado?: string,
    @Query('grupoOrcamento') grupoOrcamento?: string,
    @Query('apenasOrcamento') apenasOrcamento?: string,
    @Query('codEstoque') codEstoque?: string,
  ) {
    return this.productsRepo.findAll({
      page,
      pageSize,
      q: q || undefined,
      codMarca: codMarca ? Number(codMarca) : undefined,
      codGrupo: codGrupo ? Number(codGrupo) : undefined,
      codCategoria: codCategoria ? Number(codCategoria) : undefined,
      cancelado: cancelado !== undefined ? cancelado === 'true' : undefined,
      grupoOrcamento: grupoOrcamento || undefined,
      apenasOrcamento: apenasOrcamento !== undefined ? apenasOrcamento !== 'false' : undefined,
      codEstoque: codEstoque ? Number(codEstoque) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsRepo.findById(id);
  }
}
