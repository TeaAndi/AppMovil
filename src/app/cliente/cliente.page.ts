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

interface Cliente {
  id: number;
  nombre: string;
  cedula: string;
  correo: string;
  telefono: string;
  direccion: string;
}

@Component({
  selector: 'app-cliente',
  templateUrl: './cliente.page.html',
  styleUrls: ['./cliente.page.scss'],
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
export class ClientePage {
  isModalOpen = false;
  isEditing = false;
  editingIndex: number | null = null;

  clientes: Cliente[] = [];
  clienteForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    addIcons({ arrowBackCircle, addOutline, createOutline, trashOutline, personOutline });

    this.clienteForm = this.fb.group({
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

  openModal(cliente?: Cliente, index?: number) {
    this.isModalOpen = true;

    if (cliente != null && index != null) {
      this.isEditing = true;
      this.editingIndex = index;
      this.clienteForm.reset(cliente);
    } else {
      this.isEditing = false;
      this.editingIndex = null;
      this.clienteForm.reset({ nombre: '', cedula: '', correo: '', telefono: '', direccion: '' });
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditing = false;
    this.editingIndex = null;
    this.clienteForm.reset();
  }

  saveCliente() {
    if (this.clienteForm.invalid) {
      this.presentToast('Por favor complete todos los campos correctamente', 'danger');
      return;
    }

    const formValue = this.clienteForm.value;

    if (this.isEditing && this.editingIndex !== null) {
      const currentId = this.clientes[this.editingIndex].id;
      this.clientes[this.editingIndex] = { id: currentId, ...formValue };
      this.presentToast('Cliente actualizado');
    } else {
      const nextId = (this.clientes.length ? Math.max(...this.clientes.map(c => c.id)) : 0) + 1;
      const newCliente: Cliente = { id: nextId, ...formValue };
      this.clientes.unshift(newCliente);
      this.presentToast('Cliente agregado exitosamente');
    }

    this.closeModal();
  }

  onEdit(cliente: Cliente, index: number) {
    this.openModal(cliente, index);
  }

  async deleteCliente(index: number) {
    const alert = document.createElement('ion-alert');
    alert.header = 'Eliminar cliente';
    alert.message = '¿Está seguro de eliminar este cliente?';
    alert.buttons = [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: () => {
          this.clientes.splice(index, 1);
          this.presentToast('Cliente eliminado', 'medium');
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