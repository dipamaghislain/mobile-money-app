# 📱 Application Mobile Money – Backend & Frontend

> **Plateforme complète de gestion de portefeuille électronique et de transactions financières mobiles**

---

## 📋 Table des matières

1. [Présentation générale du projet](#1-présentation-générale-du-projet)
2. [Fonctionnalités développées](#2-fonctionnalités-développées)
3. [Technologies utilisées](#3-technologies-utilisées)
4. [Architecture globale de l'application](#4-architecture-globale-de-lapplication)
5. [Modélisation de la base de données](#5-modélisation-de-la-base-de-données)
6. [API REST développées](#6-api-rest-développées)
7. [Structure du projet](#7-structure-du-projet)
8. [Installation et configuration](#8-installation-et-configuration)
9. [Lancement et utilisation](#9-lancement-et-utilisation)
10. [Tests de l'application](#10-tests-de-lapplication)
11. [Gestion des versions et itérations](#11-gestion-des-versions-et-itérations)
12. [Livrables du projet](#12-livrables-du-projet)
13. [Perspectives d'évolution](#13-perspectives-dévolution)
14. [Auteurs](#14-auteurs)

---

## 1. Présentation générale du projet

### 1.1 Description

L'application **Mobile Money** est une plateforme web complète permettant aux utilisateurs de gérer un portefeuille électronique (wallet) et d'effectuer des transactions financières de manière sécurisée. Elle reproduit les fonctionnalités essentielles des services de mobile money largement utilisés en Afrique de l'Ouest (Orange Money, MTN Mobile Money, Wave, etc.).

### 1.2 Objectifs du projet

- **Objectif principal** : Développer une application full-stack fonctionnelle démontrant la maîtrise des technologies web modernes
- **Objectif pédagogique** : Appliquer les concepts d'architecture REST, d'authentification sécurisée et de gestion de bases de données NoSQL
- **Objectif technique** : Implémenter un système transactionnel robuste avec gestion des erreurs et validation des données

### 1.3 Contexte académique

Ce projet s'inscrit dans le cadre d'un cours universitaire portant sur le développement d'applications web full-stack. Il vise à consolider les compétences en :

- Conception et développement d'APIs RESTful
- Création d'interfaces utilisateur modernes et réactives
- Gestion de bases de données NoSQL
- Sécurisation des applications web
- Versionnement et collaboration avec Git/GitHub

### 1.4 Acteurs du système

| Acteur | Rôle | Permissions |
|--------|------|-------------|
| **Utilisateur** | Client final de l'application | Inscription, connexion, dépôt, retrait, transfert, consultation de l'historique |
| **Administrateur** | Gestionnaire de la plateforme | Gestion des utilisateurs, consultation de toutes les transactions, paramétrage système, statistiques globales |

---

## 2. Fonctionnalités développées

### 2.1 Fonctionnalités Backend

#### Authentification et gestion des utilisateurs
- ✅ Inscription avec validation des données (email, téléphone, mot de passe)
- ✅ Connexion sécurisée avec génération de token JWT
- ✅ Gestion des sessions et expiration des tokens
- ✅ Récupération et mise à jour du profil utilisateur
- ✅ Changement de mot de passe sécurisé
- ✅ Gestion du code PIN pour les transactions

#### Gestion du wallet (portefeuille)
- ✅ Création automatique du wallet à l'inscription
- ✅ Consultation du solde en temps réel
- ✅ Support multi-devises (XOF, XAF, GNF, etc.)
- ✅ Historique des mouvements du wallet

#### Transactions financières
- ✅ **Dépôt** : Alimentation du compte via opérateur mobile
- ✅ **Retrait** : Retrait d'argent du portefeuille
- ✅ **Transfert** : Envoi d'argent vers un autre utilisateur
- ✅ Calcul automatique des frais de transaction
- ✅ Gestion des plafonds journaliers et mensuels
- ✅ Validation par code PIN

#### Historique et traçabilité
- ✅ Historique complet des transactions
- ✅ Filtrage par type, date, statut
- ✅ Pagination des résultats
- ✅ Export des données

#### Sécurité
- ✅ Hashage des mots de passe (bcrypt)
- ✅ Hashage des codes PIN
- ✅ Authentification JWT avec expiration
- ✅ Protection des routes sensibles
- ✅ Validation et sanitization des entrées
- ✅ Gestion des tentatives de connexion échouées

### 2.2 Fonctionnalités Frontend

#### Interfaces d'authentification
- ✅ Page d'inscription avec formulaire validé
- ✅ Page de connexion responsive
- ✅ Gestion des erreurs d'authentification
- ✅ Redirection automatique après connexion

#### Tableau de bord utilisateur
- ✅ Affichage du solde actuel
- ✅ Aperçu des dernières transactions
- ✅ Accès rapide aux fonctionnalités principales
- ✅ Statistiques personnelles (dépôts, retraits, transferts)

#### Gestion des transactions
- ✅ Formulaire de dépôt avec sélection d'opérateur
- ✅ Formulaire de retrait avec validation du solde
- ✅ Formulaire de transfert avec recherche de destinataire
- ✅ Confirmation avant exécution
- ✅ Affichage des frais en temps réel

#### Historique des transactions
- ✅ Liste paginée des transactions
- ✅ Filtres par type et période
- ✅ Détails de chaque transaction
- ✅ Indicateurs visuels de statut

#### Interface d'administration
- ✅ Dashboard avec KPIs globaux
- ✅ Gestion des utilisateurs (liste, détails, statut)
- ✅ Consultation de toutes les transactions
- ✅ Statistiques et graphiques

#### Expérience utilisateur
- ✅ Design moderne avec Material Design
- ✅ Interface responsive (mobile-first)
- ✅ Messages de confirmation et d'erreur
- ✅ Animations et transitions fluides
- ✅ Navigation intuitive avec boutons retour

---

## 3. Technologies utilisées

### 3.1 Backend

| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| **Node.js** | 18.x+ | Environnement d'exécution JavaScript côté serveur |
| **Express.js** | 4.x | Framework web pour la création d'APIs REST |
| **MongoDB** | 6.x+ | Base de données NoSQL orientée documents |
| **Mongoose** | 8.x | ODM pour la modélisation des données MongoDB |
| **JWT** | - | Authentification stateless par tokens |
| **bcrypt** | - | Hashage sécurisé des mots de passe et PIN |
| **express-validator** | - | Validation des données entrantes |
| **cors** | - | Gestion des requêtes cross-origin |
| **dotenv** | - | Gestion des variables d'environnement |

### 3.2 Frontend

| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| **Angular** | 18.x | Framework frontend moderne et robuste |
| **Angular Material** | 18.x | Bibliothèque de composants UI Material Design |
| **TypeScript** | 5.x | Typage statique pour JavaScript |
| **RxJS** | 7.x | Programmation réactive et gestion des flux de données |
| **SCSS** | - | Préprocesseur CSS pour des styles maintenables |

#### Justification du choix d'Angular

Angular a été choisi pour les raisons suivantes :

1. **Architecture robuste** : Structure modulaire et séparation claire des responsabilités
2. **TypeScript natif** : Typage fort réduisant les erreurs à l'exécution
3. **Angular Material** : Composants UI professionnels prêts à l'emploi
4. **Injection de dépendances** : Facilite les tests et la maintenance
5. **CLI puissant** : Génération de code et optimisation automatisée
6. **Adapté aux applications d'entreprise** : Idéal pour les applications financières

### 3.3 Outils de développement

| Outil | Utilisation |
|-------|-------------|
| **Git** | Versionnement du code source |
| **GitHub** | Hébergement du dépôt et collaboration |
| **VS Code** | Éditeur de code avec extensions Angular et Node.js |
| **Postman** | Tests et documentation des APIs |
| **MongoDB Compass** | Interface graphique pour MongoDB |
| **npm** | Gestionnaire de paquets Node.js |

---

## 4. Architecture globale de l'application

### 4.1 Architecture générale

L'application suit une architecture **client-serveur** avec une séparation claire entre le frontend et le backend :

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │  HTTP   │                 │  Query  │                 │
│    Frontend     │ ◄─────► │    Backend      │ ◄─────► │    MongoDB      │
│    (Angular)    │  REST   │   (Express)     │         │   (Database)    │
│                 │  JSON   │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
     Port 4200                   Port 4000                  Port 27017
```

### 4.2 Flux de communication

1. **Requête utilisateur** : L'utilisateur interagit avec l'interface Angular
2. **Appel API** : Angular envoie une requête HTTP au backend Express
3. **Traitement** : Le backend valide, traite et interroge MongoDB
4. **Réponse** : Les données sont renvoyées au format JSON
5. **Affichage** : Angular met à jour l'interface utilisateur

### 4.3 Architecture backend (MVC)

```
Backend/
├── Controllers/    → Logique métier et traitement des requêtes
├── Models/         → Schémas Mongoose et modèles de données
├── Routes/         → Définition des endpoints API
├── Middleware/     → Authentification, validation, logging
├── Services/       → Logique métier réutilisable
├── Utils/          → Fonctions utilitaires
└── Config/         → Configuration de l'application
```

### 4.4 Architecture frontend (Modulaire)

```
Frontend/
├── Core/           → Services singleton, guards, interceptors
├── Shared/         → Composants et pipes réutilisables
├── Features/       → Modules fonctionnels (auth, dashboard, admin)
├── Environments/   → Configuration par environnement
└── Assets/         → Ressources statiques
```

---

## 5. Modélisation de la base de données

### 5.1 Collections MongoDB

#### Collection `users`

Stocke les informations des utilisateurs de la plateforme.

| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Identifiant unique |
| `nom` | String | Nom de famille |
| `prenom` | String | Prénom |
| `email` | String | Adresse email (unique) |
| `telephone` | String | Numéro de téléphone (unique) |
| `motDePasse` | String | Mot de passe hashé |
| `pin` | String | Code PIN hashé (4-6 chiffres) |
| `role` | String | Rôle (user, admin) |
| `pays` | String | Code pays (SN, CI, ML, etc.) |
| `statut` | String | Statut du compte (actif, inactif, suspendu) |
| `dateCreation` | Date | Date de création du compte |
| `derniereConnexion` | Date | Dernière connexion |

#### Collection `wallets`

Gère les portefeuilles électroniques des utilisateurs.

| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Identifiant unique |
| `userId` | ObjectId | Référence vers l'utilisateur |
| `solde` | Number | Solde actuel |
| `devise` | String | Devise (XOF, XAF, GNF) |
| `statut` | String | Statut du wallet |
| `limiteJournaliere` | Number | Plafond journalier |
| `limiteMensuelle` | Number | Plafond mensuel |
| `dateCreation` | Date | Date de création |

#### Collection `transactions`

Enregistre toutes les opérations financières.

| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Identifiant unique |
| `reference` | String | Référence unique de transaction |
| `type` | String | Type (depot, retrait, transfert) |
| `montant` | Number | Montant de la transaction |
| `frais` | Number | Frais appliqués |
| `expediteur` | ObjectId | Utilisateur source |
| `destinataire` | ObjectId | Utilisateur cible (transfert) |
| `operateur` | String | Opérateur mobile |
| `statut` | String | Statut (pending, completed, failed) |
| `dateCreation` | Date | Date de la transaction |

#### Collection `notifications`

Gère les notifications utilisateur.

| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Identifiant unique |
| `userId` | ObjectId | Destinataire |
| `titre` | String | Titre de la notification |
| `message` | String | Contenu |
| `type` | String | Type de notification |
| `lu` | Boolean | Statut de lecture |
| `dateCreation` | Date | Date de création |

#### Collection `savingsgoals`

Gère les objectifs d'épargne.

| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Identifiant unique |
| `userId` | ObjectId | Propriétaire |
| `nom` | String | Nom de l'objectif |
| `montantCible` | Number | Montant à atteindre |
| `montantActuel` | Number | Montant épargné |
| `dateEcheance` | Date | Date limite |
| `statut` | String | Statut de l'objectif |

### 5.2 Relations entre collections

```
users ──────┬────── 1:1 ────── wallets
            │
            ├────── 1:N ────── transactions
            │
            ├────── 1:N ────── notifications
            │
            └────── 1:N ────── savingsgoals
```

---

## 6. API REST développées

### 6.1 Endpoints d'authentification

> **Note** : Les endpoints `register` et `login` ne nécessitent pas d'authentification car ils permettent justement d'obtenir un token JWT. L'utilisateur doit pouvoir créer un compte ou se connecter sans être préalablement authentifié.

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/api/auth/register` | Inscription d'un nouvel utilisateur | Non (public) |
| `POST` | `/api/auth/login` | Connexion et obtention du token JWT | Non (public) |
| `GET` | `/api/auth/profile` | Récupération du profil connecté | Oui |
| `PUT` | `/api/auth/profile` | Mise à jour du profil | Oui |
| `PUT` | `/api/auth/change-password` | Changement de mot de passe | Oui |
| `POST` | `/api/auth/setup-pin` | Configuration du code PIN | Oui |
| `PUT` | `/api/auth/change-pin` | Modification du code PIN | Oui |

### 6.2 Endpoints du wallet

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/wallet` | Récupération des informations du wallet | Oui |
| `GET` | `/api/wallet/balance` | Consultation du solde | Oui |
| `GET` | `/api/wallet/limits` | Consultation des limites | Oui |

### 6.3 Endpoints des transactions

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/api/v3/transactions/deposit` | Effectuer un dépôt | Oui |
| `POST` | `/api/v3/transactions/withdraw` | Effectuer un retrait | Oui |
| `POST` | `/api/v3/transactions/transfer` | Effectuer un transfert | Oui |
| `GET` | `/api/v3/transactions/history` | Historique des transactions | Oui |
| `GET` | `/api/v3/transactions/:id` | Détails d'une transaction | Oui |
| `GET` | `/api/v3/transactions/fees` | Calcul des frais | Oui |

### 6.4 Endpoints d'administration

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/admin/dashboard` | Statistiques globales | Admin |
| `GET` | `/api/admin/users` | Liste des utilisateurs | Admin |
| `GET` | `/api/admin/users/:id` | Détails d'un utilisateur | Admin |
| `PUT` | `/api/admin/users/:id/status` | Modifier le statut d'un utilisateur | Admin |
| `GET` | `/api/admin/transactions` | Toutes les transactions | Admin |
| `GET` | `/api/admin/stats` | Statistiques détaillées | Admin |

### 6.5 Endpoints des notifications

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/notifications` | Liste des notifications | Oui |
| `PUT` | `/api/notifications/:id/read` | Marquer comme lue | Oui |
| `PUT` | `/api/notifications/read-all` | Tout marquer comme lu | Oui |
| `DELETE` | `/api/notifications/:id` | Supprimer une notification | Oui |

### 6.6 Endpoints d'épargne

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/savings` | Liste des objectifs | Oui |
| `POST` | `/api/savings` | Créer un objectif | Oui |
| `PUT` | `/api/savings/:id` | Modifier un objectif | Oui |
| `POST` | `/api/savings/:id/contribute` | Contribuer à l'épargne | Oui |
| `DELETE` | `/api/savings/:id` | Supprimer un objectif | Oui |

---

## 7. Structure du projet

### 7.1 Arborescence backend

```
backend/
├── src/
│   ├── app.js                    # Configuration Express
│   ├── server.js                 # Point d'entrée serveur
│   ├── config/
│   │   ├── database.js           # Configuration MongoDB
│   │   ├── env.js                # Variables d'environnement
│   │   ├── constants.js          # Constantes de l'application
│   │   ├── countries.js          # Configuration des pays
│   │   └── security.js           # Configuration sécurité
│   ├── controllers/
│   │   ├── authController.js     # Logique d'authentification
│   │   ├── walletController.js   # Gestion du wallet
│   │   ├── transactionController.v3.js  # Transactions
│   │   ├── adminController.js    # Administration
│   │   ├── notificationController.js    # Notifications
│   │   └── savingsController.js  # Épargne
│   ├── models/
│   │   ├── User.js               # Modèle utilisateur
│   │   ├── Wallet.js             # Modèle wallet
│   │   ├── Transaction.js        # Modèle transaction
│   │   ├── Notification.js       # Modèle notification
│   │   └── SavingsGoal.js        # Modèle épargne
│   ├── routes/
│   │   ├── authRoutes.js         # Routes authentification
│   │   ├── walletRoutes.js       # Routes wallet
│   │   ├── transactionRoutes.v3.js  # Routes transactions
│   │   ├── adminRoutes.js        # Routes admin
│   │   ├── notificationRoutes.js # Routes notifications
│   │   └── savingsRoutes.js      # Routes épargne
│   ├── middleware/
│   │   ├── auth.js               # Middleware JWT
│   │   └── validate.js           # Middleware validation
│   ├── services/
│   │   ├── transactionService.js # Service transactions
│   │   ├── notificationService.js # Service notifications
│   │   ├── otpService.js         # Service OTP
│   │   └── pinService.js         # Service PIN
│   ├── utils/
│   │   ├── ApiError.js           # Gestion des erreurs
│   │   ├── ApiResponse.js        # Réponses standardisées
│   │   └── logger.js             # Logging
│   └── validators/
│       └── transactionValidator.js # Validation transactions
├── tests/
│   ├── integration/              # Tests d'intégration
│   └── unit/                     # Tests unitaires
├── scripts/                      # Scripts utilitaires
├── package.json                  # Dépendances et scripts
├── jest.config.js                # Configuration des tests
└── .env                          # Variables d'environnement
```

### 7.2 Arborescence frontend

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/           # Guards de route
│   │   │   ├── interceptors/     # Intercepteurs HTTP
│   │   │   └── services/         # Services singleton
│   │   │       ├── auth.service.ts
│   │   │       ├── wallet.service.ts
│   │   │       ├── transaction.service.ts
│   │   │       └── notification.service.ts
│   │   ├── shared/
│   │   │   ├── components/       # Composants réutilisables
│   │   │   └── pipes/            # Pipes personnalisés
│   │   ├── features/
│   │   │   ├── auth/             # Module authentification
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── dashboard/        # Module tableau de bord
│   │   │   ├── transactions/     # Module transactions
│   │   │   │   ├── deposit/
│   │   │   │   ├── withdraw/
│   │   │   │   ├── transfer/
│   │   │   │   └── history/
│   │   │   ├── admin/            # Module administration
│   │   │   │   ├── admin-dashboard/
│   │   │   │   ├── admin-users/
│   │   │   │   └── admin-transactions/
│   │   │   ├── savings/          # Module épargne
│   │   │   ├── notifications/    # Module notifications
│   │   │   ├── profile/          # Module profil
│   │   │   └── settings/         # Module paramètres
│   │   ├── app.component.ts      # Composant racine
│   │   ├── app.config.ts         # Configuration
│   │   └── app.routes.ts         # Routes principales
│   ├── environments/
│   │   ├── environment.ts        # Développement
│   │   └── environment.prod.ts   # Production
│   ├── styles.scss               # Styles globaux
│   └── index.html                # Page HTML principale
├── angular.json                  # Configuration Angular
├── package.json                  # Dépendances
├── tsconfig.json                 # Configuration TypeScript
└── proxy.conf.json               # Proxy développement
```

---

## 8. Installation et configuration

### 8.1 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

| Logiciel | Version minimale | Vérification |
|----------|------------------|--------------|
| **Node.js** | 18.x ou supérieur | `node --version` |
| **npm** | 9.x ou supérieur | `npm --version` |
| **MongoDB** | 6.x ou supérieur | `mongod --version` |
| **Git** | 2.x ou supérieur | `git --version` |


### 8.2 Installation du backend

```bash
# Accéder au dossier backend
cd backend

# Installer les dépendances
npm install
```

#### Configuration du fichier .env

Créer un fichier `.env` à la racine du dossier `backend` :

```env
# Configuration serveur
PORT=4000
NODE_ENV=development

# Base de données MongoDB
MONGODB_URI=mongodb://localhost:27017/mobile_money

# JWT Configuration
JWT_SECRET=votre_clef_secrete_jwt_tres_longue_et_complexe
JWT_EXPIRES_IN=7d

# Sécurité
BCRYPT_ROUNDS=10

# Logs
LOG_LEVEL=debug
```

### 8.4 Installation du frontend

```bash
# Accéder au dossier frontend
cd ../frontend

# Installer les dépendances
npm install
```

#### Configuration de l'environnement

Le fichier `src/environments/environment.ts` est déjà configuré :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:4000/api'
};
```

---

## 9. Lancement et utilisation

### 9.1 Démarrage de MongoDB

```bash
# Windows - Démarrer le service MongoDB
net start MongoDB

# Ou lancer manuellement
mongod --dbpath="C:\data\db"
```

### 9.2 Démarrage du backend

```bash
# Depuis le dossier backend
cd backend

# Mode développement (avec rechargement automatique)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur `http://localhost:4000`

### 9.3 Démarrage du frontend

```bash
# Depuis le dossier frontend
cd frontend

# Démarrer le serveur de développement
ng serve
# ou
npm start
```

L'application est accessible sur `http://localhost:4200`

### 9.4 Comptes de test

| Type | Email | Mot de passe | PIN |
|------|-------|--------------|-----|
| **Admin** | admin@mobilemoney.com | Admin2025! | - |
| **Utilisateur 1** | amadou.traore@gmail.com | Secure2025! | 847291 |
| **Utilisateur 2** | fatou.diallo@gmail.com | Secure2025! | 123456 |

### 9.5 Utilisation de l'application

1. **Inscription** : Créer un compte via le formulaire d'inscription
2. **Connexion** : Se connecter avec email et mot de passe
3. **Configuration PIN** : Définir un code PIN pour les transactions
4. **Dépôt** : Alimenter le compte via un opérateur mobile
5. **Transfert** : Envoyer de l'argent à un autre utilisateur
6. **Retrait** : Retirer de l'argent du portefeuille
7. **Historique** : Consulter l'historique des transactions

---

## 10. Tests de l'application

### 10.1 Tests des API avec Postman

#### Collection de tests

1. **Importer la collection** : Fichier `postman_collection.json` fourni
2. **Configurer l'environnement** : Variable `baseUrl` = `http://localhost:4000/api`
3. **Exécuter les tests** : Utiliser le Runner Postman

#### Exemple de test - Dépôt

```http
POST http://localhost:4000/api/v3/transactions/deposit
Authorization: Bearer <token>
Content-Type: application/json

{
  "montant": 50000,
  "operateur": "Orange",
  "pin": "847291"
}
```

### 10.2 Tests unitaires backend

```bash
# Exécuter tous les tests
cd backend
npm test

# Exécuter avec couverture
npm run test:coverage
```

### 10.3 Scénario de test complet

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Inscription | Compte créé, wallet initialisé à 0 |
| 2 | Connexion | Token JWT reçu |
| 3 | Configuration PIN | PIN enregistré |
| 4 | Dépôt 50 000 FCFA | Solde = 50 000 FCFA |
| 5 | Transfert 10 000 FCFA | Solde = 39 500 FCFA (avec frais) |
| 6 | Consultation historique | 2 transactions listées |
| 7 | Retrait 20 000 FCFA | Solde = 19 100 FCFA (avec frais) |

---

## 11. Gestion des versions et itérations

### 11.1 Principe de développement

Le projet a été développé selon une approche **itérative et incrémentale** :

- **Itération 1** : Setup projet, authentification de base
- **Itération 2** : Gestion du wallet et transactions simples
- **Itération 3** : Interface utilisateur et intégration
- **Itération 4** : Administration et fonctionnalités avancées
- **Itération 5** : Tests, optimisations et documentation

### 11.2 Bonnes pratiques Git appliquées

- ✅ Commits atomiques et messages descriptifs
- ✅ Branches par fonctionnalité (`feature/`, `fix/`, `docs/`)
- ✅ Fichier `.gitignore` configuré (exclusion de `node_modules`, `.env`)
- ✅ README.md maintenu à jour
- ✅ Tags de version pour les releases stables

### 11.3 Structure des commits

```
type(scope): description

Exemples:
- feat(auth): add JWT authentication
- fix(wallet): correct balance calculation
- docs(readme): update installation guide
- style(ui): improve dashboard layout
```

---

## 12. Livrables du projet

### 12.1 Liste des livrables

| Livrable | Description | Emplacement |
|----------|-------------|-------------|
| **Code source backend** | API REST complète Node.js/Express | `/backend` |
| **Code source frontend** | Application Angular | `/frontend` |
| **Documentation technique** | Spécifications API et modèles de données | `/docs` |
| **README.md** | Documentation complète du projet | Racine |
| **Tests** | Tests unitaires et d'intégration | `/backend/tests` |
| **Scripts utilitaires** | Scripts de gestion | `/backend/scripts` |

### 12.2 Dépôt GitHub

- **URL** : `https://github.com/votre-username/mobile-money-app`
- **Visibilité** : Public
- **Branches** : `main` (production), `develop` (développement)

### 12.3 Exclusions Git (.gitignore)

```gitignore
# Dépendances
node_modules/

# Environnement
.env
.env.local

# Logs
logs/
*.log

# Build
dist/
build/

# IDE
.vscode/
.idea/

# Système
.DS_Store
Thumbs.db
```

---

## 13. Perspectives d'évolution

### 13.1 Intégrations futures

- 🔮 **APIs Mobile Money réelles** : Intégration Orange Money, MTN, Wave
- 🔮 **Paiement marchand** : QR codes et paiements en magasin
- 🔮 **Facturation** : Paiement de factures (électricité, eau, etc.)

### 13.2 Améliorations techniques

- 🔮 **Application mobile** : Version React Native ou Flutter
- 🔮 **Notifications push** : Alertes en temps réel
- 🔮 **2FA** : Authentification à deux facteurs
- 🔮 **KYC** : Vérification d'identité avancée

### 13.3 Fonctionnalités additionnelles

- 🔮 **USSD** : Interface SMS pour zones à faible connectivité
- 🔮 **Multi-langue** : Support de langues locales
- 🔮 **Reporting** : Exports et rapports avancés
- 🔮 **Microcrédits** : Services de prêts intégrés

---

## 14. Auteurs

### Informations du projet

| Champ | Valeur |
|-------|--------|
| **Projet** | Application Mobile Money |
| **Type** | Projet universitaire |
| **Année académique** | 2024-2025 |
| **Cours** | Développement Web Full-Stack |

### Équipe de développement

| Nom | Rôle | Contact |
|-----|------|---------|
| *[Nom de l'étudiant]* | Développeur Full-Stack | *[email]* |

---

## 📄 Licence

Ce projet est réalisé dans un cadre académique. Tous droits réservés.

---

<div align="center">

**Application Mobile Money** © 2025



</div>
