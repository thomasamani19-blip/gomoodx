
# Guide de Configuration GoMoodX sur Termux

Ce guide vous aidera à configurer et lancer le projet GoMoodX sur votre appareil Android en utilisant l'application Termux.

## 1. Préparation de Termux

Ouvrez Termux et mettez à jour les paquets :

```bash
pkg update && pkg upgrade
```

## 2. Installation des dépendances requises

Nous allons installer Node.js (version LTS recommandée), Git, et les outils Firebase.

```bash
# Installer Node.js (LTS), git, et les outils Firebase
pkg install nodejs-lts git
npm install -g firebase-tools
```

## 3. Configuration du projet

Si vous n'avez pas encore les fichiers du projet, clonez-le. Sinon, naviguez jusqu'au répertoire du projet.

```bash
# Si besoin, clonez le projet (remplacez l'URL par celle de votre dépôt)
# git clone https://votre-repo/gomoodx.git
# cd gomoodx
```

Une fois dans le dossier du projet, installez les dépendances Node.js :

```bash
npm install
```

## 4. Configuration des variables d'environnement

Vous devez créer un fichier `.env.local` pour stocker vos clés API. Vous pouvez utiliser l'éditeur `nano` pour cela.

```bash
# Créer et éditer le fichier
nano .env.local
```

Copiez et collez le contenu ci-dessous dans l'éditeur, en remplaçant les valeurs par vos propres clés.

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

# Clés API pour les paiements
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY="FLWPUBK_TEST-..."
FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-..."
NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY="..."
KKIAPAY_PRIVATE_KEY="..."
KKIAPAY_SECRET_KEY="..."

# Pour utiliser les émulateurs Firebase (recommandé pour Termux)
# Décommentez la ligne ci-dessous.
# NEXT_PUBLIC_EMULATOR_HOST=localhost
```

Pour sauvegarder et quitter `nano` :
1. Appuyez sur `Ctrl + X`
2. Appuyez sur `Y` pour confirmer.
3. Appuyez sur `Entrée`.

## 5. Connexion à Firebase

Assurez-vous d'être connecté à votre compte Firebase dans Termux.

```bash
firebase login
```
Suivez les instructions qui s'affichent à l'écran.

## 6. Lancement de l'application

Vous aurez besoin de plusieurs sessions Termux. Vous pouvez glisser depuis la gauche de l'écran et cliquer sur "New session" pour en ouvrir une nouvelle.

**Session 1 : Lancer l'application Next.js**

```bash
npm run dev
```
L'application sera accessible sur `http://localhost:3000` depuis le navigateur de votre téléphone.

**Session 2 : Lancer Genkit pour l'IA**

```bash
npm run genkit:watch
```

**Session 3 (Optionnel) : Lancer les émulateurs Firebase**
Si vous avez configuré `NEXT_PUBLIC_EMULATOR_HOST` dans votre `.env.local`, lancez les émulateurs.

```bash
firebase emulators:start
```

## 7. Actions importantes pour le développement

**Peupler la base de données (seeding)**
Pour ajouter les données de test (utilisateurs, produits, etc.), exécutez cette commande :

```bash
npx tsx src/lib/seed.ts
```

**Déployer les règles de sécurité permissives**
Pour que l'application puisse accéder à la base de données Firestore pendant le développement, vous devez déployer les règles de sécurité.

```bash
firebase deploy --only firestore:rules
```

Vous êtes maintenant prêt à développer GoMoodX sur Termux !
