import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UtilsService } from './utils.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('utils')
export class UtilsController {
  constructor(private readonly utilsService: UtilsService) {}

  @Get('cnpj/:cnpj')
  @Permissoes('clientes.ver', 'fornecedores.ver', 'configuracoes.empresa.ver')
  buscarCnpj(@Param('cnpj') cnpj: string) {
    return this.utilsService.buscarCnpj(cnpj);
  }
}
