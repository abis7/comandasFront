import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProviderService } from '../../services/provider.service';
import { LocalstorageService } from '../../services/localstorage.service';
import { CommonModule } from '@angular/common'; // Asegurar CommonModule para *ngIf si se usa

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatIconModule, 
    CommonModule // Añadido para compatibilidad general
  ],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss'
})
export class MyProfileComponent implements OnInit {
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _provider: ProviderService = inject(ProviderService);
  private _localStorage: LocalstorageService = inject(LocalstorageService);
  private _snackBar: MatSnackBar = inject(MatSnackBar);

  // 'user' almacena los datos completos del perfil cargados de la API
  user: any; 
  // 'sessionUser' almacena el objeto del localStorage (solo para token/ID inicial)
  sessionUser: any; 

  // Definición del formulario con validadores
  profileForm: FormGroup = this._formBuilder.group({
    name: [null, [Validators.required, Validators.minLength(3)]],
    phone: [null, [Validators.required, Validators.minLength(10)]],
    email: [null, [Validators.required, Validators.email]], // Campo de Email
    password: [null, [Validators.minLength(6)]] // Opcional
  });

  async ngOnInit() {
    // 1. Obtener la información de sesión inicial (ID y Token)
    this.sessionUser = this._localStorage.getItem('user');
    
    // 2. Cargar los datos completos del perfil desde la API
    await this.fetchAndLoadProfile();
  }

  // Nueva función para obtener y cargar el perfil completo desde la API
  private async fetchAndLoadProfile() {
    try {
      if (!this.sessionUser || !this.sessionUser.idusers) return;

      // Petición al backend para obtener el perfil completo del usuario
      const response: any = await this._provider.request('GET', 'user/viewUser', { 
          idusers: this.sessionUser.idusers 
      });
      
      // La API devuelve un array, tomamos el primer elemento
      const userData = Array.isArray(response) ? response[0] : response;

      if (userData) {
          this.user = userData; // Almacenamos el objeto completo
          this.profileForm.patchValue({
              name: this.user.name,
              phone: this.user.phone,
              email: this.user.email, // Carga el email obtenido de la API
              password: null
          });
      }
    } catch (error) {
        console.error('Error al cargar datos del perfil:', error);
        this._snackBar.open('Error al cargar datos del perfil', 'Cerrar', { duration: 3000 });
    }
  }

  // Resetea el formulario a los últimos datos cargados (this.user)
  resetForm() {
    this.profileForm.patchValue({
      name: this.user.name,
      phone: this.user.phone,
      email: this.user.email,
      password: null
    });
    this.profileForm.markAsUntouched();
    this.profileForm.markAsPristine();
  }

  async saveProfile() {
    this.profileForm.markAllAsTouched();
    
    if (this.profileForm.valid) {
      const password = this.profileForm.value.password;
        
      // Datos base a enviar
      const baseData = {
        idusers: this.sessionUser.idusers,
        name: this.profileForm.value.name,
        phone: this.profileForm.value.phone,
        email: this.profileForm.value.email,
      };

      let endpoint: string;
      let data: any;
      
      // Determinar si se actualiza también la contraseña
      if (password && password.trim() !== '') {
        // Endpoint con contraseña (requiere el rol)
        endpoint = 'user/updateUser';
        data = { 
            ...baseData, 
            password: password,
            rol: this.sessionUser.rol 
        };
        
      } else {
        // Endpoint sin contraseña
        endpoint = 'user/updateProfile';
        data = baseData;
      }
      
      try {
        // Envía la petición PUT al backend
        await this._provider.request('PUT', endpoint, data);

        // 2. Actualizar objetos locales y LocalStorage
        this.user.name = this.profileForm.value.name;
        this.user.phone = this.profileForm.value.phone;
        this.user.email = this.profileForm.value.email;

        this.sessionUser.name = this.profileForm.value.name;
        this.sessionUser.phone = this.profileForm.value.phone;
        this.sessionUser.email = this.profileForm.value.email;
        
        await this._localStorage.setItem('user', this.sessionUser);

        // Limpiar contraseña y resetear estado del formulario
        this.profileForm.patchValue({ password: null });
        this.profileForm.markAsUntouched();
        this.profileForm.markAsPristine();

        this._snackBar.open('Perfil actualizado correctamente', 'Cerrar', { 
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
      } catch (error) {
        console.error('Error al guardar perfil:', error);
        this._snackBar.open('Error al actualizar el perfil', 'Cerrar', { 
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    } else {
      this._snackBar.open('Completa todos los campos correctamente', 'Cerrar', { 
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['warning-snackbar']
      });
    }
  }
}