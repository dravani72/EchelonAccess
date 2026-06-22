"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { syncPendingChanges } from "@/lib/offline/sync";

export function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncLabel, setSyncLabel] = useState("Ready");

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      void handleSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function handleSync() {
    setSyncLabel("Syncing");
    const result = await syncPendingChanges();
    if (result.skipped) {
      setSyncLabel("Offline");
      return;
    }
    setSyncLabel(result.failed ? `${result.failed} failed` : `${result.synced} synced`);
  }

  return (
    <button className="button" onClick={handleSync} type="button">
      {isOnline ? <Cloud size={16} /> : <CloudOff size={16} />}
      {isOnline ? syncLabel : "Offline"}
      <RefreshCw size={14} />
    </button>
  );
}
