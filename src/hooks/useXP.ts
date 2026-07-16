// src/hooks/useXP.ts
import { useCallback, useEffect, useState } from "react";

export function useXP() {
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(1);

  const refreshXP = useCallback(() => {
    return fetch("/api/xp", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setXP(data.xp);
        setLevel(calculateLevel(data.xp));
      })
      .catch(() => {
        setXP(0);
        setLevel(1);
      });
  }, []);

  useEffect(() => {
    void refreshXP();
  }, [refreshXP]);

  // Rewards are calculated and persisted by the server-side learning or game
  // action. This method only refreshes the authoritative balance.
  const addXP = useCallback((_serverAward: number) => refreshXP(), [refreshXP]);

  return { xp, level, addXP };
}

function calculateLevel(xp: number) {
  return Math.floor(xp / 100) + 1;
}
