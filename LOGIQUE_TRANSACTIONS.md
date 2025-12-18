# 📚 Logique des Transactions - Explication Détaillée

## 🎯 Vue d'ensemble

Dans une application de mobile money, il y a **4 types principaux de transactions** :

1. **DÉPÔT (DEPOSIT)** - Ajouter de l'argent à SON PROPRE compte
2. **RETRAIT (WITHDRAW)** - Retirer de l'argent de SON PROPRE compte  
3. **TRANSFERT (TRANSFER)** - Envoyer de l'argent à UN AUTRE utilisateur
4. **PAIEMENT MARCHAND (MERCHANT_PAYMENT)** - Payer un commerçant

---

## 💰 1. DÉPÔT (DEPOSIT)

### Logique métier :
```
Vous → [Dépôt] → Votre compte
```

### Comment ça fonctionne :
- **Source** : Vous (l'utilisateur connecté)
- **Destination** : Votre propre portefeuille
- **Action** : Ajoute de l'argent à votre solde
- **Bénéficiaire** : ❌ PAS BESOIN (c'est vous-même)
- **PIN** : ❌ PAS BESOIN (vous ajoutez de l'argent, pas de risque)

### Exemple :
```
Solde avant : 10 000 XOF
Dépôt : +5 000 XOF
Solde après : 15 000 XOF
```

### Code backend (ligne 19-81) :
```javascript
// Trouve VOTRE portefeuille (req.user.id)
const wallet = await Wallet.findOne({ utilisateurId: req.user.id });

// Crédite VOTRE compte
await wallet.crediter(amount);
```

---

## 💸 2. RETRAIT (WITHDRAW)

### Logique métier :
```
Votre compte → [Retrait] → Vous (espèces)
```

### Comment ça fonctionne :
- **Source** : Votre portefeuille
- **Destination** : Vous (vous retirez de l'argent)
- **Action** : Retire de l'argent de votre solde
- **Bénéficiaire** : ❌ PAS BESOIN (c'est vous-même)
- **PIN** : ✅ OBLIGATOIRE (sécurité - vous retirez de l'argent)

### Exemple :
```
Solde avant : 15 000 XOF
Retrait : -3 000 XOF
Solde après : 12 000 XOF
```

### Code backend (ligne 87-180) :
```javascript
// Vérifie le PIN (sécurité)
const isPinValid = await wallet.comparePin(pin);

// Débite VOTRE compte
await wallet.debiter(amount);
```

---

## 📤 3. TRANSFERT (TRANSFER)

### Logique métier :
```
Votre compte → [Transfert] → Compte d'un autre utilisateur
```

### Comment ça fonctionne :
- **Source** : Votre portefeuille
- **Destination** : Portefeuille d'un autre utilisateur
- **Action** : Envoie de l'argent à quelqu'un d'autre
- **Bénéficiaire** : ✅ OBLIGATOIRE (numéro de téléphone)
- **PIN** : ✅ OBLIGATOIRE (sécurité - vous envoyez de l'argent)

### Exemple :
```
Votre solde avant : 12 000 XOF
Solde destinataire avant : 5 000 XOF

Transfert : -2 000 XOF (vous)
            +2 000 XOF (destinataire)

Votre solde après : 10 000 XOF
Solde destinataire après : 7 000 XOF
```

### Code backend (ligne 186-338) :
```javascript
// Trouve le destinataire par son numéro de téléphone
const destinataire = await User.findOne({ telephone: telephoneDestinataire });

// Trouve son portefeuille
const walletDest = await Wallet.findOne({ utilisateurId: destinataire._id });

// Débite VOTRE compte
walletSource.solde -= amount;

// Crédite le compte du DESTINATAIRE
walletDest.solde += amount;
```

---

## 🏪 4. PAIEMENT MARCHAND (MERCHANT_PAYMENT)

### Logique métier :
```
Votre compte → [Paiement] → Compte d'un commerçant
```

### Comment ça fonctionne :
- **Source** : Votre portefeuille
- **Destination** : Portefeuille d'un commerçant
- **Action** : Payer un commerçant
- **Bénéficiaire** : ✅ OBLIGATOIRE (code marchand)
- **PIN** : ✅ OBLIGATOIRE (sécurité)

---

## 📊 Tableau Récapitulatif

| Type | Bénéficiaire requis ? | PIN requis ? | Pourquoi ? |
|------|----------------------|--------------|------------|
| **DÉPÔT** | ❌ Non | ❌ Non | Vous ajoutez de l'argent à votre compte |
| **RETRAIT** | ❌ Non | ✅ Oui | Sécurité - vous retirez de l'argent |
| **TRANSFERT** | ✅ Oui (téléphone) | ✅ Oui | Vous envoyez à quelqu'un d'autre |
| **PAIEMENT** | ✅ Oui (code marchand) | ✅ Oui | Vous payez un commerçant |

---

## 🔍 Pourquoi cette logique ?

### Dépôt sans PIN ni bénéficiaire :
- ✅ Vous ajoutez de l'argent = pas de risque de vol
- ✅ C'est votre compte = pas besoin de spécifier qui
- ✅ Simplicité = processus plus rapide

### Retrait avec PIN mais sans bénéficiaire :
- ✅ Sécurité = PIN requis car vous retirez de l'argent
- ✅ C'est votre compte = pas besoin de spécifier qui

### Transfert avec PIN et bénéficiaire :
- ✅ Sécurité = PIN requis
- ✅ Bénéficiaire = il faut savoir à qui envoyer l'argent

---

## 💡 Analogie Simple

Imaginez une **banque** :

- **DÉPÔT** = Vous déposez de l'argent à la banque dans votre compte
  - Pas besoin de dire à qui (c'est vous)
  - Pas besoin de code secret (vous ajoutez de l'argent)

- **RETRAIT** = Vous retirez de l'argent de votre compte
  - Pas besoin de dire à qui (c'est vous)
  - Besoin de code secret (sécurité)

- **TRANSFERT** = Vous envoyez de l'argent à quelqu'un
  - Besoin de dire à qui (numéro de compte/IBAN)
  - Besoin de code secret (sécurité)

---

## 🎯 Résumé en une phrase

**DÉPÔT** = Vous ajoutez de l'argent à votre compte → Pas besoin de bénéficiaire ni de PIN
