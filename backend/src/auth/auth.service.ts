import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

async login(email: string, password: string) {
  console.log('EMAIL:', email);
  console.log('PASSWORD RECEBIDO:', password);

const rows = await this.dataSource.query(
  `
  SELECT
    u.id,
    u.name,
    u.email,
    u.password,
    r.id AS role_id,
    r.codigo AS role_codigo,
    r.label AS role_label,
    p.codigo AS permission
  FROM users u
  INNER JOIN roles r ON r.id = u.role_id
  LEFT JOIN role_permissions rp ON rp.role_id = r.id
  LEFT JOIN permissions p ON p.id = rp.permission_id
  WHERE u.email = ?
  `,
  [email],
);


    if (!rows.length) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    /**
     * 2️⃣ Validação de senha
     */
    const passwordMatch = await bcrypt.compare(
      password,
      rows[0].password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Senha inválida.');
    }

    /**
     * 3️⃣ Agrupa permissões
     */
    const permissions = [
      ...new Set(
        rows
          .map(r => r.permission)
          .filter(Boolean),
      ),
    ];

    /**
     * 4️⃣ Objeto final do usuário (contrato fixo)
     */
    const user = {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      role: {
        id: rows[0].role_id,
        codigo: rows[0].role_codigo,
        label: rows[0].role_label,
      },
      permissions,
    };

    /**
     * 5️⃣ JWT LIMPO (controle, não profile)
     */
    const token = this.jwtService.sign(
      {
        sub: user.id,
        role: user.role.codigo,
        permissions: user.permissions,
      },
      {
        secret: process.env.JWT_SECRET || 'acasa_fallback_secret',
        expiresIn: '1d',
      },
    );

    /**
     * 6️⃣ Retorno final
     */
    return {
      message: 'Login efetuado com sucesso!',
      token,
      user,
    };
  }
}
