// This is a placeholder for a more robust i18n library like next-intl.
// It demonstrates the structure of the translation keys.

export const translations = {
  fr: {
    header: {
      nav: {
        services: "Services",
        blog: "Blog",
        shop: "Boutique",
        live: "Live",
        login: "Connexion",
      },
    },
    hero: {
      title: "Élixir Sensuel",
      subtitle: "Explorez un univers de désirs, de rencontres et de contenus exclusifs.",
      cta: "Rejoignez l'Expérience",
    },
    footer: {
      links: {
        cgu: "Conditions d'Utilisation",
        privacy: "Politique de Confidentialité",
        contact: "Contact",
      },
    },
    messages: {
      validation: {
        required: "Ce champ est requis.",
        email: "Veuillez entrer une adresse e-mail valide.",
      },
      errors: {
        paymentFailed: "Le paiement a échoué. Veuillez réessayer.",
        unauthorized: "Action non autorisée.",
      },
    },
  },
  en: {
    // English translations would go here
    header: { nav: { services: "Services", blog: "Blog", shop: "Shop", live: "Live", login: "Login" }},
    hero: { title: "Sensual Elixir", subtitle: "Explore a universe of desires, encounters, and exclusive content.", cta: "Join the Experience" },
    footer: { links: { cgu: "Terms of Service", privacy: "Privacy Policy", contact: "Contact" }},
    messages: { validation: { required: "This field is required.", email: "Please enter a valid email address." }, errors: { paymentFailed: "Payment failed. Please try again.", unauthorized: "Unauthorized action." }},
  },
  es: {
    // Spanish translations would go here
  },
  it: {
    // Italian translations would go here
  },
  ar: {
    // Arabic translations would go here
  },
};
