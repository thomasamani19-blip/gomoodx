tur# Bienvenue sur GoMoodX

Ceci est le projet GoMoodX, une plateforme exclusive pour créateurs de contenu et leurs membres, générée par Firebase Studio IA.

## 🚀 Mise en Route sur GitHub Codespaces (Guide Complet)

Ce projet est optimisé pour être développé en 1 clic grâce à **GitHub Codespaces**. Tout est pré-configuré pour une expérience de développement fluide.

---

### Étape 1 : Lancer le Codespace

1.  Sur la page principale du dépôt, cliquez sur le bouton vert **`< > Code`**.
2.  Allez dans l'onglet **`Codespaces`**.
3.  Cliquez sur **`Create codespace on main`**.

Patientez une ou deux minutes pendant que GitHub prépare votre environnement de développement complet dans le navigateur.

### Étape 2 : Lancer l'Application (Automatique)

Votre environnement est configuré pour démarrer automatiquement tous les services nécessaires. Vous n'avez rien à faire ici.

-   Le serveur de développement **Next.js** (votre site web) démarrera sur le port **3000**.
-   Le serveur **Genkit** (pour l'intelligence artificielle) démarrera sur le port **4000**.

Une notification apparaîtra en bas à droite pour chaque service démarré, vous proposant de l'ouvrir dans le navigateur.

### Étape 3 : Remplir la Base de Données (La seule action manuelle)

C'est la **seule et unique commande** que vous devez exécuter manuellement dans le terminal. Elle permet de remplir votre base de données avec des utilisateurs et des contenus de test.

1.  Dans votre Codespace, le terminal est déjà ouvert en bas de l'éditeur. Repérez les onglets `bash`, `next`, `genkit`.
2.  Cliquez sur l'onglet **`bash`**.
3.  Tapez ou collez la commande suivante et appuyez sur Entrée :

    ```bash
    npm run seed
    ```

Le script va s'exécuter et ajouter les données de test.

---

### 🎉 C'est tout !

Votre application est maintenant entièrement fonctionnelle et prête pour le développement.

Vous pouvez vous connecter avec les comptes suivants :
- **Client :** `member@test.com` (mot de passe : `password123`)
- **Créateur :** `creator@test.com` (mot de passe : `password123`)
- **Admin :** `admin@test.com` (mot de passe : `password123`)

N'hésitez pas à me demander la prochaine modification !
Généré avec ❤️ par Firebase Studio IA.
