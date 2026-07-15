import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RequireAuth from "../components/RequireAuth";
import type { AvatarItem, AvatarSlot, GameMode } from "@/lib/gameEconomy";
import type { Companion } from "@/lib/learningCompanions";
import { companionGreeting } from "@/lib/learningCompanions";
import TalkingCompanion from "@/components/TalkingCompanion";
import styles from "@/styles/Games.module.css";

type Avatar = { hair: string; top: string; extra: string };
type Player = { name: string; xp: number; level: number; sparks: number };
type GameQuestion = { cardId: string; prompt: string; options: string[]; category: string; value: number; difficulty: number; material: string };
type Hub = {
  player: Player;
  avatar: Avatar;
  owned: string[];
  catalog: AvatarItem[];
  leaderboard: { rank: number; name: string; xp: number }[];
  recentRuns: { id: string; mode: GameMode; project: string | null; score: number; xpEarned: number; sparksEarned: number }[];
  experience: { gradeLevel: string; gradeBand: "EARLY" | "ELEMENTARY" | "MIDDLE" | "HIGH"; companion: Companion; companions: Companion[]; readAloud: boolean; speechRate: number };
};
type Run = { runId: string; mode: GameMode; project: string | null; rewardsEnabled: boolean; questions: GameQuestion[] };
type AnswerResult = {
  correct: boolean;
  correctIndex: number;
  correctAnswer: string;
  reward: { xp: number; sparks: number };
  finished: boolean;
  score: number;
  xpEarned: number;
  sparksEarned: number;
  player: Player;
  material: string | null;
};

const projects = [
  { id: "Sky Station", icon: "⌂", description: "Build a floating research base." },
  { id: "Eco Rover", icon: "◈", description: "Engineer a clean-energy explorer." },
  { id: "Dream Library", icon: "▥", description: "Create a library for your learning world." },
];

export default function GamesPage() {
  return <RequireAuth><GameWorld /></RequireAuth>;
}

