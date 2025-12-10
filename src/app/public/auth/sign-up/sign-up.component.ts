import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProviderService } from '../../../services/provider.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  private _form_builder: FormBuilder = inject(FormBuilder);
  private _router: Router = inject(Router);
  private _provider: ProviderService = inject(ProviderService);
  private _snackBar: MatSnackBar = inject(MatSnackBar);

  loading: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // Los roles temporales pueden eliminarse si el campo ya no es visible en el HTML
  temporalRoles = [
    { name: 'Administrador', value: 0 },
    { name: 'Cajero', value: 1 },
    { name: 'Cocinero', value: 2 },
    { name: 'Cliente', value: 3 },
  ];

  form_signup: FormGroup = this._form_builder.group({
    name: [null, [Validators.required, Validators.minLength(3)]],
    email: [null, [Validators.required, Validators.email]],
    phone: [null, [Validators.required, Validators.minLength(10)]],
    password: [null, [Validators.required, Validators.minLength(6)]],
    confirmPassword: [null, [Validators.required]],
    // Mantenemos el campo en el modelo, pero NO lo usamos para la lógica de envío
rol: [null, [Validators.required]],  });

  async signup() {
    if (this.form_signup.value.password !== this.form_signup.value.confirmPassword) {
      this._snackBar.open('Las contraseñas no coinciden', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.form_signup.valid) {
      this.loading = true; 

      try {
        const dataUser = {
          name: this.form_signup.value.name,
          email: this.form_signup.value.email, 
          phone: this.form_signup.value.phone,
          password: this.form_signup.value.password,
rol: this.form_signup.value.rol        }

        // Llamada al backend
        const result = await this._provider.request('POST', 'auth/signup', dataUser);

        if (result) {
          this._snackBar.open('¡Registro exitoso! Bienvenido a ComandAS', '', { duration: 30 });
          this._router.navigate(['/auth/sign-in']);
        }

      } catch (error) {
        console.error(error);
        this._snackBar.open('Error al registrarse. Verifica tus datos.', 'Cerrar', { duration: 30 });
      } finally {
        this.loading = false; 
      }

    } else {
      this.form_signup.markAllAsTouched(); 
      this._snackBar.open('Completa todos los campos correctamente', 'Cerrar', { duration: 30 });
    }
  }

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }
}