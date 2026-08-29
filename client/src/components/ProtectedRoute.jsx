import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000000]">
        <div className="h-8 w-8 rounded-full border-[3px] border-white/10 border-t-[#6366F1] animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;

  return children;
}
