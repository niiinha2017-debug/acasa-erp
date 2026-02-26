import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AgendaService } from './agenda.service';

@Injectable()
export class AgendaAutomaticoJob {
  private readonly logger = new Logger(AgendaAutomaticoJob.name);

  constructor(private readonly agendaService: AgendaService) {}

  /** A cada minuto: inicia tarefas no horário e conclui tarefas após o término. */
  @Cron('* * * * *', { timeZone: 'America/Sao_Paulo' })
  async executar() {
    try {
      await this.agendaService.processarAutomaticoPorHorario();
    } catch (e: any) {
      this.logger.warn(
        `[AUTO] Falha ao processar agenda por horário: ${e?.message || e}`,
      );
    }
  }
}
