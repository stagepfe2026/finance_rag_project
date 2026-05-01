import {
  AlertTriangle,
  ExternalLink,
  Maximize2,
  Minimize2,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Reclamation } from "../../models/reclamation";
import { fetchAdminReclamations, resolveReclamationAsAdmin } from "../../services/admin-reclamation.service";
import AdminPageShell from "../components/layout/AdminPageShell";

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusLabel(status: Reclamation["status"]) {
  switch (status) {
    case "PENDING":
      return "En attente";
    case "IN_PROGRESS":
      return "En cours";
    case "RESOLVED":
      return "Traitee";
    case "FAILED":
      return "A revoir";
    default:
      return status;
  }
}

function getPriorityLabel(priority: Reclamation["priority"]) {
  switch (priority) {
    case "LOW":
      return "Basse";
    case "NORMAL":
      return "Normale";
    case "HIGH":
      return "Haute";
    case "URGENT":
      return "Urgente";
    default:
      return priority;
  }
}

function getStatusClassName(status: Reclamation["status"]) {
  switch (status) {
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "IN_PROGRESS":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "RESOLVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-rose-200 bg-rose-50 text-rose-700";
  }
}

export default function ReclamationPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "IN_PROGRESS" | "RESOLVED">("ALL");
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [adminReply, setAdminReply] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadReclamations();
  }, []);

  async function loadReclamations() {
    try {
      setIsLoading(true);
      setError("");
      const items = await fetchAdminReclamations();
      setReclamations(items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les reclamations.");
    } finally {
      setIsLoading(false);
    }
  }

  const urgentItems = useMemo(
    () => reclamations.filter((item) => item.priority === "URGENT" && item.status !== "RESOLVED"),
    [reclamations],
  );

  const stats = useMemo(
    () => ({
      total: reclamations.length,
      pending: reclamations.filter((item) => item.status === "PENDING").length,
      inProgress: reclamations.filter((item) => item.status === "IN_PROGRESS").length,
      resolved: reclamations.filter((item) => item.status === "RESOLVED").length,
      urgent: urgentItems.length,
    }),
    [reclamations, urgentItems],
  );

  const filteredReclamations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return reclamations.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.subject.toLowerCase().includes(normalizedSearch) ||
        item.ticketNumber.toLowerCase().includes(normalizedSearch) ||
        item.userEmail.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reclamations, search, statusFilter]);

  const selectedReclamation = useMemo(
    () => filteredReclamations.find((item) => item._id === selectedId) ?? reclamations.find((item) => item._id === selectedId) ?? null,
    [filteredReclamations, reclamations, selectedId],
  );

  const alreadyHandled = Boolean(selectedReclamation?.adminReplyAt || selectedReclamation?.adminReply);
  const liveStatus: Reclamation["status"] =
    alreadyHandled
      ? "RESOLVED"
      : adminReply.trim().length > 0
        ? "IN_PROGRESS"
        : selectedReclamation?.status ?? "PENDING";

  useEffect(() => {
    if (selectedReclamation) {
      setAdminReply(selectedReclamation.adminReply ?? "");
    }
  }, [selectedReclamation]);

  async function handleSubmitReply() {
    if (!selectedReclamation || alreadyHandled) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setMessage("");
      const updated = await resolveReclamationAsAdmin(selectedReclamation._id, adminReply, "RESOLVED");
      setReclamations((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      setMessage("La reclamation a ete traitee. L envoi est maintenant desactive pour les autres admins.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Impossible d envoyer la reponse.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRowClick(reclamation: Reclamation) {
    setSelectedId(reclamation._id);
    setShowPanel(true);
  }

  return (
    <AdminPageShell>
          <header className="bg-[#f7f9fc] px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-[26px] font-bold tracking-tight text-[#273043]">
                  Reclamations <span className="text-[#9d0208]">Admin</span>
                </h1>
                <p className="mt-2 text-[13px] text-[#5f6680]">
                  Une seule reponse admin par reclamation, avec suivi automatique du statut.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-[#e8d9d6] bg-white px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Total</p>
                  <p className="mt-1 text-xl font-semibold text-slate-800">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-amber-700">En attente</p>
                  <p className="mt-1 text-xl font-semibold text-amber-900">{stats.pending}</p>
                </div>
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-sky-700">En cours</p>
                  <p className="mt-1 text-xl font-semibold text-sky-900">{stats.inProgress}</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-emerald-700">Traitees</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-900">{stats.resolved}</p>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-rose-700">Urgentes</p>
                  <p className="mt-1 text-xl font-semibold text-rose-900">{stats.urgent}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <div className="flex min-w-max gap-3">
                {urgentItems.length === 0 ? (
                  <div className="rounded-2xl border border-[#e6dfdc] bg-white px-4 py-3 text-sm text-slate-500">
                    Aucune reclamation urgente en attente.
                  </div>
                ) : (
                  urgentItems.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => handleRowClick(item)}
                      className="flex min-w-[260px] items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left transition hover:bg-rose-100"
                    >
                      <span className="mt-1 rounded-full bg-white p-1 text-rose-600">
                        <AlertTriangle size={14} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-rose-900">{item.ticketNumber}</span>
                        <span className="mt-1 block truncate text-xs text-rose-700">{item.subject}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </header>

          <section className="px-5 pb-5 md:px-6">
            <div className="flex min-h-[620px] gap-4">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-[#ece4e1] bg-white shadow-sm">
                <div className="flex flex-wrap items-center gap-3 border-b border-[#efe7e4] px-5 py-4">
                  <div className="flex h-10 min-w-[260px] flex-1 items-center gap-2 rounded-2xl border border-[#ddd8d5] bg-[#f9f7f6] px-3">
                    <Search size={15} className="text-slate-400" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Rechercher par ticket, sujet ou email ..."
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                    className="h-10 rounded-2xl border border-[#ddd8d5] bg-[#f9f7f6] px-3 text-sm outline-none"
                  >
                    <option value="ALL">Tous les statuts</option>
                    <option value="PENDING">En attente</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="RESOLVED">Traitees</option>
                  </select>
                </div>

                {error ? (
                  <div className="mx-5 mt-4 rounded-2xl border border-[#f1d2d0] bg-[#fff8f7] px-4 py-3 text-[12px] text-[#9d0208]">
                    {error}
                  </div>
                ) : null}

                {message ? (
                  <div className="mx-5 mt-4 rounded-2xl border border-[#d9ebe1] bg-[#f4fbf7] px-4 py-3 text-[12px] text-[#157347]">
                    {message}
                  </div>
                ) : null}

                <div className="min-h-0 flex-1 overflow-auto">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-[#f8f5f4]">
                      <tr className="text-left text-[12px] uppercase tracking-[0.08em] text-[#6c6663]">
                        <th className="border-b border-[#ece4e1] px-5 py-4">Ticket</th>
                        <th className="border-b border-[#ece4e1] px-5 py-4">Sujet</th>
                        <th className="border-b border-[#ece4e1] px-5 py-4">Utilisateur</th>
                        <th className="border-b border-[#ece4e1] px-5 py-4">Priorite</th>
                        <th className="border-b border-[#ece4e1] px-5 py-4">Statut</th>
                        <th className="border-b border-[#ece4e1] px-5 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-sm text-slate-500">
                            Chargement des reclamations...
                          </td>
                        </tr>
                      ) : filteredReclamations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-sm text-slate-500">
                            Aucune reclamation trouvee.
                          </td>
                        </tr>
                      ) : (
                        filteredReclamations.map((item) => (
                          <tr
                            key={item._id}
                            onClick={() => handleRowClick(item)}
                            className={`cursor-pointer transition ${selectedReclamation?._id === item._id && showPanel ? "bg-[#fff4f4]" : "hover:bg-[#faf7f6]"}`}
                          >
                            <td className="border-b border-[#f3ece9] px-5 py-4">
                              <span className="rounded-lg bg-[#ebe7e5] px-2.5 py-1 text-[11px] font-semibold text-[#5e5956]">
                                {item.ticketNumber}
                              </span>
                            </td>
                            <td className="border-b border-[#f3ece9] px-5 py-4 text-sm font-semibold text-slate-800">
                              <div className="max-w-[260px] truncate">{item.subject}</div>
                            </td>
                            <td className="border-b border-[#f3ece9] px-5 py-4 text-sm text-slate-600">
                              <div className="max-w-[220px] truncate">{item.userEmail}</div>
                            </td>
                            <td className="border-b border-[#f3ece9] px-5 py-4 text-sm text-slate-600">
                              {item.priority === "URGENT" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                                  <AlertTriangle size={12} />
                                  Urgente
                                </span>
                              ) : (
                                getPriorityLabel(item.priority)
                              )}
                            </td>
                            <td className="border-b border-[#f3ece9] px-5 py-4">
                              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClassName(item.status)}`}>
                                {getStatusLabel(item.status)}
                              </span>
                            </td>
                            <td className="border-b border-[#f3ece9] px-5 py-4 text-sm text-slate-500">
                              {formatDate(item.updatedAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {showPanel && selectedReclamation ? (
                <aside
                  className={`min-h-0 overflow-hidden rounded-3xl border border-[#ece4e1] bg-white shadow-sm transition-all ${
                    isPanelExpanded ? "w-[560px]" : "w-[430px]"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[#efe7e4] px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Detail reclamation</p>
                      <p className="mt-1 text-xs text-slate-500">{selectedReclamation.ticketNumber}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPanelExpanded((current) => !current)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#ddd8d5] bg-white text-slate-500 transition hover:border-[#9d0208] hover:text-[#9d0208]"
                        title={isPanelExpanded ? "Reduire" : "Etendre"}
                      >
                        {isPanelExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPanel(false)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#ddd8d5] bg-white text-slate-500 transition hover:border-[#9d0208] hover:text-[#9d0208]"
                        title="Fermer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="h-full overflow-auto px-5 py-5">
                    <div className="space-y-5 pb-8">
                      <div className="rounded-2xl bg-[#faf7f6] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h2 className="text-lg font-semibold text-slate-900">{selectedReclamation.subject}</h2>
                            <p className="mt-1 text-sm text-slate-500">{selectedReclamation.userEmail}</p>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClassName(liveStatus)}`}>
                            {getStatusLabel(liveStatus)}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                          <p>Priorite: <span className="font-medium">{getPriorityLabel(selectedReclamation.priority)}</span></p>
                          <p>Creation: <span className="font-medium">{formatDate(selectedReclamation.createdAt)}</span></p>
                          <p>Admin traitant: <span className="font-medium">{selectedReclamation.adminReplyBy ?? "Pas encore traite"}</span></p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#ece4e1] bg-[#fffdfd] p-4">
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Description</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {selectedReclamation.description}
                        </p>
                      </div>

                      {selectedReclamation.attachment?.url ? (
                        <div className="rounded-2xl border border-[#ece4e1] bg-[#fffdfd] p-4">
                          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Piece jointe</p>
                          <a
                            href={`${apiBaseUrl}${selectedReclamation.attachment.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1 rounded-xl border border-[#e3d9d6] bg-[#faf7f6] px-3 py-2 text-sm font-medium text-[#9d0208] hover:bg-[#f6eeee]"
                          >
                            Voir la piece jointe
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      ) : null}

                      <div className="rounded-2xl border border-[#ece4e1] bg-[#fffdfd] p-4">
                        <p className="text-sm font-semibold text-slate-800">Historique</p>
                        <div className="mt-4 space-y-3">
                          {selectedReclamation.activityLog.map((entry) => (
                            <div key={entry.id} className="rounded-2xl bg-[#faf7f6] px-4 py-3">
                              <p className="text-sm text-slate-800">{entry.description}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {entry.actorName} • {formatDate(entry.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#ece4e1] bg-[#fffdfd] p-4">
                        <p className="text-sm font-semibold text-slate-800">Reponse admin</p>

                        {alreadyHandled ? (
                          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            Cette reclamation a deja ete traitee par <span className="font-semibold">{selectedReclamation.adminReplyBy ?? "un administrateur"}</span>.
                            L envoi est desactive pour les autres admins.
                          </div>
                        ) : (
                          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                            Si l admin commence a ecrire, la reclamation passe visuellement en cours. A l envoi, elle devient traitee.
                          </div>
                        )}

                        <textarea
                          rows={8}
                          value={adminReply}
                          onChange={(event) => setAdminReply(event.target.value)}
                          disabled={alreadyHandled}
                          placeholder="Ecrivez votre reponse a l utilisateur..."
                          className="mt-3 w-full rounded-2xl border border-[#ddd8d5] bg-[#f9f7f6] px-4 py-3 text-sm outline-none focus:border-[#9d0208] disabled:cursor-not-allowed disabled:opacity-60"
                        />

                        <button
                          type="button"
                          onClick={() => void handleSubmitReply()}
                          disabled={isSubmitting || alreadyHandled}
                          className="mt-3 h-11 w-full rounded-2xl bg-[#9d0208] px-4 text-sm font-semibold text-white transition hover:bg-[#9d0208] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmitting ? "Envoi..." : "Envoyer la reponse"}
                        </button>
                      </div>
                    </div>
                  </div>
                </aside>
              ) : null}
            </div>
          </section>
    </AdminPageShell>
  );
}
