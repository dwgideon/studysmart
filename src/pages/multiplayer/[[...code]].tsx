import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import styles from "@/styles/Multiplayer.module.css";

type RoomQuestion = {
  prompt: string;
  options: string[];
  category: string;
  value: number;
  difficulty: number;
  correctIndex?: number;
  correctAnswer?: string;
};

type RoomState = {
  room: {
    code: string;
    mode: string;
    status: "LOBBY" | "ACTIVE" | "FINISHED" | "CLOSED";
    phase: "LOBBY" | "QUESTION" | "REVEAL" | "RESULTS";
    isHost: boolean;
    currentQuestion: number;
    totalQuestions: number;
    maxPlayers: number;
    roundEndsAt: string | null;
    expiresAt: string;
    sharePath: string;
  };
  me: {
    alias: string;
    score: number;
    correctCount: number;
    xpEarned: number;
    sparksEarned: number;
    rewardsEnabled: boolean;
    selectedIndex: number | null;
    correct: boolean | null;
  };
  players: Array<{
    alias: string;
    score: number;
    correctCount: number;
    isHost: boolean;
    isMe: boolean;
    rank: number;
  }>;
  question: RoomQuestion | null;
  answeredCount: number;
  distribution: Array<{ optionIndex: number; count: number }>;
};

export default function MultiplayerPage() {
  return <RequireAuth><MultiplayerWorld /></RequireAuth>;
}

function MultiplayerWorld() {
  const router = useRouter();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [clock, setClock] = useState(Date.now());
  const attemptedRouteCode = useRef("");

  const routeCode = useMemo(() => {
    const value = router.query.code;
    return (Array.isArray(value) ? value[0] : value ?? "").toUpperCase();
  }, [router.query.code]);

  const post = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const response = await fetch("/api/games/multiplayer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await response.json();
    if (!response.ok) {throw new Error(data.error || "The room could not continue.");}
    return data as RoomState;
  }, []);

  const enterState = useCallback(async (next: RoomState) => {
    setRoom(next);
    setJoinCode(next.room.code);
    if (router.asPath !== next.room.sharePath) {
      await router.replace(next.room.sharePath, undefined, { shallow: true });
    }
  }, [router]);

  const act = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    setBusy(true); setError(""); setMessage("");
    try {
      const next = await post(action, payload);
      await enterState(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The room could not continue.");
    } finally {setBusy(false);}
  }, [enterState, post]);

  const refresh = useCallback(async () => {
    if (!room?.room.code) {return;}
    const response = await fetch(`/api/games/multiplayer?code=${encodeURIComponent(room.room.code)}`);
    if (response.status === 423) {return window.location.assign("/safety-lock");}
    if (!response.ok) {return;}
    setRoom(await response.json());
  }, [room?.room.code]);

  useEffect(() => {
    if (!router.isReady || !routeCode || room || attemptedRouteCode.current === routeCode) {return;}
    attemptedRouteCode.current = routeCode;
    void act("join", { code: routeCode });
  }, [act, room, routeCode, router.isReady]);

  useEffect(() => {
    if (!room || ["FINISHED", "CLOSED"].includes(room.room.status)) {return;}
    const interval = window.setInterval(() => {void refresh();}, 1_000);
    return () => window.clearInterval(interval);
  }, [refresh, room]);

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  const create = () => void act("create");
  const join = () => void act("join", { code: joinCode });
  const roomAction = (action: string) => room && void act(action, { code: room.room.code });
  const answer = (selectedIndex: number) => room && void act("answer", { code: room.room.code, selectedIndex });

  const share = async () => {
    if (!room) {return;}
    const url = `${window.location.origin}${room.room.sharePath}`;
    const text = `Join my StudySmart learning room with code ${room.room.code}`;
    try {
      if (navigator.share) {await navigator.share({ title: "StudySmart multiplayer room", text, url });}
      else {await navigator.clipboard.writeText(`${text}\n${url}`); setMessage("Room link copied. Send it to your classmates!");}
    } catch (cause) {
      if (cause instanceof Error && cause.name !== "AbortError") {setError("The link could not be shared. Copy the room code instead.");}
    }
  };

  const leave = async () => {
    if (!room) {return;}
    setBusy(true);
    try {await post("leave", { code: room.room.code });}
    finally {await router.replace("/games");}
  };

  const secondsLeft = room?.room.roundEndsAt
    ? Math.max(0, Math.ceil((new Date(room.room.roundEndsAt).getTime() - clock) / 1_000))
    : 0;

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/games">← Game World</Link>
        <span>STUDENT-HOSTED · SAFE PRIVATE ROOM</span>
      </header>
      {!room ? (
        <section className={styles.launch}>
          <div className={styles.launchCopy}>
            <p className={styles.eyebrow}>LIVE MASTERY ARENA</p>
            <h1>Bring your study set.<br/><span>Invite your crew.</span></h1>
            <p>Create a private room from your flashcards, receive a code, and send it to other signed-in students. No open chat, custom usernames, or personal details are shared.</p>
          </div>
          <div className={styles.launchCards}>
            <article>
              <span className={styles.launchIcon}>✦</span>
              <h2>Create a room</h2>
              <p>Your room uses up to eight questions from your study cards.</p>
              <button disabled={busy} onClick={create}>{busy ? "Reserving room…" : "Create my room"}</button>
            </article>
            <article>
              <span className={styles.launchIcon}>⌁</span>
              <h2>Join classmates</h2>
              <label htmlFor="room-code">Six-character code</label>
              <input id="room-code" value={joinCode} maxLength={6} autoCapitalize="characters" autoComplete="off" onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} onKeyDown={(event) => {if (event.key === "Enter") {join();}}} placeholder="ABC234" />
              <button disabled={busy || joinCode.length !== 6} onClick={join}>{busy ? "Joining…" : "Join room"}</button>
            </article>
          </div>
        </section>
      ) : room.room.status === "LOBBY" ? (
        <Lobby room={room} busy={busy} onShare={() => void share()} onStart={() => roomAction("start")} onLeave={() => void leave()} />
      ) : room.room.status === "ACTIVE" && room.question ? (
        <LiveRound room={room} secondsLeft={secondsLeft} busy={busy} onAnswer={answer} onReveal={() => roomAction("reveal")} onNext={() => roomAction("next")} onLeave={() => void leave()} />
      ) : (
        <Results room={room} busy={busy} onClose={() => roomAction("close")} onLeave={() => void leave()} />
      )}
      {(message || error) && <div className={error ? styles.error : styles.message} role={error ? "alert" : "status"}>{error || message}</div>}
    </main>
  );
}

