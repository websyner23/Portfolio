import { useAppSelector } from "../redux/hooks";
import { selectCurrentUser } from "../redux/features/auth/authSlice";

export const usePermission = () => {
  const user = useAppSelector(selectCurrentUser);
  const permissions = user?.role?.permissions ?? [];
  const isSuperAdmin = user?.role?.name === "super-admin";

  const can = (...required: string[]) => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (required.length === 0) return true;
    return required.some((p) => permissions.includes(p));
  };

  return { user, permissions, isSuperAdmin, can };
};
