import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LocalstorageService } from '../services/localstorage.service';

@Component({
  selector: 'app-private',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './private.component.html',
  styleUrl: './private.component.scss'
})
export class PrivateComponent {
  private _localstorage: LocalstorageService = inject(LocalstorageService);
  private _router: Router = inject(Router);
  rol: number = 0;

  get user(): string {
    return this._localstorage.getItem('user')?.name || '';
  }

  ngOnInit(){
    this.rol = this._localstorage.getItem('user').rol;
  }
  logOut(){

    this._localstorage.clear();

    this._router.navigate(['/auth/sign-in'])
  }
}