import { Injectable } from '@nestjs/common';

/**
 * QuickChart.io - API grátis que gera gráficos em imagem via URL.
 * Ideal para relatórios em PDF, e-mail ou Telegram sem lib pesada de JS.
 * Docs: https://quickchart.io/documentation/
 */
@Injectable()
export class QuickChartService {
  private readonly baseUrl = 'https://quickchart.io/chart';

  /**
   * Gera URL de gráfico a partir de configuração Chart.js.
   * width/height maiores = gráficos "maiores" para relatórios.
   */
  buildChartUrl(config: Record<string, unknown>, options?: { width?: number; height?: number }): string {
    const width = options?.width ?? 900;
    const height = options?.height ?? 450;
    const encoded = encodeURIComponent(JSON.stringify(config));
    return `${this.baseUrl}?width=${width}&height=${height}&chart=${encoded}`;
  }

  /**
   * Gráfico de barras: DRE Despesas por categoria/mês.
   */
  buildDreDespesasUrl(
    data: { mes: string; categoria: string; total: number }[],
    options?: { width?: number; height?: number },
  ): string {
    const byMes = new Map<string, number>();
    const categorias = new Set<string>();
    for (const d of data) {
      byMes.set(d.mes, (byMes.get(d.mes) ?? 0) + d.total);
      categorias.add(d.categoria);
    }
    const labels = Array.from(byMes.keys()).sort();
    const values = labels.map((m) => byMes.get(m) ?? 0);

    const config = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Despesas (R$)',
            data: values,
            backgroundColor: 'rgba(249, 115, 22, 0.8)',
            borderColor: 'rgb(249, 115, 22)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        title: { display: true, text: 'DRE - Despesas por mês' },
        legend: { display: false },
        scales: {
          yAxes: [{ ticks: { beginAtZero: true }, scaleLabel: { display: true, labelString: 'R$' } }],
        },
      },
    };
    return this.buildChartUrl(config, options);
  }

  /**
   * Gráfico de barras: Horas trabalhadas por funcionário no período.
   */
  buildHorasTrabalhadasUrl(
    linhas: { nome: string; horas_trabalhadas: number }[],
    options?: { width?: number; height?: number },
  ): string {
    const labels = linhas.map((l) => (l.nome.length > 20 ? l.nome.slice(0, 18) + '…' : l.nome));
    const data = linhas.map((l) => l.horas_trabalhadas);

    const config = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Horas',
            data,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        title: { display: true, text: 'Horas trabalhadas por funcionário' },
        legend: { display: false },
        scales: {
          yAxes: [{ ticks: { beginAtZero: true }, scaleLabel: { display: true, labelString: 'horas' } }],
        },
      },
    };
    return this.buildChartUrl(config, options);
  }

  /**
   * Gráfico de pizza: Status de obras/projetos.
   */
  buildStatusObrasUrl(
    data: { status: string; total: number }[],
    options?: { width?: number; height?: number },
  ): string {
    const config = {
      type: 'pie',
      data: {
        labels: data.map((d) => d.status),
        datasets: [
          {
            data: data.map((d) => d.total),
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(249, 115, 22, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(236, 72, 153, 0.8)',
            ],
          },
        ],
      },
      options: {
        title: { display: true, text: 'Status de Obras/Projetos' },
      },
    };
    return this.buildChartUrl(config, options);
  }
}
