# 📋 Plan d'Implémentation - Fonctionnalités Production

## 🎯 Vue d'ensemble

Ce document liste les fonctionnalités à implémenter pour rendre l'application prête pour la production.

---

## ✅ Fonctionnalités Déjà Implémentées

- ✅ Authentification (login, register)
- ✅ Transactions (dépôt, retrait, transfert, paiement marchand)
- ✅ Gestion du portefeuille
- ✅ Changement de PIN
- ✅ Changement de mot de passe (backend)
- ✅ Dashboard avec transactions récentes
- ✅ Profil utilisateur
- ✅ Épargne (savings)
- ✅ Administration

---

## 🚀 Fonctionnalités à Implémenter

### 🔴 Priorité HAUTE (Critique pour production)

#### 1. Réinitialisation de mot de passe (Forgot Password)
**Status:** ⚠️ Partiellement implémenté (composant vide)

**Backend:**
- [ ] Endpoint `POST /api/auth/forgot-password` (générer token de réinitialisation)
- [ ] Endpoint `POST /api/auth/reset-password` (réinitialiser avec token)
- [ ] Modèle User: ajouter `resetPasswordToken` et `resetPasswordExpires`
- [ ] Envoi d'email avec lien de réinitialisation (ou SMS)

**Frontend:**
- [ ] Composant `forgot-password` complet
- [ ] Composant `reset-password` (page avec token)
- [ ] Intégration dans le routing
- [ ] Service auth avec méthodes `forgotPassword()` et `resetPassword()`

**Estimation:** 4-6 heures

---

#### 2. Changement de mot de passe dans le profil
**Status:** ✅ Backend OK, ⚠️ Frontend manquant

**Frontend:**
- [ ] Modal de changement de mot de passe dans `profile-view`
- [ ] Formulaire avec validation (ancien, nouveau, confirmation)
- [ ] Intégration avec `AuthService.changePassword()`

**Estimation:** 2-3 heures

---

#### 3. Export des transactions
**Status:** ❌ Non implémenté

**Backend:**
- [ ] Endpoint `GET /api/wallet/transactions/export?format=pdf|csv`
- [ ] Génération PDF avec bibliothèque (pdfkit ou puppeteer)
- [ ] Génération CSV

**Frontend:**
- [ ] Bouton "Exporter" dans l'historique des transactions
- [ ] Sélection du format (PDF/CSV)
- [ ] Téléchargement du fichier

**Estimation:** 4-5 heures

---

### 🟡 Priorité MOYENNE (Important pour UX)

#### 4. Statistiques et graphiques
**Status:** ⚠️ Backend partiel (endpoint existe mais non utilisé)

**Backend:**
- [ ] Améliorer l'endpoint `/api/wallet/statistics`
- [ ] Retourner données pour graphiques (revenus/dépenses par période)

**Frontend:**
- [ ] Composant graphiques (Chart.js déjà installé)
- [ ] Graphique revenus/dépenses (ligne)
- [ ] Graphique par type de transaction (camembert)
- [ ] Graphique évolution du solde (ligne)
- [ ] Intégration dans le dashboard

**Estimation:** 6-8 heures

---

#### 5. Filtres avancés pour transactions
**Status:** ⚠️ Partiellement implémenté (backend supporte, frontend basique)

**Frontend:**
- [ ] Interface de filtres (date, type, montant min/max, statut)
- [ ] Recherche par référence
- [ ] Tri (date, montant, type)
- [ ] Pagination améliorée

**Estimation:** 4-5 heures

---

#### 6. Notifications en temps réel
**Status:** ❌ Non implémenté

**Backend:**
- [ ] WebSocket ou Server-Sent Events (SSE)
- [ ] Notification lors de transaction reçue
- [ ] Notification lors de changement de solde

**Frontend:**
- [ ] Service de notifications
- [ ] Badge sur icône notifications
- [ ] Liste des notifications
- [ ] Marquer comme lu

**Estimation:** 8-10 heures

---

### 🟢 Priorité BASSE (Améliorations)

#### 7. Validation de numéro de téléphone
**Status:** ⚠️ Basique (regex seulement)

**Backend:**
- [ ] Intégration API de validation (optionnel)
- [ ] Vérification format international

**Frontend:**
- [ ] Masque de saisie téléphone
- [ ] Validation en temps réel
- [ ] Suggestion de format

**Estimation:** 2-3 heures

---

#### 8. QR Code pour paiements
**Status:** ❌ Non implémenté

**Backend:**
- [ ] Génération QR Code avec données transaction
- [ ] Endpoint pour scanner QR Code

**Frontend:**
- [ ] Génération QR Code pour recevoir paiement
- [ ] Scanner QR Code pour payer
- [ ] Bibliothèque QR Code (qrcode.js)

**Estimation:** 6-8 heures

---

#### 9. Amélioration gestion erreurs
**Status:** ⚠️ Basique

**Backend:**
- [ ] Logging structuré (Winston)
- [ ] Rate limiting
- [ ] Validation améliorée des entrées
- [ ] Messages d'erreur plus descriptifs

**Frontend:**
- [ ] Service de logging
- [ ] Gestion erreurs centralisée
- [ ] Messages d'erreur utilisateur-friendly
- [ ] Retry automatique pour erreurs réseau

**Estimation:** 4-6 heures

---

#### 10. Tests E2E
**Status:** ❌ Non implémenté

**Backend:**
- [ ] Tests d'intégration API complets
- [ ] Tests de performance

**Frontend:**
- [ ] Tests E2E avec Cypress ou Playwright
- [ ] Tests de composants critiques

**Estimation:** 10-15 heures

---

## 📊 Résumé

| Priorité | Fonctionnalités | Temps estimé |
|----------|----------------|--------------|
| 🔴 Haute | 3 | 10-14 heures |
| 🟡 Moyenne | 3 | 18-23 heures |
| 🟢 Basse | 4 | 22-32 heures |
| **TOTAL** | **10** | **50-69 heures** |

---

## 🎯 Plan d'Action Recommandé

### Phase 1 (Semaine 1) - Critiques
1. Réinitialisation de mot de passe
2. Changement de mot de passe dans profil
3. Export des transactions

### Phase 2 (Semaine 2) - UX
4. Statistiques et graphiques
5. Filtres avancés
6. Notifications (optionnel)

### Phase 3 (Semaine 3+) - Améliorations
7. Validation téléphone
8. QR Code
9. Amélioration erreurs
10. Tests E2E

---

## 📝 Notes

- Les estimations sont pour un développeur expérimenté
- Certaines fonctionnalités peuvent nécessiter des services externes (email, SMS)
- Les tests peuvent être faits en parallèle du développement



