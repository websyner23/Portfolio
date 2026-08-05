import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePermission } from "../hooks/usePermission";

type Props = {
  children: ReactNode;
  permission?: string | string[];
};

const ProtectedRoute = ({ children, permission }: Props) => {
  const { user, can } = usePermission();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const required = permission
    ? Array.isArray(permission)
      ? permission
      : [permission]
    : [];

  if (required.length > 0 && !can(...required)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