function Lobby({ room, busy, onShare, onStart, onLeave }: { room: RoomState; busy: boolean; onShare: () => void; onStart: () => void; onLeave: () => void }) {
  return <section className={styles.roomShell}>
    <div className={styles.roomHeader}>
      <div><p className={styles.eyebrow}>ROOM READY</p><h1>Invite your study crew.</h1><p>You are <strong>{room.me.alias}</strong>. Friendly aliases protect everyone’s real identity.</p></div>
      <div className={styles.codeCard}><span>ROOM CODE</span><strong>{room.room.code}</strong><button onClick={onShare}>Share code & link</button></div>
    </div>
    <div className={styles.lobbyGrid}>
      <PlayerList room={room} />
      <aside className={styles.controlPanel}><span className={styles.livePulse}>● LOBBY LIVE</span><h2>{room.players.length} of {room.room.maxPlayers} joined</h2><p>Players can reconnect with the same code. The room expires automatically and has no chat or custom public names.</p>{room.room.isHost ? <button className={styles.startButton} disabled={busy} onClick={onStart}>Start Knowledge Grid →</button> : <div className={styles.waiting}>Waiting for the student host to start…</div>}<button className={styles.leaveButton} disabled={busy} onClick={onLeave}>{room.room.isHost ? "Close room" : "Leave room"}</button></aside>
    </div>
  </section>;
}

