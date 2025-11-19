import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonContent,
  IonFab, IonFabButton, IonList, IonItem, IonLabel, IonModal, IonInput, IonTitle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackCircle, addOutline, createOutline, trashOutline, personOutline } from 'ionicons/icons';

interface Vendedor {
  id: number;
  nombre: string;
  cedula: string;
  correo: string;
  telefono: string;
  direccion: string;
}

@Component({
  selector: 'app-vendedor',
  templateUrl: './vendedor.page.html',
  styleUrls: ['./vendedor.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonFab,
    IonFabButton,
    IonList,
    IonItem,
    IonLabel,
    IonModal,
    IonInput
  ]
})
export class VendedorPage {
  isModalOpen = false;
  isEditing = false;
  editingIndex: number | null = null;

  vendedores: Vendedor[] = [];
  vendedorForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    addIcons({ arrowBackCircle, addOutline, createOutline, trashOutline, personOutline });

    this.vendedorForm = this.fb.group({
      nombre: ['', Validators.required],
      cedula: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      direccion: ['', Validators.required]
    });
  }

  goBack() {
    this.router.navigate(['/folder/inbox']);
  }

  openModal(vendedor?: Vendedor, index?: number) {
    this.isModalOpen = true;

    if (vendedor != null && index != null) {
      this.isEditing = true;
      this.editingIndex = index;
      this.vendedorForm.reset(vendedor);
    } else {
      this.isEditing = false;
      this.editingIndex = null;
      this.vendedorForm.reset({ nombre: '', cedula: '', correo: '', telefono: '', direccion: '' });
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditing = false;
    this.editingIndex = null;
    this.vendedorForm.reset();
  }

  saveVendedor() {
    if (this.vendedorForm.invalid) {
      this.presentToast('Por favor complete todos los campos correctamente', 'danger');
      return;
    }

    const formValue = this.vendedorForm.value;

    if (this.isEditing && this.editingIndex !== null) {
      const currentId = this.vendedores[this.editingIndex].id;
      this.vendedores[this.editingIndex] = { id: currentId, ...formValue };
      this.presentToast('Vendedor actualizado');
    } else {
      const nextId = (this.vendedores.length ? Math.max(...this.vendedores.map(v => v.id)) : 0) + 1;
      const newVendedor: Vendedor = { id: nextId, ...formValue };
      this.vendedores.unshift(newVendedor);
      this.presentToast('Vendedor agregado exitosamente');
    }

    this.closeModal();
  }

  onEdit(vendedor: Vendedor, index: number) {
    this.openModal(vendedor, index);
  }

  async deleteVendedor(index: number) {
    const alert = document.createElement('ion-alert');
    alert.header = 'Eliminar vendedor';
    alert.message = '¿Está seguro de eliminar este vendedor?';
    alert.buttons = [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: () => {
          this.vendedores.splice(index, 1);
          this.presentToast('Vendedor eliminado', 'medium');
        }
      }
    ];
    document.body.appendChild(alert);
    await alert.present();
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
