import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon,
  IonList, IonItem, IonLabel, IonModal, IonInput, IonSelect, IonSelectOption,
  IonDatetime, IonFab, IonFabButton, IonPopover
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackCircle, chevronBackOutline, addOutline, createOutline, trashOutline, calendarOutline } from 'ionicons/icons';

interface ProductRef { id: number; name: string; price: number; }
interface PersonRef { id: number; name: string; }
interface OrderItem { productId: number | null; productName: string; price: number; qty: number; total: number; }
interface Pedido {
  id: number;
  clienteId: number | null;
  clienteName: string;
  vendedorId: number | null;
  vendedorName: string;
  fecha: string;
  items: OrderItem[];
  subtotal: number;
  iva: number;
  total: number;
}

const IVA_EC = 0.15;

@Component({
  selector: 'app-pedido',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonButtons, IonIcon,
    IonList, IonItem, IonLabel,
    IonModal, IonInput, IonSelect, IonSelectOption, IonDatetime, IonPopover,
    IonFab, IonFabButton
  ],
  templateUrl: './pedido.page.html',
  styleUrls: ['./pedido.page.scss'],
})
export class PedidoPage {
  isModalOpen = false;
  isEditing = false;
  editingIndex: number | null = null;

  products: ProductRef[] = [];
  clientes: PersonRef[] = [];
  vendedores: PersonRef[] = [];

  pedidos: Pedido[] = [];
  pedidoForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    addIcons({ arrowBackCircle, chevronBackOutline, addOutline, createOutline, trashOutline, calendarOutline });

    this.pedidoForm = this.fb.group({
      clienteId: [null, Validators.required],
      vendedorId: [null, Validators.required],
      fecha: [new Date().toISOString(), Validators.required],
      items: this.fb.array<OrderItem>([])
    });

    this.addItem();
  }

  get itemsFA(): FormArray {
    return this.pedidoForm.get('items') as FormArray;
  }

  goBack() {
    this.router.navigate(['/folder/inbox']);
  }

  openModal(pedido?: Pedido, index?: number) {
    this.isModalOpen = true;

    if (pedido != null && index != null) {
      this.isEditing = true;
      this.editingIndex = index;

      this.pedidoForm.reset({
        clienteId: pedido.clienteId,
        vendedorId: pedido.vendedorId,
        fecha: pedido.fecha
      });

      this.itemsFA.clear();
      pedido.items.forEach(it =>
        this.itemsFA.push(this.fb.group({
          productId: [it.productId, Validators.required],
          productName: [it.productName],
          price: [it.price],
          qty: [it.qty, [Validators.required, Validators.min(1)]],
          total: [it.total]
        }))
      );
    } else {
      this.isEditing = false;
      this.editingIndex = null;
      this.pedidoForm.reset({
        clienteId: null,
        vendedorId: null,
        fecha: new Date().toISOString()
      });
      this.itemsFA.clear();
      this.addItem();
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditing = false;
    this.editingIndex = null;
  }

  addItem() {
    this.itemsFA.push(this.fb.group({
      productId: [null, Validators.required],
      productName: [''],
      price: [0],
      qty: [1, [Validators.required, Validators.min(1)]],
      total: [0]
    }));
  }

  removeItem(i: number) {
    this.itemsFA.removeAt(i);
  }

  onProductChange(i: number) {
    const g = this.itemsFA.at(i) as FormGroup;
    const pid = g.get('productId')?.value as number | null;
    const p = this.products.find(x => x.id === pid);
    if (p) {
      g.patchValue({ productName: p.name, price: p.price });
    } else {
      g.patchValue({ productName: '', price: 0 });
    }
    this.updateLineTotal(i);
  }

  onQtyChange(i: number) {
    this.updateLineTotal(i);
  }

  private updateLineTotal(i: number) {
    const g = this.itemsFA.at(i) as FormGroup;
    const price = Number(g.get('price')?.value) || 0;
    const qty = Number(g.get('qty')?.value) || 0;
    g.patchValue({ total: price * qty }, { emitEvent: false });
  }

  get subtotal(): number {
    return this.itemsFA.controls
      .map(c => Number((c as FormGroup).get('total')?.value) || 0)
      .reduce((a, b) => a + b, 0);
  }

  get iva(): number {
    return +(this.subtotal * IVA_EC).toFixed(2);
  }

  get total(): number {
    return +(this.subtotal + this.iva).toFixed(2);
  }

  // Fecha display y selección mediante popover
  get fechaDisplay(): string {
    const v = this.pedidoForm.get('fecha')?.value as string | null;
    if (!v) return '';
    try {
      return new Date(v).toLocaleDateString('es-EC');
    } catch {
      return '';
    }
  }

  onDatePicked(ev: CustomEvent) {
    const value = (ev as any)?.detail?.value as string | null;
    if (value) {
      this.pedidoForm.get('fecha')?.setValue(value);
    }
  }

  // Input editable (type="date"): convertir YYYY-MM-DD a ISO (UTC)
  get dateInputValue(): string {
    const iso = this.pedidoForm.get('fecha')?.value as string | null;
    if (!iso) return '';
    const d = new Date(iso);
    const tz = d.getTimezoneOffset();
    // Normalizar a fecha local para que el input date no desplace por zona horaria
    return new Date(d.getTime() - tz * 60000).toISOString().slice(0, 10);
  }

  onDateInput(ev: any) {
    const val = ev?.detail?.value as string;
    if (!val) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return;
    const iso = new Date(val + 'T00:00:00').toISOString();
    this.pedidoForm.get('fecha')?.setValue(iso);
  }

  savePedido() {
    if (this.pedidoForm.invalid || this.itemsFA.length === 0) {
      this.presentToast('Complete el formulario y agregue al menos un producto', 'danger');
      return;
    }

    const v = this.pedidoForm.value;
    const clienteName = this.clientes.find(c => c.id === v.clienteId)?.name || '';
    const vendedorName = this.vendedores.find(c => c.id === v.vendedorId)?.name || '';

    const data: Pedido = {
      id: (this.pedidos.length ? Math.max(...this.pedidos.map(p => p.id)) : 0) + 1,
      clienteId: v.clienteId,
      clienteName,
      vendedorId: v.vendedorId,
      vendedorName,
      fecha: v.fecha,
      items: v.items,
      subtotal: this.subtotal,
      iva: this.iva,
      total: this.total
    };

    if (this.isEditing && this.editingIndex !== null) {
      this.pedidos[this.editingIndex] = data;
      this.presentToast('Pedido actualizado');
    } else {
      this.pedidos.unshift(data);
      this.presentToast('Pedido creado');
    }

    this.closeModal();
  }

  onEdit(p: Pedido, i: number) {
    this.openModal(p, i);
  }

  async deletePedido(i: number) {
    const alert = document.createElement('ion-alert');
    alert.header = 'Eliminar pedido';
    alert.message = 'Esta acción no se puede deshacer.';
    alert.buttons = [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: () => {
          this.pedidos.splice(i, 1);
          this.presentToast('Pedido eliminado', 'medium');
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