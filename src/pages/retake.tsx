// pages/retake.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function RetakePage() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (!id) return;

    const loadQuiz = async () => {
      const res = await fetch(`/api/getQuiz?quizId=${id}`);
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("retakeQuiz", JSON.stringify(data));
        router.push("/quiz?mode=retake");
      } else {
        alert(data.error || "Could not load quiz.");
      }
    };

    loadQuiz();
  }, [id]);

  return <p className="p-6">Preparing your quiz...</p>;
}
