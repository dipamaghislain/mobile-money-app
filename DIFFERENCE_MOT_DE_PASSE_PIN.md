# 🔐 Différence entre MOT DE PASSE et CODE PIN

## 📋 Résumé Rapide

| Caractéristique | MOT DE PASSE | CODE PIN |
|----------------|--------------|----------|
| **Où ?** | Dans le modèle `User` | Dans le modèle `Wallet` |
| **Usage** | Se connecter à l'application | Valider les transactions financières |
| **Longueur** | Minimum 6 caractères | 4 à 6 chiffres |
| **Type** | Lettres, chiffres, symboles | Uniquement des chiffres |
| **Quand l'utiliser ?** | À chaque connexion | Pour retirer, transférer, payer |
| **Exemple** | `MonMotDePasse123!` | `1234` |

---

## 🔑 1. MOT DE PASSE (Password)

### C'est quoi ?
Le **mot de passe** est utilisé pour **se connecter** à votre compte dans l'application.

### Caractéristiques :
- ✅ Stocké dans le modèle `User` (utilisateur)
- ✅ Minimum 6 caractères
- ✅ Peut contenir lettres, chiffres, symboles
- ✅ Utilisé UNIQUEMENT pour la connexion
- ✅ Hashé avec bcrypt

### Code backend :
```javascript
// backend/src/models/User.js
motDePasse: {
  type: String,
  required: true,
  minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
  select: false, // Ne pas renvoyer par défaut
}
```

### Quand l'utiliser ?
- 🔐 Se connecter à l'application
- 🔐 Créer un compte
- 🔐 Réinitialiser le mot de passe

### Exemple :
```
Téléphone : 0612345678
Mot de passe : MonMotDePasse123!
→ Connexion réussie ✅
```

---

## 🔢 2. CODE PIN (Personal Identification Number)

### C'est quoi ?
Le **code PIN** est un code numérique court utilisé pour **valider les transactions financières** (retrait, transfert, paiement).

### Caractéristiques :
- ✅ Stocké dans le modèle `Wallet` (portefeuille)
- ✅ 4 à 6 chiffres uniquement
- ✅ Uniquement des chiffres (0-9)
- ✅ Utilisé pour les transactions financières
- ✅ Hashé avec bcrypt
- ✅ Blocage après 3 tentatives échouées (30 minutes)

### Code backend :
```javascript
// backend/src/models/Wallet.js
pin: {
  type: String,
  required: false, // Optionnel au début
  select: false, // Ne pas renvoyer par défaut
}
```

### Quand l'utiliser ?
- 💰 Retirer de l'argent
- 💰 Transférer de l'argent à quelqu'un
- 💰 Payer un commerçant
- 💰 Verser dans une tirelire

### Exemple :
```
Vous voulez retirer 5000 XOF
→ Entrez votre PIN : 1234
→ Retrait réussi ✅
```

---

## 🎯 Pourquoi deux codes différents ?

### Sécurité renforcée :
1. **Mot de passe** = Protection de l'accès à l'application
   - Si quelqu'un vole votre mot de passe, il peut se connecter
   - Mais il ne peut pas faire de transactions sans le PIN

2. **PIN** = Protection des transactions financières
   - Même si quelqu'un a accès à votre compte, il ne peut pas retirer/transférer sans le PIN
   - Double protection = Plus de sécurité

### Analogie bancaire :
- **Mot de passe** = Code de votre carte bancaire pour retirer au distributeur
- **PIN** = Code secret pour valider les paiements en ligne

---

## 📊 Tableau Comparatif Complet

| Aspect | MOT DE PASSE | CODE PIN |
|--------|--------------|----------|
| **Modèle** | `User` | `Wallet` |
| **Longueur** | ≥ 6 caractères | 4-6 chiffres |
| **Format** | Lettres + Chiffres + Symboles | Chiffres uniquement |
| **Usage** | Connexion | Transactions |
| **Obligatoire** | ✅ Oui (inscription) | ⚠️ Non (peut être défini plus tard) |
| **Blocage** | Non | ✅ Oui (3 tentatives = 30 min) |
| **Hash** | ✅ bcrypt | ✅ bcrypt |
| **Modifiable** | ✅ Oui | ✅ Oui |

---

## 🔄 Flux d'utilisation

### 1. Inscription :
```
1. Créer un compte avec téléphone + mot de passe
2. Un portefeuille est créé automatiquement
3. Le PIN n'est pas encore défini
```

### 2. Connexion :
```
1. Entrer téléphone + mot de passe
2. Accès au dashboard
```

### 3. Première transaction :
```
1. Cliquer sur "Retrait" ou "Transfert"
2. Si PIN non défini → Rediriger vers configuration PIN
3. Définir un PIN (4-6 chiffres)
4. Effectuer la transaction avec le PIN
```

### 4. Transactions suivantes :
```
1. Choisir une action (Retrait, Transfert, etc.)
2. Entrer le montant
3. Entrer le PIN
4. Transaction validée ✅
```

---

## ⚠️ Points Importants

### Le PIN est différent du mot de passe :
- ❌ Le PIN n'est **PAS** le mot de passe
- ❌ Vous ne pouvez **PAS** utiliser votre mot de passe comme PIN
- ✅ Ce sont **deux codes séparés** pour plus de sécurité

### Le PIN est optionnel au début :
- ✅ Vous pouvez créer un compte sans PIN
- ✅ Le PIN sera demandé lors de la première transaction nécessitant une validation
- ✅ Vous pouvez le définir dans les paramètres du portefeuille

### Sécurité du PIN :
- 🔒 Blocage après 3 tentatives incorrectes
- 🔒 Blocage de 30 minutes
- 🔒 Hashé avec bcrypt (jamais stocké en clair)

---

## 💡 Résumé en une phrase

**MOT DE PASSE** = Pour se connecter à l'application  
**CODE PIN** = Pour valider les transactions financières (retrait, transfert, paiement)