function LiveRound({ room, secondsLeft, busy, onAnswer, onReveal, onNext, onLeave }: { room: RoomState; secondsLeft: number; busy: boolean; onAnswer: (index: number) => void; onReveal: () => void; onNext: () => void; onLeave: () => void }) {
  const question = room.question!;
  const revealed = room.room.phase === "REVEAL";
  const answered = room.me.selectedIndex !== null;
  return <section className={styles.roomShell}>
    <div className={styles.roundHeader}><button className={styles.leaveButton} onClick={onLeave}>Exit</button><div><p className={styles.eyebrow}>{question.category}</p><h1>Question {room.room.currentQuestion + 1} / {room.room.totalQuestions}</h1></div><div className={`${styles.timer} ${secondsLeft <= 5 && !revealed ? styles.timerLow : ""}`}><span>{revealed ? "REVEAL" : "TIME"}</span><strong>{revealed ? "✓" : secondsLeft}</strong></div></div>
    <div className={styles.liveGrid}>
      <article className={styles.questionStage}>
        <div className={styles.questionMeta}><span>{question.value} base points</span><span>{room.answeredCount}/{room.players.length} answered</span></div>
        <h2>{question.prompt}</h2>
        <div className={styles.answerGrid}>{question.options.map((option, index) => {
          const selected = room.me.selectedIndex === index;
          const correct = revealed && question.correctIndex === index;
          const distribution = room.distribution.find((item) => item.optionIndex === index)?.count ?? 0;
          return <button key={`${option}-${index}`} disabled={busy || answered || revealed} className={`${selected ? styles.selectedAnswer : ""} ${correct ? styles.correctAnswer : ""}`} onClick={() => onAnswer(index)}><b>{String.fromCharCode(65 + index)}</b><span>{option}</span>{revealed && <em>{distribution} chose this</em>}</button>;
        })}</div>
        {answered && !revealed && <div className={styles.lockedAnswer}>Answer locked. Waiting for the reveal…</div>}
        {revealed && <div className={room.me.correct ? styles.correctFeedback : styles.reviewFeedback}><strong>{room.me.correct ? "Great connection!" : "Lock in the correction."}</strong><span>Correct answer: {question.correctAnswer}</span></div>}
        <div className={styles.hostControls}>{room.room.isHost ? (revealed ? <button disabled={busy} onClick={onNext}>{room.room.currentQuestion + 1 === room.room.totalQuestions ? "Show final results" : "Next question"} →</button> : <button disabled={busy} onClick={onReveal}>Reveal answer now</button>) : <span>{revealed ? "Waiting for the host to continue…" : "The answer reveals when time ends or the host advances."}</span>}</div>
      </article>
      <PlayerList room={room} compact />
    </div>
    {!room.me.rewardsEnabled && <p className={styles.practiceNote}>Practice room: today’s multiplayer reward limit is reached, but your score still counts in this room.</p>}
  </section>;
}

function Results({ room, busy, onClose, onLeave }: { room: RoomState; busy: boolean; onClose: () => void; onLeave: () => void }) {
  const winner = room.players[0];
  return <section className={styles.roomShell}><div className={styles.resultsHero}><span>✦</span><p className={styles.eyebrow}>MISSION COMPLETE</p><h1>{winner ? `${winner.alias} leads the room!` : "Room complete"}</h1><p>You earned {room.me.xpEarned} XP and {room.me.sparksEarned} Sparks in this room.</p></div><div className={styles.resultsGrid}><PlayerList room={room} /> <aside className={styles.controlPanel}><h2>Your result</h2><div className={styles.personalResult}><strong>{room.me.score}</strong><span>points</span><strong>{room.me.correctCount}/{room.room.totalQuestions}</strong><span>correct</span></div>{room.room.isHost && room.room.status !== "CLOSED" ? <button className={styles.startButton} disabled={busy} onClick={onClose}>Close room</button> : null}<button className={styles.leaveButton} onClick={onLeave}>Return to Game World</button></aside></div></section>;
}

function PlayerList({ room, compact = false }: { room: RoomState; compact?: boolean }) {
  return <section className={`${styles.playerPanel} ${compact ? styles.compactPlayers : ""}`}><header><div><p className={styles.eyebrow}>LIVE CREW</p><h2>{room.room.status === "LOBBY" ? "Players connected" : "Leaderboard"}</h2></div><span>{room.players.length}</span></header><ol>{room.players.map((player) => <li key={player.alias} className={player.isMe ? styles.me : ""}><b>#{player.rank}</b><span><strong>{player.alias}</strong><small>{player.isHost ? "Student host" : player.isMe ? "You" : "Player"}</small></span><em>{player.score} pts</em></li>)}</ol></section>;
}
