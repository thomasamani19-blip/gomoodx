# Bienvenue sur GoMoodX

Ceci est le projet GoMoodX, une plateforme exclusive pour créateurs de contenu et leurs membres, générée par Firebase Studio IA.

## 🚀 Mise en Route

Suivez ces étapes pour lancer le projet en local.

### 1. Prérequis

- Node.js (v18 ou supérieur)
- npm ou yarn
- Un compte Firebase
- Firebase CLI (`npm install -g firebase-tools`)

### 2. Configuration de l'Environnement

1.  **Cloner le projet** (si ce n'est pas déjà fait via Studio).
2.  **Installer les dépendances** :
    ```bash
    npm install
    # ou
    yarn install
    ```
3.  **Configurer les variables d'environnement** :
    Créez un fichier `.env.local` à la racine du projet et remplissez-le avec les clés de votre projet Firebase et de vos services tiers. Vous pouvez trouver votre configuration Firebase dans la console Firebase > Paramètres du projet.

    ```env
    # Firebase (obtenu depuis la console Firebase)
    NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="votre-projet.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="votre-projet"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="votre-projet.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
    NEXT_PUBLIC_FIREBASE_APP_ID="1:..."

    # Genkit / Google AI
    GEMINI_API_KEY="Votre_cle_API_Gemini"
    
    # Agora (for Live Streaming & Calls)
    NEXT_PUBLIC_AGORA_APP_ID="votre_agora_app_id"
    AGORA_APP_CERTIFICATE="votre_agora_app_certificate"

    # Clés API pour les paiements (à obtenir depuis les plateformes)
    NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY="FLWPUBK_TEST-..."
    FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-..."
    NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY="..."
    KKIAPAY_PRIVATE_KEY="..."
    KKIAPAY_SECRET_KEY="..."

    # Activez les émulateurs pour le développement local (optionnel mais recommandé)
    # Décommentez la ligne ci-dessous pour utiliser les émulateurs Firebase
    # NEXT_PUBLIC_EMULATOR_HOST=localhost
    ```

### 3. Lancer les Services

1.  **Lancer l'application Next.js** :
    ```bash
    npm run dev
    # ou
    yarn dev
    ```
    Votre site sera accessible sur `http://localhost:3000`.

2.  **Lancer Genkit pour l'IA** (dans un autre terminal) :
    ```bash
    npm run genkit:watch
    # ou
    yarn genkit:watch
    ```

3.  **(Optionnel) Lancer les Émulateurs Firebase** :
    Si vous souhaitez utiliser les émulateurs Firebase pour l'authentification et Firestore, exécutez :
    ```bash
    firebase emulators:start
    ```
    Assurez-vous que `NEXT_PUBLIC_EMULATOR_HOST` est bien décommenté dans votre `.env.local`.

### 4. Déploiement

Pour déployer votre application sur Firebase Hosting (pour le frontend) et Cloud Functions (pour le backend), vous devez d'abord "builder" votre application. Cette étape compile et optimise le code pour la production.

1.  **Build de l'application Next.js** :
    ```bash
    npm run build
    ```
2.  **Déploiement sur Firebase** :
    ```bash
    firebase deploy
    ```
    Cela déploiera les règles Firestore, Storage, les Cloud Functions et l'application Next.js sur App Hosting.

## 📝 Données de Démonstration

Le projet inclut des données de démarrage dans `src/lib/seed.ts`. Pour peupler votre base de données Firestore locale (ou distante) :

1.  Assurez-vous que vos variables d'environnement sont configurées.
2.  Exécutez le script de seeding :
    ```bash
    npx tsx src/lib/seed.ts
    ```
    
3. **Déployer les règles de sécurité (Important pour le développement)**
   Pour autoriser l'accès à la base de données en développement, vous devez déployer les règles permissives :
   ```bash
   firebase deploy --only firestore:rules
   ```

**Comptes de test par défaut :** (Mot de passe pour tous : `password123`)
-   **Founder** : `amanignangoran104@gmail.com`
-   **Admin** : `admin@test.com`
-   **Créateur** : `creator@test.com`
-   **Client** : `member@test.com`
-   **Modérateur**: `moderator@test.com`
-   **Partenaire Hôtel**: `partner@test.com`
-   **Partenaire Producteur**: `producer@test.com`

---
Généré avec ❤️ par Firebase Studio IA.
