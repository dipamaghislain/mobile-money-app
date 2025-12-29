import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile-view/profile-view').then(m => m.ProfileView)
  },
  {
    path: 'edit',
    loadComponent: () => import('./profile-edit/profile-edit').then(m => m.ProfileEdit)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule { }
