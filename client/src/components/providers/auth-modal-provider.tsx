"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import LoginModal from "./login-modal";

type AuthModalContextValue = {
  openLogin: () => void;
  closeLogin: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [loginOpen, setLoginOpen] = useState(false);

  const openLogin = useCallback(() => setLoginOpen(true), []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);
  const value = useMemo(() => ({ openLogin, closeLogin }), [openLogin, closeLogin]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {/* Modal dipasang SEKALI di sini, bisa dibuka dari komponen mana pun */}
      <LoginModal open={loginOpen} onClose={closeLogin} />
    </AuthModalContext.Provider>
  );
}

/** Dipakai di komponen mana pun: const { openLogin } = useAuthModal(); */
export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal harus dipakai di dalam <AuthModalProvider>.");
  }
  return context;
}