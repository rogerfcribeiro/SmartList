"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function NetworkStatus() {
  const wasOffline = useRef(false);

  useEffect(() => {
    function handleOffline() {
      wasOffline.current = true;
      toast.error("Sem conexão. Tentando reconectar...", {
        duration: Infinity,
        id: "network-offline",
      });
    }

    function handleOnline() {
      if (!wasOffline.current) return;
      toast.dismiss("network-offline");
      toast.success("Conexão restaurada.");
      wasOffline.current = false;
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
