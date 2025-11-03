// src/lib/errorReporter.ts
import { supabase } from "@/lib/supabaseClient";

class ErrorReporter {
  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        this.report({
          message: event.message,
          stack: event.error?.stack || "No stack",
          url: window.location.href,
        });
      });

      window.addEventListener("unhandledrejection", (event) => {
        this.report({
          message: event.reason?.message || "Unhandled promise rejection",
          stack: event.reason?.stack || "No stack",
          url: window.location.href,
        });
      });
    }

    console.log("[ErrorReporter] Initialized (Supabase mode)");
  }

  async report(error: {
    message: string;
    stack?: string;
    url?: string;
  }): Promise<void> {
    try {
      const { error: supabaseError } = await supabase
        .from("client_errors")
        .insert({
          message: error.message,
          stack: error.stack,
          url: error.url,
          timestamp: new Date().toISOString(),
        });

      if (supabaseError) throw supabaseError;
      console.log("[ErrorReporter] Logged error:", error.message);
    } catch (err) {
      console.error("[ErrorReporter] Failed to log error:", err);
    }
  }
}

export const errorReporter = new ErrorReporter();
