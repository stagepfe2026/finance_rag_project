import ChatPage from "../pages/ChatPage";
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
    path: "reclamations",
    element: <ReclamationPage />,
  },
  {
    path: "reclamations/nouvelle",
    element: <ReclamationCreatePage />,
  },
];
