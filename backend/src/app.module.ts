// app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { join } from 'path'

// PRISMA
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    // 🔑 ENV
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env.production'),
        join(process.cwd(), '.env'),
      ],
    }),

    // 🧠 ORM ÚNICO
    PrismaModule,

   
  ],
})
export class AppModule {}
