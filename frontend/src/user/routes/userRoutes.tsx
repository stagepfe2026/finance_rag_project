import ChatPage from "../pages/ChatPage";
import RechercheDocumentPage from "../pages/RechercheDocumentPage";
import ReclamationCreatePage from "../pages/ReclamationCreatePage";
import ReclamationPage from "../pages/ReclamationPage";
import UserHomePage from "../../pages/UserHomePage";

export const userRoutes = [
  {
    path: "accueil",
    element: <UserHomePage />,
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
