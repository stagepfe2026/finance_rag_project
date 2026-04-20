import ChatPage from "../pages/ChatPage";
import RechercheDocumentPage from "../pages/RechercheDocumentPage";
import ReclamationCreatePage from "../pages/ReclamationCreatePage";
import ReclamationPage from "../pages/ReclamationPage";
import AccueilPage from "../pages/AcceuilPage";

export const userRoutes = [
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
];
