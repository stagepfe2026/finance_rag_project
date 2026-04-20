import type { DocumentItem } from "../../../../models/document";
import type { NotificationItem, QuickAccessItem, QuickAction } from "../types/acceuil.types";

export const quickActions: QuickAction[] = [
  {
    id: 1,
    title: "Rechercher un document",
    description: "Trouvez des documents par mots-clés ou filtres",
    link: "/user/rechercheDocument",
  },
  {
    id: 2,
    title: "Poser une question",
    description: "Obtenez des réponses à vos questions",
    link: "/user/chat",
  },
  {
    id: 3,
    title: "Mes favoris",
    description: "Accédez rapidement à vos documents favoris",
    link: "/user/favoris",
  },
  {
    id: 4,
    title: "Mes réclamations",
    description: "Suivez l’état de vos réclamations",
    link: "/user/reclamation",
  },
];

export const notifications: NotificationItem[] = [
  {
    id: 1,
    title: "Nouveau document disponible",
    description: "Loi de finance 2024",
    time: "Il y a 2 heures",
  },
  {
    id: 2,
    title: "Document mis à jour",
    description: "Guide des procédures fiscales",
    time: "Il y a 1 jour",
  },
  {
    id: 3,
    title: "Réclamation traitée",
    description: "Votre réclamation #12345 a été traitée",
    time: "Il y a 2 jours",
  },
];

export const recentDocuments: DocumentItem[] = [
  {
    id: 1,
    title: "Loi de finance 2024",
    category: "LÉGISLATION",
    date: "20/05/2024",
    link: "/documents/1",
  },
  {
    id: 2,
    title: "Guide des procédures fiscales",
    category: "PROCÉDURES",
    date: "18/05/2024",
    link: "/documents/2",
  },
  {
    id: 3,
    title: "Circulaire n°2024/12",
    category: "CIRCULAIRES",
    date: "15/05/2024",
    link: "/documents/3",
  },
  {
    id: 4,
    title: "Manuel de l’utilisateur - Système Fiscal",
    category: "GUIDES",
    date: "14/05/2024",
    link: "/documents/4",
  },
];

export const quickAccessItems: QuickAccessItem[] = [
  {
    id: 1,
    label: "Mes documents favoris",
    link: "/user/favoris",
  },
  {
    id: 2,
    label: "Documents consultés récemment",
    link: "/user/historique",
  },
  {
    id: 3,
    label: "Catégories de documents",
    link: "/user/categories",
  },
];