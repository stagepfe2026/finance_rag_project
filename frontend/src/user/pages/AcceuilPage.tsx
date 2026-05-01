import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import buildingImage from "../../assets/building_cimf.png";
import { documentCategoryLabels, type DocumentItem } from "../../models/document";
import { fetchUserDashboard } from "../../services/dashboard.service";
import { createNotificationsWebSocket } from "../../services/notifications.service";
import NotificationsPanel from "../components/acceuil/NotificationsPanel";
import QuickActionsSection from "../components/acceuil/QuickActionsSection";
import RecentDocumentsTable from "../components/acceuil/RecentDocumentsTable";
import SearchBar from "../components/acceuil/SearchBar";
import WelcomeBanner from "../components/acceuil/WelcomeBanner";
import type {
  NotificationItem,
  QuickAction,
  RecentDocumentItem,
} from "../components/acceuil/types/acceuil.types";

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `Il y a ${diffHours} h`;
  }

  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `Il y a ${diffDays} j`;
}

function formatDocumentDate(document: DocumentItem) {
  const value = document.indexedAt || document.createdAt;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(date);
}

export default function AccueilPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Utilisateur");
  const [recentDocuments, setRecentDocuments] = useState<RecentDocumentItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    document.title = "Accueil | CIMF";
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setPageError("");
        const data = await fetchUserDashboard();
        if (cancelled) {
          return;
        }

        setUserName(data.userName);
        setRecentDocuments(
          data.recentDocuments.map((document) => ({
            id: document.id,
            title: document.title,
            category: documentCategoryLabels[document.category],
            date: formatDocumentDate(document),
            link: `/user/documents/recherche?documentId=${document.id}`,
          })),
        );
        setNotifications(
          data.notifications.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            time: formatRelativeDate(item.createdAt),
            link: item.link,
            isRead: item.isRead,
          })),
        );
      } catch (error) {
        if (!cancelled) {
          setPageError(error instanceof Error ? error.message : "Erreur pendant le chargement de l accueil.");
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const socket = createNotificationsWebSocket({
      onNotification: ({ data }) => {
        setNotifications((current) => [
          {
            id: data.id,
            title: data.title,
            description: data.description,
            time: formatRelativeDate(data.createdAt),
            link: data.link,
            isRead: data.isRead,
          },
          ...current.filter((item) => item.id !== data.id),
        ]);
      },
    });

    return () => {
      socket.close();
    };
  }, []);

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        id: "search-documents",
        title: "Rechercher un document",
        description: "Trouvez des documents par mots-cles ou filtres.",
        href: "/user/documents/recherche",
      },
      {
        id: "ask-question",
        title: "Poser une question",
        description: "Demarrez une nouvelle conversation dans le chat.",
        onClick: () => navigate("/user/chat?new=1"),
      },
      {
        id: "new-reclamation",
        title: "Nouvelle reclamation",
        description: "Signalez un probleme ou une erreur a l equipe.",
        href: "/user/reclamations/nouvelle",
      },
      {
        id: "my-reclamations",
        title: "Mes reclamations",
        description: "Suivez l etat de vos demandes et reponses.",
        href: "/user/reclamations",
      },
    ],
    [navigate],
  );

  function handleSearch(value: string) {
    navigate(`/user/documents/recherche${value ? `?query=${encodeURIComponent(value)}` : ""}`);
  }

  function handleDismissNotification(notificationId: string) {
    setNotifications((current) => current.filter((item) => item.id !== notificationId));
  }

  return (
    <div className="min-h-[calc(100vh-89px)] bg-slate-50 px-5 py-5">
      <div className="mx-auto flex min-h-[calc(100vh-129px)] w-full flex-col space-y-4">
        <WelcomeBanner userName={userName} imageSrc={buildingImage} />

        {pageError ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div> : null}

        <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="flex min-h-0 flex-col space-y-4">
            <SearchBar onSearch={handleSearch} />
            <QuickActionsSection actions={quickActions} />
            <RecentDocumentsTable documents={recentDocuments} />
          </div>

          <div className="flex min-h-0 flex-col space-y-4">
            <NotificationsPanel items={notifications} onDismiss={handleDismissNotification} />
          </div>
        </div>
      </div>
    </div>
  );
}
