import ChatPage from "../pages/ChatPage";
import RechercheDocumentPage from "../pages/RechercheDocumentPage";
import ReclamationCreatePage from "../pages/ReclamationCreatePage";
import ReclamationPage from "../pages/ReclamationPage";
import AccueilPage from "../pages/AcceuilPage";
import UserProfilePage from "../pages/UserProfilePage";
import UserGuidePage from "../pages/UserGuidePage";

export const userRoutes = [
  {
    index: true,
    element: <AccueilPage />,
  },
  {
    path: "accueil",
    element: <AccueilPage />,
  },
  {
    path: "chat",
    element: <ChatPage />,
  },
  {
    path: "documents/recherche",
    element: <RechercheDocumentPage />,
  },
  {
    path: "reclamations",
    element: <ReclamationPage />,
  },
  {
    path: "reclamations/nouvelle",
    element: <ReclamationCreatePage />,
  },
  {
    path: "profil",
    element: <UserProfilePage />,
  },
  {
    path: "guide",
    element: <UserGuidePage />,
  },
];
