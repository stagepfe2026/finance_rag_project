import { Navigate } from "react-router-dom";

export default function ReclamationCreatePage() {
  return <Navigate to="/user/reclamations?new=1" replace />;
}
