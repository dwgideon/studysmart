import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { GRADE_LEVELS, type LearningContextPayload } from "@/lib/learningProfile";
import styles from "./LearningContextForm.module.css";

type LearningContextResponse = {
  user: { ageGroup: string };
  profile: {
    gradeLevel: string;
    primaryLearningGoal: string | null;
    onboardingCompleted: boolean;
  } | null;
  courses: Array<{
    id: string;
    name: string;
    subject: string;
    examDate: string;
    learningGoal: string | null;
    isPrimary: boolean;
  }>;
};

const EMPTY_FORM: LearningContextPayload = {
  gradeLevel: "",
  ageGroup: "",
  primaryLearningGoal: "",
  courseName: "",
  subject: "",
  examDate: "",
  courseLearningGoal: "",
};

export default function LearningContextForm({
  redirectAfterSave,
}: {
  redirectAfterSave?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<LearningContextPayload>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/profile/learning-context")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load your learning profile.");
        }
        return response.json() as Promise<LearningContextResponse>;
      })
      .then((data) => {
        if (!active) {
          return;
        }
        const course = data.courses.find((item) => item.isPrimary) ?? data.courses[0];
        setForm({
          gradeLevel: data.profile?.gradeLevel ?? "",
          ageGroup:
            data.user?.ageGroup === "UNKNOWN" ? "" : data.user?.ageGroup ?? "",
          primaryLearningGoal: data.profile?.primaryLearningGoal ?? "",
          courseId: course?.id,
          courseName: course?.name ?? "",
          subject: course?.subject ?? "",
          examDate: course?.examDate ?? "",
          courseLearningGoal: course?.learningGoal ?? "",
        });
      })
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  function update<K extends keyof LearningContextPayload>(
    key: K,
    value: LearningContextPayload[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/profile/learning-context", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json().catch(() => ({
        error: "The learning profile service returned an unreadable response. Please try again.",
      }))) as {
        error?: string;
        course?: { id: string };
        requiresGuardianConsent?: boolean;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not save your profile.");
      }

      if (data.course?.id) {
        setForm((current) => ({ ...current, courseId: data.course?.id }));
      }
      setMessage("Your learning profile is ready.");

      if (redirectAfterSave) {
        await router.push(
          data.requiresGuardianConsent ? "/trust" : redirectAfterSave
        );
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className={styles.loading} role="status">Loading your learning profile…</p>;
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <fieldset className={styles.section}>
        <legend>About you</legend>
        <p className={styles.helper}>
          This helps StudySmart choose the right vocabulary, examples, and challenge level.
        </p>

        <label className={styles.field}>
          <span>Grade level</span>
          <select
            value={form.gradeLevel}
            onChange={(event) => update("gradeLevel", event.target.value)}
            required
          >
            <option value="" disabled>Select your grade level</option>
            {GRADE_LEVELS.map((grade) => (
              <option key={grade.value} value={grade.value}>{grade.label}</option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Age group</span>
          <select
            value={form.ageGroup}
            onChange={(event) => update("ageGroup", event.target.value)}
            required
          >
            <option value="" disabled>Choose your age group</option>
            <option value="UNDER_13">Under 13</option>
            <option value="TEEN">13–17</option>
            <option value="ADULT">18 or older</option>
          </select>
          <small>We use an age group instead of collecting your birth date.</small>
        </label>

        <label className={styles.field}>
          <span>What do you want StudySmart to help you accomplish?</span>
          <textarea
            value={form.primaryLearningGoal}
            onChange={(event) => update("primaryLearningGoal", event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Example: Build better study habits and feel confident before tests."
          />
        </label>
      </fieldset>

      <fieldset className={styles.section}>
        <legend>Your first course</legend>
        <p className={styles.helper}>
          Start with the class that matters most. You can add more courses later.
        </p>

        <div className={styles.twoColumns}>
          <label className={styles.field}>
            <span>Course name</span>
            <input
              value={form.courseName}
              onChange={(event) => update("courseName", event.target.value)}
              maxLength={120}
              placeholder="Example: Biology 1"
              autoComplete="off"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Subject</span>
            <input
              value={form.subject}
              onChange={(event) => update("subject", event.target.value)}
              maxLength={80}
              placeholder="Example: Science"
              autoComplete="off"
              required
            />
          </label>
        </div>

        <label className={styles.field}>
          <span>Exam or deadline <small>Optional</small></span>
          <input
            type="date"
            value={form.examDate}
            onChange={(event) => update("examDate", event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>Course goal <small>Optional</small></span>
          <textarea
            value={form.courseLearningGoal}
            onChange={(event) => update("courseLearningGoal", event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Example: Earn at least a B on the final and understand cellular respiration."
          />
        </label>
      </fieldset>

      <div className={styles.footer}>
        <div className={styles.feedback} aria-live="polite">
          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.success}>{message}</p>}
        </div>
        <button className={styles.submit} type="submit" disabled={saving}>
          {saving ? "Saving…" : redirectAfterSave ? "Build my study plan" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