function GameWorld() {
  const [hub, setHub] = useState<Hub | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [answered, setAnswered] = useState<Record<number, AnswerResult>>({});
  const [materials, setMaterials] = useState<Record<string, number>>({});
  const [selectedProject, setSelectedProject] = useState(projects[0].id);
  const [tab, setTab] = useState<"play" | "companion" | "avatar" | "ranks">("play");
  const [voiceSessionOn, setVoiceSessionOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadHub = useCallback(async () => {
    const response = await fetch("/api/games/hub");
    if (response.status === 423) {return window.location.assign("/safety-lock");}
    const data = await response.json();
    if (!response.ok) {throw new Error(data.error || "Could not load Game World.");}
    setHub(data);
  }, []);

  useEffect(() => { loadHub().catch((error) => setMessage(error.message)); }, [loadHub]);

  const startGame = async (mode: GameMode) => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/games/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", mode, project: selectedProject }) });
      const data = await response.json();
      if (!response.ok) {throw new Error(data.error);}
      setRun(data); setAnswered({}); setMaterials({}); setSelectedQuestion(mode === "BUILD" ? 0 : null);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not start the game."); }
    finally { setBusy(false); }
  };

  const answer = async (choice: number) => {
    if (!run || selectedQuestion === null || busy) {return;}
    setBusy(true);
    try {
      const response = await fetch("/api/games/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "answer", runId: run.runId, questionIndex: selectedQuestion, selectedIndex: choice }) });
      const data: AnswerResult & { error?: string } = await response.json();
      if (!response.ok) {throw new Error(data.error);}
      setAnswered((current) => ({ ...current, [selectedQuestion]: data }));
      if (data.material) {setMaterials((current) => ({ ...current, [data.material!]: (current[data.material!] || 0) + 1 }));}
      if (hub) {setHub({ ...hub, player: { ...hub.player, ...data.player } });}
    } catch (error) { setMessage(error instanceof Error ? error.message : "Your answer could not be saved."); }
    finally { setBusy(false); }
  };

  const closeQuestion = () => {
    if (!run || selectedQuestion === null) {return;}
    const result = answered[selectedQuestion];
    if (result?.finished) { setRun(null); setSelectedQuestion(null); loadHub(); return; }
    if (run.mode === "BUILD") {
      const next = run.questions.findIndex((_, index) => !answered[index] && index !== selectedQuestion);
      setSelectedQuestion(next >= 0 ? next : null);
    } else {setSelectedQuestion(null);}
  };

  if (!hub) {return <main className={styles.page}><div className={styles.loading}><span className={styles.loader} />Entering Game World…</div></main>;}
  const current = selectedQuestion === null ? null : run?.questions[selectedQuestion];
  const currentResult = selectedQuestion === null ? undefined : answered[selectedQuestion];
  const owned = new Set(hub.owned);
  const elementaryMode = hub.experience.gradeBand === "EARLY" || hub.experience.gradeBand === "ELEMENTARY";
  const greeting = companionGreeting(hub.experience.companion, hub.player.name, hub.experience.gradeBand === "EARLY");

  return (
    <main className={`${styles.page} ${elementaryMode ? styles.elementaryPage : styles.olderPage}`}>
      <section className={styles.hero}>
        <div><p className={styles.eyebrow}>{elementaryMode ? "YOUR LEARNING ADVENTURE" : "STUDYSMART GAME WORLD"}</p><h1>{elementaryMode ? <>Learn. Play.<br/><span>Grow together!</span></> : <>Learn it. Build it.<br/><span>Make it yours.</span></>}</h1><p>{elementaryMode ? `${hub.experience.companion.name} can read every question out loud while you follow the words.` : "Every right answer moves your knowledge—and your world—forward."}</p></div>
        <div className={styles.playerCard}>
          <AvatarView avatar={hub.avatar} catalog={hub.catalog} />
          <div><span>LEVEL {hub.player.level}</span><strong>{hub.player.name}</strong><div className={styles.xpTrack}><i style={{ width: `${hub.player.xp % 100}%` }} /></div><small>{hub.player.xp % 100} / 100 XP to next level</small></div>
          <div className={styles.wallet}><b>✦</b><span><strong>{hub.player.sparks}</strong> Sparks</span></div>
        </div>
      </section>

      <nav className={styles.tabs} aria-label="Game World sections">
        {([['play',elementaryMode ? 'Play & Learn' : 'Game Arcade'],['companion',elementaryMode ? 'My Talking Buddy' : 'Companion'],['avatar','Avatar Studio'],['ranks','League']] as const).map(([id,label]) => <button key={id} className={tab === id ? styles.activeTab : ""} onClick={() => setTab(id)}>{label}</button>)}
      </nav>
      {message && <div className={styles.notice} role="alert">{message}<button onClick={() => setMessage("")} aria-label="Dismiss">×</button></div>}

      {tab === "play" && !run && <section className={styles.arcade}>
        {elementaryMode && <div className={styles.companionWelcome}><TalkingCompanion companion={hub.experience.companion} text={greeting} speechRate={hub.experience.speechRate} autoRead={voiceSessionOn && hub.experience.readAloud} autoKey={`welcome-${voiceSessionOn}`} /><button className={styles.voiceStart} onClick={() => setVoiceSessionOn((current) => !current)}>{voiceSessionOn ? "🔇 Turn off automatic reading" : `🔊 Start ${hub.experience.companion.name}’s voice`}</button><p>The words always stay on screen. You can pause, replay, or turn the voice off any time.</p></div>}
        <article className={`${styles.modeCard} ${styles.gridCard}`}>
          <div className={styles.cardGlow} /><p className={styles.modeTag}>KNOWLEDGE GRID</p><h2>Choose your challenge.</h2><p>Pick a category and point value. Master harder questions for bigger rewards.</p>
          <div className={styles.miniBoard}>{[100,200,300,400,500,600].map((value) => <span key={value}>{value}</span>)}</div>
          <button className={styles.primaryButton} disabled={busy} onClick={() => startGame("GRID")}>Play Knowledge Grid <span>→</span></button>
        </article>
        <article className={`${styles.modeCard} ${styles.buildCard}`}>
          <div className={styles.cardGlow} /><p className={styles.modeTag}>BUILD LAB</p><h2>Answers become materials.</h2><p>Get questions right to collect timber, alloy, energy, and glass—then watch your creation come alive.</p>
          <div className={styles.projectPicker}>{projects.map((project) => <button key={project.id} aria-pressed={selectedProject === project.id} className={selectedProject === project.id ? styles.chosenProject : ""} onClick={() => setSelectedProject(project.id)}><b>{project.icon}</b><span>{project.id}<small>{project.description}</small></span></button>)}</div>
          <button className={styles.primaryButton} disabled={busy} onClick={() => startGame("BUILD")}>Build {selectedProject} <span>→</span></button>
        </article>
        <section className={styles.recent}><div><p className={styles.eyebrow}>YOUR MOMENTUM</p><h2>Recent missions</h2></div>{hub.recentRuns.length ? <div className={styles.runList}>{hub.recentRuns.slice(0,3).map((item) => <div key={item.id}><span>{item.mode === "BUILD" ? "▦" : "◆"}</span><b>{item.project || "Knowledge Grid"}</b><small>{item.score} correct</small><em>+{item.xpEarned} XP · +{item.sparksEarned} ✦</em></div>)}</div> : <p>Complete your first mission to begin your history.</p>}</section>
      </section>}

      {tab === "play" && run?.mode === "GRID" && <KnowledgeGrid run={run} answered={answered} onSelect={setSelectedQuestion} />}
      {tab === "play" && run?.mode === "BUILD" && <BuildLab run={run} answered={answered} materials={materials} project={selectedProject} />}

      {tab === "avatar" && <AvatarStudio hub={hub} owned={owned} setHub={setHub} setMessage={setMessage} />}
      {tab === "companion" && <CompanionCove hub={hub} elementaryMode={elementaryMode} voiceSessionOn={voiceSessionOn} setVoiceSessionOn={setVoiceSessionOn} setHub={setHub} setMessage={setMessage} />}
      {tab === "ranks" && <League hub={hub} />}

      {current && <QuestionModal question={current} result={currentResult} busy={busy} rewardsEnabled={Boolean(run?.rewardsEnabled)} companion={hub.experience.companion} speechRate={hub.experience.speechRate} autoRead={elementaryMode && hub.experience.readAloud && voiceSessionOn} onAnswer={answer} onContinue={closeQuestion} />}
    </main>
  );
}

function KnowledgeGrid({ run, answered, onSelect }: { run: Run; answered: Record<number, AnswerResult>; onSelect: (index: number) => void }) {
  const groups = useMemo(() => {
    const map = new Map<string, { question: GameQuestion; index: number }[]>();
    run.questions.forEach((question, index) => map.set(question.category, [...(map.get(question.category) || []), { question, index }]));
    return [...map.entries()].slice(0, 4);
  }, [run.questions]);
  return <section className={styles.gameStage}><header><button className={styles.backButton} onClick={() => window.location.reload()}>← Exit round</button><div><p className={styles.eyebrow}>KNOWLEDGE GRID</p><h2>Choose a signal</h2></div><div className={styles.roundScore}><span>{Object.values(answered).filter((a) => a.correct).length}</span> correct</div></header>{!run.rewardsEnabled && <p className={styles.practiceNote}>Practice round: today’s reward limit is reached, but every answer still strengthens mastery.</p>}<div className={styles.board}>{groups.map(([category, questions]) => <div className={styles.column} key={category}><h3>{category}</h3>{questions.map(({ question,index }) => <button key={question.cardId} disabled={Boolean(answered[index])} className={answered[index] ? (answered[index].correct ? styles.wonTile : styles.missedTile) : ""} onClick={() => onSelect(index)}>{answered[index] ? (answered[index].correct ? "✓" : "Review") : question.value}</button>)}</div>)}</div></section>;
}

function BuildLab({ run, answered, materials, project }: { run: Run; answered: Record<number, AnswerResult>; materials: Record<string, number>; project: string }) {
  const complete = Object.values(answered).filter((answer) => answer.correct).length;
  const progress = Math.round((complete / run.questions.length) * 100);
  return <section className={styles.gameStage}><header><button className={styles.backButton} onClick={() => window.location.reload()}>← Exit lab</button><div><p className={styles.eyebrow}>BUILD LAB · {project.toUpperCase()}</p><h2>Construction in progress</h2></div><div className={styles.roundScore}><span>{complete}</span> parts earned</div></header>{!run.rewardsEnabled && <p className={styles.practiceNote}>Practice build: today’s reward limit is reached, but the project can still be completed.</p>}<div className={styles.lab}><div className={styles.blueprint}><div className={styles.scanline}/><div className={styles.structure} data-project={project} style={{ "--build-progress": `${Math.max(10, progress)}%` } as React.CSSProperties}><span>✦</span><i/><b>{project}</b></div><div className={styles.progress}><span style={{ width: `${progress}%` }}/></div><small>Blueprint {progress}% assembled</small></div><div className={styles.materialPanel}><h3>Material bay</h3>{["Timber","Alloy","Energy","Glass"].map((material) => <div key={material}><i className={styles[`material${material}`]}/><span>{material}</span><b>{materials[material] || 0}</b></div>)}<p>{Object.keys(answered).length < run.questions.length ? "Answer the active challenge to fabricate the next part." : progress === 100 ? "Perfect build! Every part is assembled." : "Round complete. Replay to upgrade the unfinished sections."}</p></div></div></section>;
}

function QuestionModal({ question, result, busy, rewardsEnabled, companion, speechRate, autoRead, onAnswer, onContinue }: { question: GameQuestion; result?: AnswerResult; busy: boolean; rewardsEnabled: boolean; companion: Companion; speechRate: number; autoRead: boolean; onAnswer: (choice: number) => void; onContinue: () => void }) {
  const questionSpeech = `Here is your question. ${question.prompt}. Your choices are: ${question.options.map((option, index) => `${String.fromCharCode(65 + index)}, ${option}`).join(". ")}.`;
  const feedbackSpeech = result ? (result.correct ? `You got it! Great thinking. You earned ${result.reward.xp} experience points and ${result.reward.sparks} Sparks.` : `Nice try. The correct answer is ${result.correctAnswer}. Mistakes help your brain grow.`) : questionSpeech;
  return <div className={styles.modalBackdrop} role="presentation"><section className={styles.questionModal} role="dialog" aria-modal="true" aria-labelledby="question-title"><TalkingCompanion companion={companion} text={feedbackSpeech} speechRate={speechRate} autoRead={autoRead} autoKey={`${question.cardId}-${result ? (result.correct ? "correct" : "review") : "question"}`} compact/><div className={styles.questionMeta}><span>{question.category}</span><b>{question.value} points</b></div><h2 id="question-title">{question.prompt}</h2><div className={styles.answers}>{question.options.map((option,index) => <button key={`${option}-${index}`} disabled={busy || Boolean(result)} className={result ? (index === result.correctIndex ? styles.correctAnswer : "") : ""} onClick={() => onAnswer(index)}><span>{String.fromCharCode(65+index)}</span>{option}</button>)}</div>{result && <div className={result.correct ? styles.successResult : styles.reviewResult}><div><b>{result.correct ? "Brilliant connection!" : "Good attempt—now lock it in."}</b><p>{result.correct ? "Your progress and rewards were saved." : `Correct answer: ${result.correctAnswer}`}</p></div>{rewardsEnabled && result.correct && <span>+{result.reward.xp} XP&nbsp;&nbsp; +{result.reward.sparks} ✦</span>}<button onClick={onContinue}>{result.finished ? "Finish mission" : "Continue"} →</button></div>}</section></div>;
}

function CompanionCove({ hub, elementaryMode, voiceSessionOn, setVoiceSessionOn, setHub, setMessage }: { hub: Hub; elementaryMode: boolean; voiceSessionOn: boolean; setVoiceSessionOn: (value: boolean) => void; setHub: (hub: Hub) => void; setMessage: (message: string) => void }) {
  const choices = hub.experience.companions.filter((companion) => companion.elementary === elementaryMode);
  const save = async (updates: Partial<Pick<Hub["experience"], "companion" | "readAloud" | "speechRate">>) => {
    const next = { ...hub.experience, ...updates };
    const response = await fetch("/api/games/companion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companionId: next.companion.id, readAloud: next.readAloud, speechRate: next.speechRate }) });
    const data = await response.json();
    if (!response.ok) {setMessage(data.error || "Your companion could not be updated."); return;}
    setHub({ ...hub, experience: next });
  };
  const greeting = companionGreeting(hub.experience.companion, hub.player.name, hub.experience.gradeBand === "EARLY");
  return <section className={styles.companionCove}><div className={styles.coveStage}><p className={styles.eyebrow}>{elementaryMode ? "COMPANION COVE" : "COMPANION NETWORK"}</p><h2>{elementaryMode ? "Pick your learning buddy" : "Choose your mission guide"}</h2><TalkingCompanion companion={hub.experience.companion} text={greeting} speechRate={hub.experience.speechRate} autoRead={voiceSessionOn && hub.experience.readAloud} autoKey={`${hub.experience.companion.id}-${voiceSessionOn}`} /><button className={styles.voiceStart} onClick={() => setVoiceSessionOn(!voiceSessionOn)}>{voiceSessionOn ? "🔇 Stop automatic reading" : "🔊 Turn on voice for this visit"}</button></div><div className={styles.companionSettings}><h3>Choose a buddy</h3><div className={styles.companionChoices}>{choices.map((companion) => <button key={companion.id} className={hub.experience.companion.id === companion.id ? styles.selectedCompanion : ""} onClick={() => save({ companion })}><span style={{ background: `linear-gradient(145deg, ${companion.accent}, ${companion.color})` }}>{companion.emoji}</span><b>{companion.name} the {companion.animal}</b><small>{companion.trait}</small></button>)}</div><fieldset><legend>Reading voice</legend><label><input type="checkbox" checked={hub.experience.readAloud} onChange={(event) => save({ readAloud: event.target.checked })}/><span>Read new questions automatically after I turn voice on</span></label><label><span>Voice speed</span><select value={hub.experience.speechRate} onChange={(event) => save({ speechRate: Number(event.target.value) })}><option value="0.7">Slow and steady</option><option value="0.9">Just right</option><option value="1.1">A little faster</option></select></label><p>StudySmart uses your device’s voice. Question text is not sent to another voice service.</p></fieldset></div></section>;
}

function AvatarStudio({ hub, owned, setHub, setMessage }: { hub: Hub; owned: Set<string>; setHub: (hub: Hub) => void; setMessage: (message: string) => void }) {
  const updateItem = async (action: "buy" | "equip", item: AvatarItem) => {
    const response = await fetch("/api/games/avatar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, itemId: item.id }) });
    const data = await response.json();
    if (!response.ok) {return setMessage(data.error);}
    const newOwned = action === "buy" ? [...hub.owned, item.id] : hub.owned;
    const avatar = action === "equip" ? { ...hub.avatar, [item.slot]: item.id } : hub.avatar;
    setHub({ ...hub, player: { ...hub.player, sparks: data.sparks }, owned: newOwned, avatar });
  };
  const equipped = (item: AvatarItem) => hub.avatar[item.slot] === item.id;
  return <section className={styles.studio}><div className={styles.avatarStage}><p className={styles.eyebrow}>YOUR LEARNER IDENTITY</p><h2>Avatar Studio</h2><AvatarView avatar={hub.avatar} catalog={hub.catalog} large/><div className={styles.avatarName}><strong>{hub.player.name}</strong><span>Level {hub.player.level} learner</span></div><div className={styles.safeEconomy}>✦ Sparks are earned only by learning. No real-money purchases, random rewards, or trading.</div></div><div className={styles.shop}><header><div><p className={styles.eyebrow}>STYLE COLLECTION</p><h2>Make it yours</h2></div><div className={styles.shopWallet}>✦ {hub.player.sparks}</div></header>{(["hair","top","extra"] as AvatarSlot[]).map((slot) => <div className={styles.shelf} key={slot}><h3>{slot === "extra" ? "Accessories" : slot === "top" ? "Outfits" : "Hair"}</h3><div>{hub.catalog.filter((item) => item.slot === slot).map((item) => <article key={item.id} className={equipped(item) ? styles.equippedItem : ""}><span style={{ background: item.color }}>{item.icon}</span><b>{item.name}</b><small>{item.description}</small>{equipped(item) ? <button disabled>Equipped ✓</button> : owned.has(item.id) ? <button onClick={() => updateItem("equip",item)}>Equip</button> : <button onClick={() => updateItem("buy",item)}>✦ {item.price}</button>}</article>)}</div></div>)}</div></section>;
}

function AvatarView({ avatar, catalog, large = false }: { avatar: Avatar; catalog: AvatarItem[]; large?: boolean }) {
  const item = (id: string) => catalog.find((entry) => entry.id === id);
  return <div className={`${styles.avatar} ${large ? styles.largeAvatar : ""}`} aria-label="Your customized avatar"><div className={styles.avatarHalo}/><div className={styles.avatarHair} style={{ background: item(avatar.hair)?.color }}/><div className={styles.avatarHead}><i/><i/><b/></div><div className={styles.avatarTop} style={{ background: item(avatar.top)?.color }}><span>{item(avatar.top)?.icon}</span></div>{avatar.extra !== "extra_none" && <div className={styles.avatarExtra} style={{ color: item(avatar.extra)?.color }}>{item(avatar.extra)?.icon}</div>}</div>;
}

function League({ hub }: { hub: Hub }) {
  return <section className={styles.league}><div><p className={styles.eyebrow}>WEEKLY LEARNING LEAGUE</p><h2>Progress, not pressure.</h2><p>XP celebrates consistent learning. Only first names or “Learner” appear—never email addresses.</p></div><ol>{hub.leaderboard.map((entry) => <li key={`${entry.rank}-${entry.name}`} className={entry.name === "You" ? styles.you : ""}><span>#{entry.rank}</span><div className={styles.rankOrb}>{entry.rank === 1 ? "✦" : entry.name.charAt(0)}</div><b>{entry.name}</b><em>{entry.xp} XP</em></li>)}</ol><Link href="/dashboard" className={styles.backDashboard}>Return to learning dashboard →</Link></section>;
}
