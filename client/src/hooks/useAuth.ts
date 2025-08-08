import { useQuery } from "@tanstack/react-query";
import type { AuthenticatedUser, UseAuthReturn } from "../types";

export function useAuth(): UseAuthReturn {
  const { data: user, isLoading } = useQuery<AuthenticatedUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
  };
}
