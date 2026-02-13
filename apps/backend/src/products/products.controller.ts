import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ProductsRepository } from './products.repository';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsRepo: ProductsRepository) {}

  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('q') q?: string,
    @Query('codMarca') codMarca?: string,
    @Query('codGrupo') codGrupo?: string,
    @Query('codCategoria') codCategoria?: string,
    @Query('cancelado') cancelado?: string,
  ) {
    return this.productsRepo.findAll(
      {
        q: q || undefined,
        codMarca: codMarca ? Number(codMarca) : undefined,
        codGrupo: codGrupo ? Number(codGrupo) : undefined,
        codCategoria: codCategoria ? Number(codCategoria) : undefined,
        cancelado: cancelado !== undefined ? cancelado === 'true' : undefined,
      },
      Number(page),
      Number(pageSize),
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsRepo.findById(id);
  }
}
