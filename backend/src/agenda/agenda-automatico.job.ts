import { Injectable, Logger } from '@nestjs/common';
// import { Cron } from '@nestjs/schedule';
import { AgendaService } from './agenda.service';

@Injectable()
export class AgendaAutomaticoJob {
  private readonly logger = new Logger(AgendaAutomaticoJob.name);

  constructor(private readonly agendaService: AgendaService) {}

  /**
   * Job desativado: agendamento é manual.
   * A tarefa só inicia quando o funcionário clicar em "Iniciar".
   * (Era: a cada minuto iniciava tarefas no horário e concluía após o término.)
   */
  // @Cron('* * * * *', { timeZone: 'America/Sao_Paulo' })
  async executar() {
    // Manual: não alterar status por horário.
    // await this.agendaService.processarAutomaticoPorHorario();
  }
}
