import { Component, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonButton, IonIcon, IonList, 
  IonItem, IonLabel, IonToggle, IonModal, IonButtons, IonTitle, IonInput
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { arrowBackCircle, moon, notifications, personCircle } from 'ionicons/icons';

interface Usuario {
  username: string;
  password: string;
}

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.page.html',
  styleUrls: ['./ajustes.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonHeader, IonToolbar, IonButton, IonIcon,
    IonList, IonItem, IonLabel, IonToggle, IonModal, IonButtons, IonTitle, IonInput
  ]
  ,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AjustesPage {
  // Google Apps Script Web App URL (deploy your Script and paste the URL here)
  readonly SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbx7v1ug_r7oWYt2QTAAbSXBM8m-mC6xByi7Ym_KDITCXuyo8BElUHonVdMmxoE53-B3/exec';
  darkMode = false;
  notificaciones = true;
  isModalOpen = false;
  sheetAvailable = true;
  
  changePasswordForm: FormGroup;
  usuarios: Usuario[] = [];
  currentUser: string = '';

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ arrowBackCircle, moon, notifications, personCircle });

    this.changePasswordForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.loadUsuarios();
  }

  loadUsuarios() {
    // Cargar usuarios exclusivamente desde Google Sheets (Apps Script Web App)
    if (this.SHEETS_API_URL && this.SHEETS_API_URL.indexOf('REPLACE_WITH') === -1) {
        this.http.get<any>(`${this.SHEETS_API_URL}?action=getUsers`).subscribe({
          next: (data) => {
            // Normalizar la respuesta: Apps Script puede devolver un array o un objeto único
            const normalized = this._normalizeResponse(data);
            this.usuarios = normalized.map(u => this._normalizeUser(u));
            this.sheetAvailable = true;
            console.log('Loaded users from Sheets:', this.usuarios);
          },
          error: (err) => {
            console.error('Error cargando usuarios desde Sheets API', err);
            this.sheetAvailable = false;
            this.presentToast('No se pudo conectar con Google Sheets. Presiona Reintentar.', 'danger');
            this.usuarios = [];
          }
        });
      return;
    }

    console.warn('SHEETS_API_URL no configurada en AjustesPage. No se cargarán usuarios.');
    this.usuarios = [];
  }

  private _normalizeUser(raw: any): Usuario {
    if (!raw) return { username: '', password: '' };
    const username = raw.username || raw.usser || raw.user || '';
    const password = raw.password || raw.pass || raw.pw || '';
    return { username: String(username), password: String(password) };
  }

  /**
   * Acepta la respuesta de Apps Script y devuelve un array de items (puede ser un objeto único o un array)
   */
  private _normalizeResponse(raw: any): any[] {
    if (!raw) return [];
    // Si ya es array, devolver tal cual
    if (Array.isArray(raw)) return raw;
    // Si es un objeto que contiene propiedades de usuario, envolver en array
    if (typeof raw === 'object') return [raw];
    // Si es un string (posible JSON), intentar parsear
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  // No fallback to localStorage or assets: all data comes from Google Sheets

  passwordMatchValidator(g: FormGroup) {
    const pass = g.get('password')?.value;
    const confirmPass = g.get('confirmPassword')?.value;
    return pass === confirmPass ? null : { mismatch: true };
  }

  goBack() {
    this.router.navigate(['/folder/inbox']);
  }

  toggleDarkMode(event: any) {
    this.darkMode = event.detail.checked;
    document.body.classList.toggle('dark', this.darkMode);
  }

  toggleNotificaciones(event: any) {
    this.notificaciones = event.detail.checked;
  }

  openModal() {
    // Debug log cuando se intenta abrir el modal
    console.log('openModal invoked');

    // Obtener el usuario actual del localStorage o usar el primero del array
    this.currentUser = localStorage.getItem('currentUsername') || '';
    if (!this.currentUser && this.usuarios.length > 0) {
      this.currentUser = this.usuarios[0].username;
    }

    // Precargar el formulario antes de abrir el modal
    this.changePasswordForm.patchValue({ username: this.currentUser });

    // Asegurar que Angular detecte el cambio y abrir el modal en el siguiente tick
    setTimeout(() => {
      this.isModalOpen = true;
      this.cdr.detectChanges();
      console.log('isModalOpen set to true');
    }, 0);
  }

  closeModal() {
    this.isModalOpen = false;
    this.changePasswordForm.reset();
  }

  async saveChanges() {
    if (this.changePasswordForm.invalid) {
      this.presentToast('Por favor complete todos los campos correctamente', 'danger');
      return;
    }

    const formValue = this.changePasswordForm.value;
    
    const newUsername = formValue.username;
    const newPassword = formValue.password;

    // Actualizar en memoria primero
    const userIndex = this.usuarios.findIndex(u => u.username === this.currentUser);
    if (userIndex !== -1) {
      this.usuarios[userIndex] = { username: newUsername, password: newPassword };
    } else {
      const idx2 = this.usuarios.findIndex(u => u.username === newUsername);
      if (idx2 !== -1) this.usuarios[idx2].password = newPassword;
      else { this.presentToast('Usuario no encontrado', 'danger'); return; }
    }

    // Si hay Apps Script configurado, intentar persistir ahí
    if (this.SHEETS_API_URL && this.SHEETS_API_URL.indexOf('REPLACE_WITH') === -1) {
      // --- Quick test: usar GET con query params para evitar CORS (no dispara preflight)
      // Nota: enviar credenciales en la URL es inseguro; esto sólo es para diagnóstico rápido.
      const query = new URLSearchParams();
      query.set('action', 'updateUser');
      query.set('oldUsername', this.currentUser);
      query.set('username', newUsername);
      query.set('password', newPassword);
      const url = `${this.SHEETS_API_URL}?${query.toString()}`;
      console.log('Attempting Sheets update via GET', url);
      this.http.get<any>(url).subscribe({
        next: (res) => {
          console.log('Sheets update response (GET)', res);
          // actualizar currentUsername en localStorage para sesión
          try { localStorage.setItem('currentUsername', newUsername); } catch {}
          this.presentToast('Usuario y contraseña actualizados en Sheets', 'success');
          // Esperar un momento y recargar usuarios desde Sheets para verificar persistencia
          setTimeout(() => {
            console.log('Re-loading users from Sheets after update...');
            this.loadUsuarios();
          }, 700);
          this.closeModal();
        },
        error: (err) => {
          console.error('Error actualizando en Sheets', err);
          this.presentToast('No se pudo actualizar en Google Sheets. Intenta más tarde.', 'danger');
        }
      });
      return;
    }

    // Si no hay Sheets URL configurada, informar al usuario
    this.presentToast('No está configurada la URL de Google Sheets. No se guardaron los cambios.', 'danger');
  }

  async presentToast(message: string, color: string = 'success') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    toast.color = color;
    toast.position = 'top';
    document.body.appendChild(toast);
    await toast.present();
  }
}
