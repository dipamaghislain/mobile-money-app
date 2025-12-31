import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav';

interface Merchant {
  id: number;
  nom: string;
  categorie: string;
  icon: string;
  description?: string;
}

@Component({
  selector: 'app-merchant-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, BottomNavComponent],
  templateUrl: './merchant-list.html',
  styleUrl: './merchant-list.scss',
})
export class MerchantList {
  merchants: Merchant[] = [
    {
      id: 1,
      nom: 'Supermarché City',
      categorie: 'Alimentation',
      icon: 'shopping_cart',
      description: 'Courses du quotidien, produits frais et ménagers.',
    },
    {
      id: 2,
      nom: 'Station Service Total',
      categorie: 'Carburant',
      icon: 'local_gas_station',
      description: 'Paiement rapide de votre plein via Mobile Money.',
    },
    {
      id: 3,
      nom: 'Boutique Mobile+',
      categorie: 'Téléphonie',
      icon: 'smartphone',
      description: 'Téléphones, accessoires et services mobiles.',
    },
  ];
}
