import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PontoService } from './ponto.service';
import { AtivarDto } from './dto/ativar.dto';
import { RegistrarPontoDto } from './dto/registrar-ponto.dto';
import { PontoAuthGuard } from './ponto-auth.guard';

@Controller('ponto')
export class PontoAppController {
  constructor(private readonly service: PontoService) {}

  @Post('ativar')
  ativar(@Body() dto: AtivarDto) {
    return this.service.ativar(dto);
  }

  @UseGuards(PontoAuthGuard)
  @Get('hoje')
  hoje(@Req() req: any) {
    return this.service.hoje(req);
  }

  @UseGuards(PontoAuthGuard)
  @Post('registrar')
  registrar(@Body() dto: RegistrarPontoDto, @Req() req: any) {
    return this.service.registrar(dto, req);
  }

  @UseGuards(PontoAuthGuard)
  @Get('ultimo')
  ultimo(@Req() req: any) {
    return this.service.ultimo(req);
  }

  @UseGuards(PontoAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.service.me(req);
  }
}
