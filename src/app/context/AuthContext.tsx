import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getUserToken, setUserToken, clearUserToken } from "../../api/userClient";
import {
  loginWithGoogle, fetchCurrentUser, logout as logoutApi, updateProfile as updateProfileApi,
  TravelerUser,
} from "../../api/authApi";

interface AuthContextType {
  user: TravelerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogleCredential: (credential: string) => Promise<TravelerUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: { name?: string; phone?: string }) => Promise<TravelerUser>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TravelerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getUserToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetchCurrentUser()
      .then(setUser)
      .catch(() => {
        clearUserToken();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const loginWithGoogleCredential = useCallback(async (credential: string) => {
    const { token, user: loggedInUser } = await loginWithGoogle(credential);
    setUserToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    clearUserToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getUserToken()) return;
    try {
      setUser(await fetchCurrentUser());
    } catch {
      clearUserToken();
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (payload: { name?: string; phone?: string }) => {
    const updated = await updateProfileApi(payload);
    setUser(updated);
    return updated;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogleCredential,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
