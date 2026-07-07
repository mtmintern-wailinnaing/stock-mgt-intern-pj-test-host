"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const isPublicPage = pathname === "/login" || pathname === "/";

  const [authUser, setAuthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(!isPublicPage);

  useEffect(() => {
    if (isPublicPage) return;

    const fetchProfileAndInit = async () => {
      try {
        const res = await fetch("/api/auth/profile");
        if (res.ok) {
          const data = await res.json();
          setAuthUser(data);
        } else {
          setAuthUser(null);
          router.push("/login");
        }
      } catch (err) {
        setAuthUser(null);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndInit();
  }, [isPublicPage, router]);

  return (
    <AuthContext.Provider value={{ authUser, isLoading, setAuthUser }}>
      <Toaster position="top-right" richColors />
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
