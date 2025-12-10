import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { ProviderService } from '../../../services/provider.service';
import { LocalstorageService } from '../../../services/localstorage.service';
import { MatDialog } from '@angular/material/dialog';
import { OrderDetailComponent } from '../../../private/order-detail/order-detail.component';
import { CommonModule } from '@angular/common'; 
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
  private _form_builder: FormBuilder = inject(FormBuilder);
  private _router: Router = inject(Router);
  private _provider: ProviderService = inject(ProviderService);
  private _localstorage: LocalstorageService = inject(LocalstorageService);
  private dialog: MatDialog = inject(MatDialog);

  // Variables para el nuevo diseño
  loading: boolean = false;
  showPassword: boolean = false;
  
  form_signin: FormGroup = this._form_builder.group({
    name: [null, [Validators.required]],
    password: [null, [Validators.required]]
  });

  async signin() {
    if (this.form_signin.invalid) {
      this.form_signin.markAllAsTouched();
      return;
    }

    this.loading = true; // Activar spinner

    // Timer estético
    const timerPromise = new Promise(resolve => setTimeout(resolve, 1500));
    const requestPromise = this._provider.request('POST', 'auth/signin', this.form_signin.value);

    try {
      const [response]: any = await Promise.all([requestPromise, timerPromise]);
      
      this._localstorage.setItem('user', response);
      
      const rol = this._localstorage.getItem('user').rol;
      this.navegarPorRol(rol);

    } catch (error: any) {
      await timerPromise;
      console.error("Error:", error);

      // Lógica de Alertas
      let codigo = error.error_code || 'GENERICO';

      if (codigo === '004') {
        Swal.fire({
          icon: 'error',
          title: 'Usuario incorrecto',
          text: 'No encontramos ese usuario.',
          confirmButtonColor: '#2e6643'
        });
      } else if (codigo === '005') {
        Swal.fire({
          icon: 'warning',
          title: 'Contraseña incorrecta',
          text: 'Verifica tu contraseña.',
          confirmButtonColor: '#2e6643'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Credenciales incorrectas',
          text: 'Revisa tu usuario y contraseña',
          confirmButtonColor: '#2e6643'
        });
      }
    } finally {
      this.loading = false;
    }
  }

  navegarPorRol(rol: number) {
    switch (rol) {
      case 0: this._router.navigate(['private/menu']); break;
      case 1: this._router.navigate(['private/orders-view']); break;
      case 2:
        this._router.navigate(['private/chef-order-view']);
        this.actualOrder();
        break;
      case 3: this._router.navigate(['private/menu']); break;
      default: this._router.navigate(['private/menu']);
    }
  }

  async actualOrder() {
    const user = this._localstorage.getItem('user');
    if (user && user.actual_order) {
      this.dialog.open(OrderDetailComponent, { data: { idorder: user.actual_order } });
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}