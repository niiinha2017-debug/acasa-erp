import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PermissoesService } from './permissoes.service';
import { DefinirPermissoesUsuarioDto } from './dto/definir-permissoes-usuario.dto';
import { MENU_SECTIONS, MenuItem, MenuSection } from './menu.schema';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class PermissoesController {
  constructor(private readonly service: PermissoesService) {}

  @Get('permissoes')
  @Permissoes('permissoes.ver')
  listarPermissoes() {
    return this.service.listarPermissoes();
  }

  @Get('usuarios/:id/permissoes')
  @Permissoes('permissoes.ver')
  listarPermissoesDoUsuario(@Param('id', ParseIntPipe) id: number) {
    return this.service.listarPermissoesDoUsuario(id);
  }

  @Put('usuarios/:id/permissoes')
  @Permissoes('permissoes.gerenciar')
  definirPermissoesDoUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DefinirPermissoesUsuarioDto,
  ) {
    return this.service.definirPermissoesDoUsuario(id, dto.permissoes || []);
  }

  @Get('permissoes/menu')
  @UseGuards(JwtAuthGuard)
  async listarMenu(@Req() req: any) {
    const usuarioId = Number(req?.user?.id || 0);
    const perms = usuarioId
      ? await this.service.permissoesDoUsuarioPorId(usuarioId)
      : [];

    return filtrarMenuPorPermissoes(MENU_SECTIONS, perms);
  }
}

function limparDivisores(items: MenuItem[]) {
  const out: MenuItem[] = [];
  for (const it of items) {
    if (it.divider) {
      if (!out.length) continue;
      if (out[out.length - 1]?.divider) continue;
      out.push(it);
      continue;
    }
    out.push(it);
  }
  while (out.length && out[out.length - 1]?.divider) out.pop();
  return out;
}

function filtrarMenuPorPermissoes(
  sections: MenuSection[],
  perms: string[],
) {
  const admin = perms.includes('ADMIN');

  const result: MenuSection[] = [];
  for (const section of sections) {
    const items = admin
      ? section.items
      : section.items.filter((i) => !i.perm || perms.includes(i.perm));

    const itensFiltrados = limparDivisores(items);
    if (itensFiltrados.some((i) => !i.divider)) {
      result.push({ ...section, items: itensFiltrados });
    }
  }

  return result;
}
