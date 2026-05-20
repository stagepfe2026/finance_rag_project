export type GuideStep = {
  id: string;
  title: string;
  route: string;
  eyebrow: string;
  summary: string;
  objective: string;
  actions: {
    title: string;
    description: string;
  }[];
  result: string;
};

export const guideSteps: GuideStep[] = [
  {
    id: "accueil",
    title: "Accueil",
    route: "/user/accueil",
    eyebrow: "Vue d ensemble",
    summary: "La page d accueil regroupe les raccourcis utiles, les informations recentes et un acces rapide a la recherche.",
    objective: "Comprendre rapidement ou commencer selon votre besoin du moment.",
    actions: [
      {
        title: "Lancer une recherche",
        description: "Utilisez la barre principale pour retrouver un document ou une information sans changer de page.",
      },
      {
        title: "Utiliser les raccourcis",
        description: "Ouvrez directement le chat, la recherche documentaire ou les reclamations depuis les actions rapides.",
      },
      {
        title: "Verifier les nouveautes",
        description: "Consultez les notifications et documents recents avant de poursuivre votre travail.",
      },
    ],
    result: "Vous savez quelle page ouvrir et vous accedez plus vite aux fonctions principales.",
  },
  {
    id: "documents",
    title: "Recherche documents",
    route: "/user/documents/recherche",
    eyebrow: "Base documentaire",
    summary: "La recherche documentaire sert a retrouver les fichiers par mot-cle, categorie, date ou favoris.",
    objective: "Reduire la liste de resultats pour ouvrir rapidement le bon document.",
    actions: [
      {
        title: "Saisir un mot-cle",
        description: "Entrez un terme precis dans la barre de recherche pour lancer la consultation.",
      },
      {
        title: "Affiner les resultats",
        description: "Combinez les filtres de nom, categorie et date pour limiter les documents affiches.",
      },
      {
        title: "Garder un document utile",
        description: "Ajoutez-le aux favoris pour le retrouver depuis l acces rapide du header.",
      },
    ],
    result: "Les resultats deviennent plus courts, plus lisibles et mieux adaptes a votre recherche.",
  },
  {
    id: "chat",
    title: "Chat",
    route: "/user/chat",
    eyebrow: "Assistant documentaire",
    summary: "Le chat vous aide a poser une question et a exploiter les informations issues des documents disponibles.",
    objective: "Obtenir une reponse exploitable tout en gardant le lien avec les sources.",
    actions: [
      {
        title: "Demarrer une conversation",
        description: "Creez un nouvel echange ou reprenez une discussion existante depuis la colonne laterale.",
      },
      {
        title: "Formuler la demande",
        description: "Posez une question claire avec le contexte necessaire pour guider la reponse.",
      },
      {
        title: "Controler les sources",
        description: "Lisez les references associees pour verifier l origine des informations proposees.",
      },
    ],
    result: "Vous obtenez une reponse plus fiable et vous savez quels documents la justifient.",
  },
  {
    id: "reclamations",
    title: "Reclamations",
    route: "/user/reclamations",
    eyebrow: "Suivi des demandes",
    summary: "L espace reclamations centralise les demandes envoyees, leur statut et les reponses de l administration.",
    objective: "Creer une demande claire et suivre son traitement sans perdre le fil.",
    actions: [
      {
        title: "Creer une reclamation",
        description: "Renseignez le sujet, la categorie et le message pour transmettre une demande complete.",
      },
      {
        title: "Suivre le statut",
        description: "Utilisez les filtres pour distinguer les demandes ouvertes, traitees ou non lues.",
      },
      {
        title: "Lire le detail",
        description: "Ouvrez une ligne pour consulter l historique et les reponses associees.",
      },
    ],
    result: "Chaque demande reste tracable avec son statut, son contenu et ses reponses.",
  },
  {
    id: "profil",
    title: "Profil",
    route: "/user/profil",
    eyebrow: "Informations personnelles",
    summary: "Le profil permet de verifier vos informations personnelles et professionnelles, puis de les mettre a jour.",
    objective: "Garder des donnees utilisateur exactes pour les usages internes de la plateforme.",
    actions: [
      {
        title: "Verifier les informations",
        description: "Relisez les champs principaux avant toute modification.",
      },
      {
        title: "Mettre a jour le profil",
        description: "Modifiez les donnees necessaires et ajustez la photo si besoin.",
      },
      {
        title: "Enregistrer",
        description: "Validez les changements pour conserver les nouvelles informations.",
      },
    ],
    result: "Votre profil reste propre, complet et coherent avec votre usage de la plateforme.",
  },
];

export const guideStepDurationMs = 5200;
