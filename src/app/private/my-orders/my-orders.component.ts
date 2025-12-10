import { Component, inject, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProviderService } from '../../services/provider.service';
import { LocalstorageService } from '../../services/localstorage.service';
import { OrderDetailComponent } from '../order-detail/order-detail.component';
import { CurrencyPipe } from '@angular/common';
import { WebSocketsService } from '../../services/web-sockets.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [MatTabsModule, MatDialogModule, MatTableModule, CurrencyPipe],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.scss'
})
export class MyOrdersComponent implements OnInit {
  private _provider: ProviderService = inject(ProviderService);
  private _localStorage: LocalstorageService = inject(LocalstorageService);
  private dialog: MatDialog = inject(MatDialog);
  private _wsService: WebSocketsService = inject(WebSocketsService);

  orders: any[] = [];
  userId: string = '';

  status = [
    { name: "Pendientes", value: 0 },
    { name: "En Proceso", value: 1 },
    { name: "Listas", value: 2 },
    { name: "Entregadas", value: 3 },
    { name: "Canceladas", value: 4 }
  ];

  displayedColumns = ['total', 'comments', 'function'];

// En my-orders.component.ts (dentro de ngOnInit)

async ngOnInit() {
  this.userId = this._localStorage.getItem('user').idusers;

 // Cambiar la URL de la llamada
this.orders = await this._provider.request(
    'GET',
    'order/myOrders',
    { iduser: this.userId } 
  );

  this.listenSocket();
}


  filterByStatus(status: number) {
    return this.orders.filter((order: any) => order.status == status);
  }

  openOrderDetailDialog(order: any) {
    this.dialog.open(OrderDetailComponent, { data: order });
  }

  listenSocket() {
    this._wsService.listen('comanda').subscribe((data: any) => {
      // Buscar si la orden actualizada pertenece a este cliente
      const existingOrder = this.orders.find((item) => item.idorder === data.idorder);
      
      // Solo actualizar si la orden ya existe en la lista del cliente
      if (existingOrder) {
        // Remover la orden anterior
        this.orders = this.orders.filter((item) => item.idorder != data.idorder);
        // Agregar la orden actualizada al inicio, manteniendo el client original
        this.orders.unshift({
          ...data,
          client: existingOrder.client // Mantener el nombre del cliente original
        });
      }
    });
  }
}