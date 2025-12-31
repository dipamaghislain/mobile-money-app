# Transaction System - Multi-Country Implementation

## Overview

The Mobile Money application now supports **7 countries** with country-specific mobile money providers, currencies, and transaction rules.

---

## 1. Supported Countries

| Code | Country | Dial Code | Currency | Providers |
|------|---------|-----------|----------|-----------|
| BF | Burkina Faso | +226 | XOF | Orange Money, Mobicash, Moov Money |
| CI | Côte d'Ivoire | +225 | XOF | Orange Money, MTN Mobile Money, Moov Money |
| SN | Sénégal | +221 | XOF | Orange Money, Free Money, Wave |
| ML | Mali | +223 | XOF | Orange Money, Mobicash |
| CM | Cameroun | +237 | XAF | MTN Mobile Money, Orange Money |
| TG | Togo | +228 | XOF | Flooz, T-Money |
| BJ | Bénin | +229 | XOF | MTN Mobile Money, Moov Money |

---

## 2. Authentication Flow

### Login (Email-based)
```
POST /api/auth/login
{
  "email": "user@example.com",
  "motDePasse": "password123"
}
```

### Response
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "nomComplet": "Jean Dupont",
    "telephone": "+22670123456",
    "pays": "BF",
    "pinConfigured": false,
    "telephoneVerifie": false
  },
  "nextStep": "SETUP_PIN"
}
```

---

## 3. PIN System

### PIN Configuration Rules
- Length: 4-6 digits
- Cannot be simple patterns (1234, 0000, etc.)
- Cannot reuse last 3 PINs
- Securely hashed with bcrypt (salt: 12)

### PIN Security
- **3 failed attempts** → Lock for 30 minutes
- **6 failed attempts** → Lock for 2 hours
- **9 failed attempts** → Lock for 24 hours
- **12+ failed attempts** → Permanent lock (support required)

### API Endpoints

```
POST /api/v3/transactions/pin/setup
{
  "pin": "1234",
  "confirmPin": "1234"
}

POST /api/v3/transactions/pin/change
{
  "currentPin": "1234",
  "newPin": "5678",
  "confirmNewPin": "5678"
}

GET /api/v3/transactions/pin/status
→ Returns: { configured, locked, lockTimeRemaining, failedAttempts }
```

---

## 4. Phone Verification

Before performing transactions, users must verify their phone number.

```
POST /api/v3/transactions/phone/request-verification
→ Sends OTP via SMS

