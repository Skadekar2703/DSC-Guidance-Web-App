import React, { useState, useEffect, createContext, useContext } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { getAdminRecord, signOutUser } from "../services/authService";

const AuthContext = createContext({
  user: null,
  loading: true,
  adminRecord: null,
  isAuthorized: false,
  isAdmin: false,
  isConfigured: true,
  authError: null,
  clearAuthError: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminRecord, setAdminRecord] = useState(null);
  const [authError, setAuthError] = useState(null);
  const isConfigured = isSupabaseConfigured();

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Handle initial session check
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const record = await getAdminRecord(session.user.id);
          if (record && record.active === true && record.role === "admin") {
            setUser(session.user);
            setAdminRecord(record);
            setAuthError(null);
          } else {
            setUser(null);
            setAdminRecord(null);
            if (record && record.role === "student") {
              setAuthError("You do not have permission to access the admin panel.");
            }
            await signOutUser();
          }
        } else {
          setUser(null);
          setAdminRecord(null);
        }
      } catch (err) {
        console.error("[AUTH] Error initializing session:", err);
        setUser(null);
        setAdminRecord(null);
      } finally {
        setLoading(false);
      }
    };

    checkInitialSession();

    // Listen for Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          try {
            const record = await getAdminRecord(session.user.id);
            if (record && record.active === true && record.role === "admin") {
              setUser(session.user);
              setAdminRecord(record);
              setAuthError(null);
            } else {
              setUser(null);
              setAdminRecord(null);
              if (record && record.role === "student") {
                setAuthError("You do not have permission to access the admin panel.");
              } else if (!record) {
                setAuthError("You do not have permission to access the admin panel.");
              }
              await signOutUser();
            }
          } catch (error) {
            console.error("[AUTH] Error checking user profile:", error);
            setUser(null);
            setAdminRecord(null);
          }
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setAdminRecord(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const isAdmin = Boolean(adminRecord?.active === true && adminRecord?.role === "admin");
  const isAuthorized = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        adminRecord,
        isAuthorized,
        isAdmin,
        isConfigured,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default useAuth;

