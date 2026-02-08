import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateQuoteDto, CreateQuoteItemsBatchDto } from './dto';
import { QuotesService } from './quotes.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Roles('ADMIN', 'VENDEDOR')
  @Post()
  create(@Body() dto: CreateQuoteDto, @Req() req: { user: { username: string } }) {
    return this.quotesService.create(dto, req.user.username);
  }

  @Roles('ADMIN', 'VENDEDOR')
  @Post(':id/items')
  addItems(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateQuoteItemsBatchDto) {
    return this.quotesService.addItems(id, dto.items);
  }

  @Get(':id')
  details(@Param('id', ParseIntPipe) id: number) {
    return this.quotesService.details(id);
  }
}
