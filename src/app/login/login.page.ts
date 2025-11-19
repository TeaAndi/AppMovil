import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';

interface Usuario {
  username: string;
  password: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginPage implements OnInit {
  // Google Apps Script Web App URL (deploy your Script and paste the URL here)
  readonly SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbx7v1ug_r7oWYt2QTAAbSXBM8m-mC6xByi7Ym_KDITCXuyo8BElUHonVdMmxoE53-B3/exec';
  username = '';
  password = '';
  showPassword = false;
  showError = false;
  usuarios: Usuario[] = [];
  sheetAvailable = true;

  constructor(private router: Router, private http: HttpClient) {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  ngOnInit() {
    // Cargar usuarios exclusivamente desde Google Sheets (Apps Script Web App)
    if (this.SHEETS_API_URL && this.SHEETS_API_URL.indexOf('REPLACE_WITH') === -1) {
      this.http.get<any>(`${this.SHEETS_API_URL}?action=getUsers`).subscribe({
        next: (data) => {
          // Accept either an array or a single object response (some Apps Script deployments
          // may return a single object instead of an array). Normalize to Usuario[]
          this.usuarios = this._normalizeResponse(data);
          console.log('Loaded users from Sheets:', this.usuarios);
          this.sheetAvailable = true;
        },
        error: async (err) => {
          console.error('Error cargando usuarios desde Sheets API:', err);
          this.sheetAvailable = false;
          await this.presentToast('No se pudo conectar con Google Sheets. Usa el botón Reintentar.', 'danger');
          this.usuarios = [];
        }
      });
      return;
    }

    // Si la URL no está configurada, no cargar usuarios
    console.warn('SHEETS_API_URL no configurada en LoginPage');
    this.usuarios = [];
  }

  private _normalizeUser(raw: any): Usuario {
    if (!raw) return { username: '', password: '' };
    const username = raw.username || raw.usser || raw.user || '';
    const password = raw.password || raw.pass || raw.pw || '';
    return { username: String(username), password: String(password) };
  }

  retryFetch() {
    // re-intentar cargar usuarios desde Sheets
    if (this.SHEETS_API_URL && this.SHEETS_API_URL.indexOf('REPLACE_WITH') === -1) {
      this.sheetAvailable = true;
      this.http.get<any>(`${this.SHEETS_API_URL}?action=getUsers`).subscribe({
        next: (data) => { this.usuarios = this._normalizeResponse(data); console.log('Retry loaded users:', this.usuarios); this.sheetAvailable = true; },
        error: (err) => { console.error('Retry failed', err); this.sheetAvailable = false; }
      });
    }
  }

  private _normalizeResponse(data: any): Usuario[] {
    if (!data) return [];
    if (Array.isArray(data)) return data.map((u: any) => this._normalizeUser(u));
    // If the response is a single user object (or wrapped), try to normalize it
    if (data.username || data.usser || data.user) return [this._normalizeUser(data)];
    // Some responses might be an object with a single key pointing to the user
    // e.g. { "0": { username:..., password:... } }
    const first = Object.values(data)[0];
  if (first && (String((first as any).username || (first as any).usser || (first as any).user))) return [this._normalizeUser(first)];
    return [];
  }

  async presentToast(message: string, color: string = 'danger') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2500;
    toast.color = color;
    toast.position = 'top';
    document.body.appendChild(toast);
    await toast.present();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    // Resetear error
    this.showError = false;

    // Validar campos vacíos
    if (!this.username.trim() || !this.password.trim()) {
      this.showError = true;
      return;
    }

    console.log('Attempt login:', this.username.trim(), 'users count:', this.usuarios.length, this.usuarios.map(u=>u.username));

    // Buscar usuario en el array cargado desde Google Sheets
    const usuarioValido = this.usuarios.find(
      (u: Usuario) => String(u.username || '').trim() === this.username.trim() && String(u.password || '').trim() === this.password.trim()
    );

    if (usuarioValido) {
      // Login exitoso - guardar username en localStorage y navegar
      this.showError = false;
      localStorage.setItem('currentUsername', this.username.trim());
      this.router.navigate(['/folder', 'inbox']);
    } else {
      // Credenciales incorrectas
      this.showError = true;
    }
  }
}