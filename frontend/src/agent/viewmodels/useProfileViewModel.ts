import { useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";

export function useProfileViewModel() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Donnees personnelles | CIMF";
  }, []);

  return { user };
}
