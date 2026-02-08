import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateLeadDto, CreateTimelineDto } from './dto';
import { LeadsService } from './leads.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Roles('ADMIN', 'SDR', 'VENDEDOR')
  @Post()
  create(@Body() dto: CreateLeadDto, @Req() req: { user: { username: string } }) {
    return this.leadsService.create(dto, req.user.username);
  }

  @Get()
  list(@Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    return this.leadsService.list(Number(page), Number(pageSize));
  }

  @Get(':id')
  details(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.details(id);
  }

  @Roles('ADMIN', 'SDR', 'VENDEDOR', 'TECNICO')
  @Post(':id/timeline')
  addTimeline(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateTimelineDto) {
    return this.leadsService.addTimeline(id, dto);
  }
}
