import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DepositComponent } from './deposit';
import { TransactionService } from '../../../core/services/transaction.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DepositComponent', () => {
  let component: DepositComponent;
  let fixture: ComponentFixture<DepositComponent>;
  let transactionServiceSpy: jasmine.SpyObj<TransactionService>;

  beforeEach(async () => {
    transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['deposit']);

    await TestBed.configureTestingModule({
      imports: [DepositComponent, NoopAnimationsModule],
      providers: [
        { provide: TransactionService, useValue: transactionServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DepositComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form should be invalid when empty', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('form should be invalid with negative amount', () => {
    component.form.patchValue({ amount: -100, pin: '1234' });
    expect(component.form.valid).toBeFalsy();
    expect(component.form.controls.amount.errors?.['invalidAmount']).toBeTruthy();
  });

  it('form should be invalid with incorrect pin format', () => {
    component.form.controls.amount.setValue(1000);
    component.form.controls.pin.setValue('12a4');
    expect(component.form.valid).toBeFalsy();
    expect(component.form.controls.pin.errors?.['invalidPin']).toBeTruthy();
  });

  it('form should be valid with correct values', () => {
    component.form.controls.amount.setValue(1000);
    component.form.controls.pin.setValue('1234');
    expect(component.form.valid).toBeTruthy();
  });

  it('should call deposit service on submit', () => {
    transactionServiceSpy.deposit.and.returnValue(of({ message: 'Success' } as any));
    component.form.controls.amount.setValue(1000);
    component.form.controls.pin.setValue('1234');

    component.onSubmit();

    expect(transactionServiceSpy.deposit).toHaveBeenCalledWith({ montant: 1000, pin: '1234' });
    expect(component.success()).toBe('Dépôt effectué avec succès !');
  });
});
