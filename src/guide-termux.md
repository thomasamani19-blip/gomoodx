# Guide de Configuration GoMoodX sur Termux (Android)

Ce guide vous aidera à configurer et lancer le projet GoMoodX sur votre appareil Android en utilisant l'application Termux. Les instructions sont adaptées pour une utilisation avec le clavier virtuel de votre téléphone.

## 1. Préparation de Termux

Ouvrez Termux et mettez à jour les paquets. Tapez la commande suivante et validez avec "Entrée" :

```bash
pkg update && pkg upgrade
```
*Astuce : Termux vous demandera peut-être de confirmer certaines actions. En général, vous pouvez taper `Y` (pour Yes) et appuyer sur "Entrée".*

## 2. Installation des dépendances requises

Nous allons installer Node.js, Git, et les outils Firebase.

```bash
# Installer Node.js (LTS), git, et les outils Firebase
pkg install nodejs-lts git
npm install -g firebase-tools
```

## 3. Configuration du projet

### Étape 3.1 : Récupérer le code du projet

Pour commencer, vous devez avoir les fichiers du projet sur votre téléphone. La méthode la plus courante est de "cloner" le projet depuis un dépôt Git (comme GitHub).

**Remplacez l'URL ci-dessous par le lien de votre propre dépôt Git.**

```bash
git clone https://votre-repo-git/gomoodx.git
```
Cette commande va télécharger le projet dans un nouveau dossier nommé `gomoodx`.

### Étape 3.2 : Ouvrir le dossier du projet

Une fois le téléchargement terminé, vous devez vous "déplacer" à l'intérieur de ce nouveau dossier. Pour cela, utilisez la commande `cd` (change directory) :

```bash
cd gomoodx
```

*Astuce : Vous pouvez vérifier que vous êtes bien dans le bon dossier en tapant la commande `ls`. Elle listera tous les fichiers du projet, comme `package.json`, `src`, etc.*

### Étape 3.3 : Installer les dépendances

Maintenant que vous êtes dans le dossier du projet, installez toutes les dépendances nécessaires avec cette commande :

```bash
npm install
```

## 4. Configuration des variables d'environnement

Vous devez créer un fichier `.env.local` pour y coller vos clés API. Nous utiliserons l'éditeur de texte `nano`.

```bash
# Créer et éditer le fichier
nano .env.local
```

Une fois dans `nano`, collez le contenu ci-dessous, puis remplacez les `...` par vos propres clés.

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
```

**Comment sauvegarder et quitter `nano` sur téléphone :**

1.  Au-dessus de votre clavier habituel, Termux affiche une ligne de touches supplémentaires. Appuyez sur la touche `CTRL`.
2.  Le clavier change pour afficher des options. Appuyez sur `X` (pour "Exit" / Quitter).
3.  `nano` vous demandera "Save modified buffer?". Appuyez sur la touche `Y` de votre clavier.
4.  Enfin, il vous montrera le nom du fichier. Appuyez simplement sur la touche "Entrée" de votre clavier pour confirmer.

## 5. Connexion à Firebase

Assurez-vous d'être connecté à votre compte Firebase.

```bash
firebase login
```
*Suivez les instructions : vous devrez probablement copier une URL, la coller dans le navigateur de votre téléphone, vous connecter, puis autoriser l'accès.*

## 6. Lancement de l'application

Vous aurez besoin de plusieurs sessions (onglets) dans Termux.

**Comment créer une nouvelle session :**
- Faites glisser votre doigt depuis le bord gauche de l'écran vers la droite pour ouvrir le menu.
- Appuyez sur "NEW SESSION".
- Pour naviguer entre les sessions, refaites le même geste et choisissez la session voulue.

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
Si vous utilisez les émulateurs, lancez-les dans une troisième session.
```bash
firebase emulators:start
```

## 7. Actions importantes pour le développement

**Peupler la base de données (seeding)**
Pour ajouter les données de test (utilisateurs, produits, etc.) :

```bash
npx tsx src/lib/seed.ts
```

**Déployer les règles de sécurité permissives**
Pour que l'application puisse accéder à la base de données Firestore :

```bash
firebase deploy --only firestore:rules
```

Vous êtes maintenant prêt à développer GoMoodX sur votre téléphone !
