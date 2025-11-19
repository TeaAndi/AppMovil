import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent,
  IonFab, IonFabButton, IonList, IonItem, IonLabel, IonModal, IonInput, IonTextarea,
  IonImg, IonThumbnail
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackCircle, addOutline, imageOutline, createOutline, trashOutline } from 'ionicons/icons';

interface Product {
  id: number;
  name: string;
  description: string;
  stock: number;
  price: number;
  image: string;
}

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.page.html',
  styleUrls: ['./inventario.page.scss'],
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
    IonInput,
    IonTextarea,
    IonImg,
    IonThumbnail
  ]
})
export class InventarioPage {
  isModalOpen = false;
  isEditing = false;
  editingIndex: number | null = null;

  products: Product[] = [];
  productForm: FormGroup;
  selectedImage: string | null = null;

  constructor(private fb: FormBuilder, private router: Router) {
    addIcons({ arrowBackCircle, addOutline, imageOutline, createOutline, trashOutline });

    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(1)]],
      image: ['']
    });
  }

  goBack() {
    this.router.navigate(['/folder/inbox']);
  }

  // Abrir modal para Crear o Editar
  openModal(product?: Product, index?: number) {
    this.isModalOpen = true;

    if (product != null && index != null) {
      // Modo edición
      this.isEditing = true;
      this.editingIndex = index;
      this.productForm.reset(product);
      this.selectedImage = product.image || null;
    } else {
      // Modo creación
      this.isEditing = false;
      this.editingIndex = null;
      this.productForm.reset({ name: '', description: '', stock: 0, price: 0, image: '' });
      this.selectedImage = null;
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditing = false;
    this.editingIndex = null;
    this.productForm.reset({ name: '', description: '', stock: 0, price: 0, image: '' });
    this.selectedImage = null;
  }

  uploadImage(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedImage = e.target.result;
      this.productForm.patchValue({ image: e.target.result });
    };
    reader.readAsDataURL(file);
  }

  saveProduct() {
    if (this.productForm.invalid) {
      this.presentToast('Por favor complete todos los campos', 'danger');
      return;
    }

    const formValue = this.productForm.value;

    if (this.isEditing && this.editingIndex !== null) {
      // Actualizar
      const currentId = this.products[this.editingIndex].id;
      this.products[this.editingIndex] = { id: currentId, ...formValue };
      this.presentToast('Producto actualizado');
    } else {
      // Crear
      const nextId = (this.products.length ? Math.max(...this.products.map(p => p.id)) : 0) + 1;
      const newProduct: Product = { id: nextId, ...formValue };
      this.products.unshift(newProduct);
      this.presentToast('Producto agregado exitosamente');
    }

    this.closeModal();
  }

  onEdit(product: Product, index: number) {
    this.openModal(product, index);
  }

  async deleteProduct(index: number) {
    const alert = document.createElement('ion-alert');
    alert.header = 'Eliminar producto';
    alert.message = 'Esta acción no se puede deshacer.';
    alert.buttons = [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: () => {
          this.products.splice(index, 1);
          this.presentToast('Producto eliminado', 'medium');
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