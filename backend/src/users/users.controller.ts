import { 
  Get, 
  Post, // Adicione este
  Param, // Adicione este
  UseGuards, 
  Controller 
} from '@nestjs/common'; 
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { PermissionGuard } from '../auth/permission/permission.guard'; 
// Verifique se o nome no seu arquivo é 'RequirePermission' ou 'Permission'
import { RequirePermission } from '../auth/permission/permission.decorator'; 
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('pendentes')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('aprovar_usuarios')
  async listarSolicitacoesPendentes() {
    return this.usersService.buscarSolicitacoesPendentes();
  }

  // MÉTODO NOVO CORRIGIDO
  @Post('aprovar/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('aprovar_usuarios')
  async aprovarUsuario(@Param('id') id: string) {
    return this.usersService.aprovarSolicitacao(+id);
  }
}