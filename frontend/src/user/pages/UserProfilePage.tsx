import { type FormEvent, useEffect, useState } from "react";
import { RotateCcw, Save } from "lucide-react";

import { useAuth } from "../../auth/AuthContext";
import { updateProfileRequest } from "../../services/auth.service";
import ProfileInformationGrid from "../components/profile/ProfileInformationGrid";
import ProfileSnackbar from "../components/profile/ProfileSnackbar";
import ProfileSummaryCard from "../components/profile/ProfileSummaryCard";
import {
  buildProfileForm,
  type ProfileFormState,
  type ProfileTextFieldName,
} from "../components/profile/profileForm";

type ProfileSnackbarState = {
  open: boolean;
  message: string;
  tone: "success" | "error" | "info";
};

function resizeProfileImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Veuillez selectionner une image valide."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire l image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Impossible de preparer l image."));
      image.onload = () => {
        const size = 320;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Impossible de preparer l image."));
          return;
        }

        canvas.width = size;
        canvas.height = size;
        const sourceSize = Math.min(image.width, image.height);
        const sourceX = (image.width - sourceSize) / 2;
        const sourceY = (image.height - sourceSize) / 2;
        context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

export default function UserProfilePage() {
  const { user, refreshSession } = useAuth();
  const [form, setForm] = useState<ProfileFormState>(() => buildProfileForm(user));
  const [snackbar, setSnackbar] = useState<ProfileSnackbarState>({ open: false, message: "", tone: "info" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.title = "Donnees personnelles | CIMF";
  }, []);

  useEffect(() => {
    setForm(buildProfileForm(user));
  }, [user?.id]);

  useEffect(() => {
    if (!snackbar.open) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSnackbar((current) => ({ ...current, open: false }));
    }, 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [snackbar.open, snackbar.message]);

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-89px)] bg-slate-50 px-4 py-5 text-xs text-slate-500">
        Chargement du profil...
      </div>
    );
  }

  function clearMessages() {
    setSnackbar((current) => ({ ...current, open: false }));
  }

  function updateField(name: ProfileTextFieldName, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    clearMessages();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    clearMessages();

    try {
      const response = await updateProfileRequest(form);
      await refreshSession();

      setForm(buildProfileForm(response.user ?? user));
      setSnackbar({
        open: true,
        message: "Vos donnees personnelles ont ete mises a jour.",
        tone: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Impossible de modifier les donnees personnelles.",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleImageChange(file: File) {
    try {
      const imageUrl = await resizeProfileImage(file);
      setForm((current) => ({ ...current, profileImageUrl: imageUrl }));
      setSnackbar({
        open: true,
        message: "Photo ajoutee. Cliquez sur Enregistrer pour confirmer.",
        tone: "info",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Impossible de charger l image.",
        tone: "error",
      });
    }
  }

  function handleReset() {
    setForm(buildProfileForm(user));
    clearMessages();
  }

  return (
    <div className="min-h-[calc(100vh-89px)] bg-slate-50 px-4 py-4">
      <form onSubmit={handleSubmit} className="mx-auto grid w-full gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <ProfileSummaryCard
          user={user}
          imageUrl={form.profileImageUrl}
          onImageChange={(file) => void handleImageChange(file)}
        />

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-[#273043]">Mes informations personnelles</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className="inline-flex h-8 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#273043] transition hover:border-[#273043] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={15} />
                Reinitialiser
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-8 items-center justify-center gap-2 rounded-xl bg-[#9d0208] px-4 text-sm font-semibold text-white transition hover:bg-[#7f0207] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={15} />
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>

          <ProfileInformationGrid form={form} onFieldChange={updateField} />
        </div>
      </form>
      <ProfileSnackbar open={snackbar.open} message={snackbar.message} tone={snackbar.tone} />
    </div>
  );
}