POST /api/v3/transactions/phone/verify
{
  "code": "123456"
}
```

---

## 5. Transaction Types

| Type | Description | PIN Required | Phone Verified |
|------|-------------|--------------|----------------|
| DEPOSIT | Deposit from Mobile Money | Optional | Yes |
| WITHDRAW | Withdraw to Mobile Money | Yes | Yes |
| TRANSFER | Transfer to another user | Yes | Yes |
| CROSS_BORDER | International transfer | Yes | Yes |
| MERCHANT_PAYMENT | Pay a merchant | Yes | Yes |

---

## 6. Transaction API Endpoints

### Deposit
```
POST /api/v3/transactions/deposit
{
  "montant": 10000,
  "telephoneSource": "70123456",
  "operateur": "Orange Money",
  "pin": "1234"  // optional
}
```

### Withdrawal
```
POST /api/v3/transactions/withdraw
{
  "montant": 5000,
  "telephoneDestination": "70123456",
  "operateur": "Orange Money",
  "pin": "1234"  // required
}
```

### Transfer
```
POST /api/v3/transactions/transfer
{
  "montant": 15000,
  "telephoneDestination": "0701234567",
  "paysDestination": "CI",  // for cross-border
  "description": "Paiement facture",
  "pin": "1234"  // required
}
```

### Validate Recipient (before transfer)
```
POST /api/v3/transactions/validate-recipient
{
  "telephone": "0701234567",
  "pays": "CI"
}
```

### Calculate Fees
```
POST /api/v3/transactions/calculate-fees
{
  "montant": 10000,
  "type": "TRANSFER",
  "paysDestination": "CI"
}
```

---

## 7. Fee Structure

| Transaction Type | Same Country | Cross-Border |
|-----------------|--------------|--------------|
| Deposit | 0% | N/A |
| Withdrawal | 1.5% | N/A |
| Transfer | 1% | 2.5-3% |

---

## 8. Transaction Limits (per country)

### Burkina Faso (BF)
| Limit | Amount (XOF) |
|-------|--------------|
| Min Deposit | 100 |
| Max Deposit | 2,000,000 |
| Min Withdrawal | 500 |
| Max Withdrawal | 500,000 |
| Min Transfer | 100 |
| Max Transfer | 1,000,000 |
| Max Balance | 2,000,000 |

*Limits vary by country and KYC level*

---

## 9. Data Models

### User Model (Updated)
```javascript
{
  email: String,              // Login identifier
  motDePasse: String,         // Hashed password
  nomComplet: String,
  telephone: String,          // For transactions
  telephoneVerifie: Boolean,  // Must be true for transactions
  pays: String,               // Country code
  devise: String,             // Currency
  
  // PIN Security
  codePin: String,            // Hashed PIN
  pinConfigured: Boolean,
  pinModifieLe: Date,
  historiquePin: [{ hash, date }],
  tentativesPinEchouees: Number,
  pinBloqueJusqua: Date,
  niveauBlocagePin: Number    // 0-4
}
```

### Transaction Model (Updated)
```javascript
{
  reference: String,          // Unique reference (TXN-XXX-XXX)
  type: String,               // DEPOSIT, WITHDRAW, TRANSFER, etc.
  montant: Number,
  devise: String,
  
  // Country Information
  paysSource: String,
  telephoneSource: String,
  operateurSource: String,
  paysDestination: String,
  telephoneDestination: String,
  operateurDestination: String,
  
  // Cross-border
  tauxChange: Number,
  montantConverti: Number,
  deviseDestination: String,
  
  // Mobile Money Provider
  providerTransaction: {
    providerId: String,
    providerName: String,
    providerStatus: String
  },
  
  // Security
  pinVerified: Boolean,
  ipAddress: String,
  userAgent: String
}
```

---

## 10. Error Codes

| Code | Message |
|------|---------|
| 400 | Invalid request / validation error |
| 401 | Invalid PIN |
| 403 | Phone not verified / Account blocked |
| 404 | User/Wallet/Transaction not found |
| 423 | PIN locked |
| 429 | Too many requests |

---

## 11. Security Features

1. **Email-based authentication** - Separates login from transaction credentials
2. **Phone verification** - Required before any transaction
3. **PIN protection** - Required for withdrawals and transfers
4. **Progressive lockout** - Exponential backoff on failed PIN attempts
5. **PIN history** - Prevents reuse of recent PINs
6. **Transaction logging** - IP, User-Agent, timestamps
7. **Country validation** - Phone format validation per country
8. **Cross-border detection** - Automatic fee adjustment

---

## 12. Frontend Components

### Login Page
- Email/password authentication
- Modern orange gradient design
- Animated background

### Register Page  
- Email, name, country, phone fields
- Password with confirmation
- PIN setup reminder
- Consistent design with login

### Setup PIN Page
- PIN input with confirmation
- Security rules display
- Lock status indicator

---

## 13. API Routes Summary

```
# Authentication
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
PUT  /api/auth/profile
PUT  /api/auth/password

# Transactions v3 (Multi-country)
GET  /api/v3/transactions/countries
GET  /api/v3/transactions/country/:code
POST /api/v3/transactions/deposit
POST /api/v3/transactions/withdraw
POST /api/v3/transactions/transfer
POST /api/v3/transactions/validate-recipient
POST /api/v3/transactions/calculate-fees
GET  /api/v3/transactions/history
GET  /api/v3/transactions/:id

# PIN Management
POST /api/v3/transactions/pin/setup
POST /api/v3/transactions/pin/change
POST /api/v3/transactions/pin/verify
GET  /api/v3/transactions/pin/status

# Phone Verification
POST /api/v3/transactions/phone/request-verification
POST /api/v3/transactions/phone/verify
```
