// src/hooks/useXP.ts
import { useEffect, useState } from "react";

export function useXP() {
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    fetch("/api/xp")
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

  function addXP(amount: number) {
    setXP((prev) => {
      const next = prev + amount;
      setLevel(calculateLevel(next));

      fetch("/api/xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      return next;
    });
  }

  return { xp, level, addXP };
}

function calculateLevel(xp: number) {
  return Math.floor(xp / 100) + 1;
}
