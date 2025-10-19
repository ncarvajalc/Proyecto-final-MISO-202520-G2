import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-hooks";
import Loading from "@/pages/Loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <div className="text-center">{children}</div>;
};
