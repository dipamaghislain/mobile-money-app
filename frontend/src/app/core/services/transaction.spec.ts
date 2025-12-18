import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TransactionService } from './transaction.service';
import { environment } from '../../../environments/environment';

describe('TransactionService', () => {
  let service: TransactionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TransactionService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(TransactionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send deposit request', () => {
    const amount = 1000;
    const pin = '1234';

    service.deposit({ montant: amount, pin }).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/transactions/deposit`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ montant: amount, pin });
    req.flush({ message: 'Success' });
  });

  it('should send withdraw request', () => {
    service.withdraw({ montant: 500, pin: '1234' }).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/transactions/withdraw`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Success' });
  });
});
