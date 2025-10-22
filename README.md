# Bienvenue sur GoMoodX

Ceci est le projet GoMoodX, une plateforme exclusive pour créateurs de contenu et leurs membres, générée par Firebase Studio IA.

## 🚀 Mise en Route (Guide Complet)

Ce projet est conçu pour être développé facilement en utilisant des environnements de développement dans le cloud comme **GitHub Codespaces** (recommandé) ou en local sur votre machine.

---

### **(Recommandé) Utilisation de GitHub Codespaces**

GitHub Codespaces lance un environnement de développement complet directement dans votre navigateur, avec tout déjà pré-installé. C'est la méthode la plus simple et la plus rapide pour commencer.

#### Étape 1 : Lancer votre Codespace

1.  Allez sur la page principale de votre dépôt GitHub.
2.  Cliquez sur le bouton vert **`< > Code`**.
3.  Allez dans l'onglet **`Codespaces`**.
4.  Cliquez sur **`Create codespace on main`**.

GitHub va maintenant préparer votre environnement. Cela peut prendre une ou deux minutes. Une fois terminé, vous verrez un éditeur de code (similaire à VS Code) directement dans votre navigateur.

#### Étape 2 : Configurer les Clés API (Si nécessaire)

L'environnement a besoin de clés API pour se connecter à Firebase et aux autres services. Si vous avez déjà configuré les secrets de votre Codespace, vous pouvez sauter cette étape.

1.  Dans le terminal de votre Codespace (en bas de l'éditeur), copiez le fichier d'exemple pour créer votre fichier de configuration local :
    ```bash
    cp .env.example .env.local
    ```
2.  Dans l'explorateur de fichiers à gauche, ouvrez le nouveau fichier `.env.local`.
3.  Remplissez les valeurs avec vos propres clés API. Par exemple :
    ```env
    # Obtenez ces clés depuis votre console Firebase
    NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="votre-projet"
    # ... autres clés ...

    # Obtenez cette clé depuis Google AI Studio
    GEMINI_API_KEY="votre_cle_api_gemini"
    ```

#### Étape 3 : Lancer l'Application (Automatique)

Le Codespace est configuré pour lancer automatiquement tous les services pour vous.

-   Le serveur de développement **Next.js** (votre site web) démarrera sur le port 3000.
-   Le serveur **Genkit** (pour l'IA) démarrera sur le port 4000.

Vous verrez des notifications en bas à droite de l'écran lorsque les ports seront prêts. Vous pourrez cliquer sur "Ouvrir dans le navigateur" pour voir votre application en direct.

#### Étape 4 : Remplir la Base de Données (Action Manuelle Requise)

Pour ajouter des utilisateurs et des contenus de test, vous devez lancer le script de "seeding". **C'est la seule étape manuelle nécessaire dans le terminal.**

1.  Ouvrez un **nouveau terminal** en cliquant sur le `+` dans la barre du terminal (à côté de "bash", "genkit", etc.).
2.  Dans ce nouveau terminal, exécutez la commande suivante :
    ```bash
    npm run seed
    ```

C'est tout ! Votre application est maintenant entièrement fonctionnelle et prête pour le développement. Vous pouvez vous connecter avec les comptes de test comme `client@test.com` (mot de passe : `password123`).

---

### Utilisation en Local (Alternative)

Si vous préférez travailler sur votre propre machine, suivez ces étapes.

#### 1. Prérequis

- Node.js (v18 ou supérieur)
- npm ou yarn
- Un compte Firebase
- Firebase CLI (`npm install -g firebase-tools`)

#### 2. Configuration

1.  **Installer les dépendances** :
    ```bash
    npm install
    ```
2.  **Configurer les variables d'environnement** :
    Créez un fichier `.env.local` et remplissez-le avec vos clés (voir l'Étape 2 de Codespaces).

#### 3. Lancer les Services

Vous devrez ouvrir plusieurs terminaux.

1.  **Terminal 1 : Lancer Next.js**
    ```bash
    npm run dev
    ```
    Votre site sera sur `http://localhost:3000`.

2.  **Terminal 2 : Lancer Genkit**
    ```bash
    npm run genkit:watch
    ```

3.  **(Optionnel) Terminal 3 : Lancer les Émulateurs Firebase**
    Si vous utilisez les émulateurs locaux, décommentez `NEXT_PUBLIC_EMULATOR_HOST=localhost` dans `.env.local` et exécutez :
    ```bash
    firebase emulators:start
    ```

#### 4. Déploiement

Pour déployer sur Firebase :
```bash
npm run build
firebase deploy
```

---
Généré avec ❤️ par Firebase Studio IA.
