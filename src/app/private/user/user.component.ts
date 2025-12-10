import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProviderService } from '../../services/provider.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WebSocketsService } from '../../services/web-sockets.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
})
export class UserComponent {

  private _formbuilder: FormBuilder = inject(FormBuilder);
  private _provider: ProviderService = inject(ProviderService);
  private _snackBar: MatSnackBar = inject(MatSnackBar);
  private _wsService: WebSocketsService = inject(WebSocketsService);
  private _router: Router = inject(Router);
  private _activedRouter: ActivatedRoute = inject(ActivatedRoute);

  id: string = '';

  roles = [
    { name: 'Administrador', value: 0 },
    { name: 'Cajero', value: 1 },
    { name: 'Cocinero', value: 2 },
    { name: 'Cliente', value: 3 },
  ];

  formulario = this._formbuilder.group({
    idusers: [null],
    name: [null, [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]], // Añadido minLength para creación
    phone: [null],
    rol: [null, Validators.required],
    email: [null, [Validators.required, Validators.email]]
  });

  async ngOnInit() {
    if (this._router.url.includes('edit')) {
      // Modo Edición: La contraseña es opcional
      this.formulario.controls['password'].clearValidators();
      this.formulario.controls['password'].setValidators([Validators.minLength(6)]); // Mínimo 6 si se rellena
      this.formulario.controls['password'].updateValueAndValidity();

      this._activedRouter.params.subscribe(async (params: Params) => {
        this.id = params['id'];
        console.log(this.id);
        var user: any = (await this._provider.request('GET', 'user/viewUser', { idusers: this.id }) as any)[0];
        console.log(user);
        this.formulario.patchValue(user);
        this.formulario.controls['password'].setValue('');
      });
    } else {
      // Modo Creación: La contraseña es requerida
      this.formulario.controls['password'].setValidators([Validators.required, Validators.minLength(6)]);
      this.formulario.controls['password'].updateValueAndValidity();
    }
  }

  async save() {
    console.log(this.formulario.value);

    // Aseguramos que la validación se ejecute antes de la verificación
    this.formulario.markAllAsTouched();

    if (this.formulario.valid && this._wsService.socketStatus) {

      if (this._router.url.includes('edit')) {
        const passwordValue = this.formulario.controls['password'].value;
        let data;

        if (passwordValue && passwordValue.length > 0) {
          // Usa updateUserAdm (actualiza contraseña y rol)
          data = await this._provider.request('PUT', 'user/updateUserAdm', this.formulario.value);
        } else {
          // Usa updateProfileAdm (mantiene contraseña, actualiza perfil y rol)
          const { idusers, name, phone, email, rol } = this.formulario.value;
          const profileData = { idusers, name, phone, email, rol };

          data = await this._provider.request('PUT', 'user/updateProfileAdm', profileData);
        }

        if (data) {
          await this._wsService.request('usuarios', data);
          this._snackBar.open('Usuario Actualizado', '', { duration: 3000, verticalPosition: 'top' });
          this._router.navigate(['private/user-view']);
          this.formulario.reset();
        } else {
          this._snackBar.open('No es posible actualizar el usuario', '', { duration: 3000, verticalPosition: 'top' });
        }

      } else {
        // Lógica de creación (POST auth/signup)
        var data = await this._provider.request('POST', 'auth/signup', this.formulario.value);
        if (data) {
          await this._wsService.request('usuarios', data);
          this._snackBar.open('Usuario Creado', '', { duration: 3000, verticalPosition: 'top' });
          this._router.navigate(['private/user-view']);
          this.formulario.reset();
        } else {
          this._snackBar.open('No es posible crear el usuario', '', { duration: 3000, verticalPosition: 'top' });
        }
      }
    } else {
      this._snackBar.open('No es posible ' + (this.id ? 'actualizar' : 'crear') + ' el usuario', '', { duration: 3000, verticalPosition: 'top' });
      // Removida la lógica de classList.add('invalid') ya que MatFormField maneja la apariencia de error.
    }
  }

  async deleteUser() {
    if (this._wsService.socketStatus) {
      var data = await this._provider.request('DELETE', 'user/deleteUser', { idusers: this.id });

      if (data) {
        await this._wsService.request('usuarios', data);
        this._snackBar.open('Usuario Eliminado', '', { duration: 3000, verticalPosition: 'top' });
        this._router.navigate(['private/user-view']);
        this.formulario.reset();
      } else {
        this._snackBar.open('No es posible eliminar el usuario', '', { duration: 3000, verticalPosition: 'top' });
      }
    } else {
      this._snackBar.open('No es posible eliminar el usuario', '', { duration: 3000, verticalPosition: 'top' });
    }
  }

}