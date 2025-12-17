# Spécification API - Mobile Money

## Documentation des Endpoints

Cette documentation sera complétée avec les détails de chaque endpoint.

### Base URL
```
http://localhost:3000/api
```

### Authentification
Toutes les routes protégées nécessitent un token JWT dans le header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Authentification

#### POST /api/auth/register
#### POST /api/auth/login
#### GET /api/auth/me

### 2. Portefeuille

#### GET /api/wallet
#### PATCH /api/wallet/pin
#### GET /api/wallet/transactions

### 3. Transactions

#### POST /api/transactions/deposit
#### POST /api/transactions/withdraw
#### POST /api/transactions/transfer
#### POST /api/transactions/merchant-payment

### 4. Épargne

#### GET /api/savings
#### POST /api/savings
#### POST /api/savings/:id/deposit
#### POST /api/savings/:id/withdraw

### 5. Administration

#### GET /api/admin/users
#### PATCH /api/admin/users/:id/status
#### GET /api/admin/transactions

