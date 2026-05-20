import { type FormEvent, useEffect, useState } from "react";

import { useAuth } from "../../auth/AuthContext";
import { updateProfileRequest } from "../../services/auth.service";
import {
  buildProfileForm,
  type ProfileFormState,
  type ProfileTextFieldName,
} from "../components/profile/profileForm";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ProfileSnackbarState = {
  open: boolean;
  message: string;
  tone: "success" | "error" | "info";
};

// ─── Pure helper function ─────────────────────────────────────────────────────
export function resizeProfileImage(file: File) {
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

// ─── ViewModel ───────────────────────────────────────────────────────────────
export function useProfileViewModel() {
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

  return {
    user,
    form,
    snackbar,
    isSaving,
    updateField,
    handleSubmit,
    handleImageChange,
    handleReset,
  };
}
