import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ProviderService } from '../../services/provider.service';
import { WebSocketsService } from '../../services/web-sockets.service';
import { CurrencyPipe, NgIf } from '@angular/common'; 

// Interfaces simples para tipar los resultados del backend
interface TotalData {
  total: string | number;
}
interface AvgData {
  minutos: string | number;
}

@Component({
  selector: 'app-dash-admin',
  standalone: true,
  imports: [BaseChartDirective, CurrencyPipe, NgIf], 
  templateUrl: './dash-admin.component.html',
  styleUrl: './dash-admin.component.scss'
})
export class DashAdminComponent implements OnInit {
  private _provider: ProviderService = inject(ProviderService);
  private _wsService: WebSocketsService = inject(WebSocketsService);
  
  products: any = [];
  clients: any = [];
  avg: AvgData = { minutos: 0 }; 
  total: TotalData = { total: 0 }; 
  sales: any = [];
  
  // Inicializamos dataSales con un valor vacío para evitar errores de plantilla
  dataSales: ChartData<'bar'> = { labels: [], datasets: [{ data: [], label: '' }] }; 
  dataProduct!: ChartData<'bar'>;
  dataClient!: ChartData<'bar'>;
  
  mesActual = new Date().getMonth() + 1;
  loading: boolean = true; 
  isDataReady: boolean = false; 
  
  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      y: { beginAtZero: true }
    },
    plugins: {
      legend: { display: false }
    }
  };

  @ViewChild(BaseChartDirective) chartSales!: BaseChartDirective;

  async ngOnInit() {
    this.loading = true;
    try {
      await Promise.all([
        this.Sales(),
        this.bestSeller(),
        this.bestClient(),
        this.loadStats()
      ]);
      
      this.isDataReady = true; 
      this.listenGraphics(); 
      
    } catch (error) {
      console.error('Error al cargar datos del Dashboard:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadStats() {
    this.total = await this._provider.request('GET', 'graphics/totalSales') as TotalData;
    this.avg = await this._provider.request('GET', 'graphics/avgTime') as AvgData;
  }

  async listenGraphics() {
    this._wsService.listen('grafica').subscribe((data: { mes: number, total: string | number }) => {
      
      const totalVenta = parseFloat(String(data.total)) || 0;
      const indiceMes = data.mes - 1;

      // 1. Actualizar la gráfica
      if (this.dataSales && this.dataSales.datasets[0] && this.dataSales.datasets[0].data[indiceMes] !== undefined) {
        let valorAnterior = this.dataSales.datasets[0].data[indiceMes] as number;
        this.dataSales.datasets[0].data[indiceMes] = valorAnterior + totalVenta;
        this.chartSales.update(); 
      }
      
      // 2. Actualizar la tarjeta de Ventas Totales
      let totalActual = parseFloat(String(this.total.total)) || 0;
      this.total.total = (totalActual + totalVenta).toFixed(2);
    });
  }

  async Sales() {
    this.sales = await this._provider.request('GET', 'graphics/sales');
    // Aseguramos que dataSales se inicialice con los datos correctos
    this.dataSales = {
      labels: this.sales.labels,
      datasets: [
        {
          data: this.sales.data, 
          label: 'Total de Ventas ($)', 
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
        }
      ]
    };
  }

  async bestSeller() {
    this.products = await this._provider.request('GET', 'graphics/bestSeller', { mes: this.mesActual });
    this.dataProduct = {
      labels: this.products.labels,
      datasets: [
        {
          data: this.products.data, 
          label: 'Cantidad de Unidades', 
          backgroundColor: 'rgba(249, 115, 22, 0.7)',
        }
      ]
    };
  }

  async bestClient() {
    this.clients = await this._provider.request('GET', 'graphics/bestClient');
    this.dataClient = {
      labels: this.clients.labels,
      datasets: [
        {
          data: this.clients.data, 
          label: 'No. de compras', 
          backgroundColor: 'rgba(168, 85, 247, 0.7)',
        }
      ]
    };
  }
}