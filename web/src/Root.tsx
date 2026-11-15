import { StrictMode } from "react";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { LangProvider } from "./i18n";
import { ToastProvider } from "./components/ui/Toast";
import { SmoothScroll } from "./motion/SmoothScroll";
import { BootContext, type Boot } from "./ssr/context";

/** The whole app below the router; the server wraps it in a StaticRouter, the browser in a BrowserRouter. */
export function Root({ boot }: { boot: Boot }) {
  return (
    <StrictMode>
      <BootContext.Provider value={boot}>
        <LangProvider>
          <AuthProvider>
            <ToastProvider>
              <SmoothScroll>
                <App />
              </SmoothScroll>
            </ToastProvider>
          </AuthProvider>
        </LangProvider>
      </BootContext.Provider>
    </StrictMode>
  );
}
