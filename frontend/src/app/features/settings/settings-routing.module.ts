import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { ChangePinComponent } from './change-pin/change-pin.component';

const routes: Routes = [
    {
        path: '',
        component: SettingsComponent
    },
    {
        path: 'change-pin',
        component: ChangePinComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SettingsRoutingModule { }

