import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ToastProvider } from "./components/common/Toast";
import AppRoutes from "./routes/AppRoutes";

/**
 * Main App Container wrapping router, auth session context, and toast notifications.
 */
function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
