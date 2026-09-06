"use client"

import { useEffect, useState } from "react"
import { Radio } from "lucide-react"
import { listQuizzes, type AdminQuiz } from "@/app/actions/admin"
import {
  openSession,
  startSession,
  revealAnswer,
  nextQuestion,
  finishSession,
  abortSession,
  getLiveStateOnce,
  getLiveSettings,
  setLiveSettings,
  clearVotes,
  countVotes,
  type LiveSettings,
} from "@/app/actions/live"
import { nextState, type LiveOp, type LiveState } from "@/lib/live-session"
import type { LiveSnapshot } from "@/lib/live-broadcast"
import { AdminCard, Field, TextInput, Btn, StatGrid, Flash } from "@/components/admin/ui"

const POLL_MS = 2000

const STATE_LABELS: Record<LiveState, string> = {
  lobby: "Salle d'attente",
  question: "Question en cours",
  reveal: "Réponse révélée",
  finished: "Terminée",
  aborted: "Abandonnée",
}

/**
 * True when `op` is a legal transition from `state`. `nextState()` (Task 1)
 * is the one source of truth for what's legal — this never hand-lists which
 * ops are allowed from which state, it just asks the state machine and
 * turns "throws" into "disabled". If the UI and the server ever disagreed
 * about what's possible here, a teacher would find out mid-class.
 */
function canDo(state: LiveState, op: LiveOp): boolean {
  try {
    nextState(state, op)
    return true
  } catch {
    return false
  }
}

export function LiveTab() {
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([])
  const [slug, setSlug] = useState("")
  const [durationS, setDurationS] = useState(20)
  const [snapshot, setSnapshot] = useState<LiveSnapshot | null>(null)
  const [settings, setSettingsDraft] = useState<LiveSettings | null>(null)
  const [pending, setPending] = useState(false)
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null)
  // Whether TERMINAL_WS_URL is set on the server at all — the operator's
  // half of the terminal decision, distinct from `settings.terminalOpen`
  // (the teacher's half). Read from /api/terminal/config, the one place
  // that knows, rather than guessed from anything client-side.
  const [gatewayConfigured, setGatewayConfigured] = useState(false)
  const [voteCount, setVoteCount] = useState<number | null>(null)
  // Two-step confirm for a bulk irreversible delete. Resets on a timer so a
  // half-pressed button never sits armed while the teacher looks away.
  const [confirmClear, setConfirmClear] = useState(false)

  async function refreshSnapshot() {
    setSnapshot(await getLiveStateOnce())
  }

  async function refreshSettings() {
    setSettingsDraft(await getLiveSettings())
  }

  async function refreshVoteCount() {
    try {
      setVoteCount(await countVotes())
    } catch {
      setVoteCount(null)
    }
  }

  async function onClearVotes() {
    if (!confirmClear) {
      setConfirmClear(true)
      window.setTimeout(() => setConfirmClear(false), 6000)
      return
    }
    setConfirmClear(false)
    setPending(true)
    try {
      const { deleted } = await clearVotes()
      setFlash({ ok: true, msg: `${deleted} vote${deleted === 1 ? "" : "s"} effacé${deleted === 1 ? "" : "s"}.` })
      await refreshVoteCount()
    } catch (e) {
      setFlash({ ok: false, msg: e instanceof Error ? e.message : "Échec de l'effacement." })
    } finally {
      setPending(false)
    }
  }

  async function refreshGatewayConfigured() {
    try {
      const res = await fetch("/api/terminal/config", { cache: "no-store" })
      const data = (await res.json()) as { gatewayConfigured: boolean }
      setGatewayConfigured(data.gatewayConfigured)
    } catch {
      setGatewayConfigured(false)
    }
  }

  useEffect(() => {
    listQuizzes().then((rows) => {
      setQuizzes(rows)
      setSlug((s) => s || rows[0]?.slug || "")
    })
    refreshSnapshot()
    refreshSettings()
    refreshVoteCount()
    refreshGatewayConfigured()
    // Session state (participant count, reveal, index) moves from outside
    // this tab too — students joining, timers running out — so a single
    // on-mount fetch isn't enough. Settings are deliberately not polled here:
    // they're a buffered draft edited locally until "Enregistrer", and a
    // poll landing mid-edit would silently discard an unsaved toggle.
    const id = setInterval(refreshSnapshot, POLL_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function run(op: () => Promise<unknown>, okMsg: string) {
    setPending(true)
    try {
      await op()
      setFlash({ ok: true, msg: okMsg })
      await refreshSnapshot()
    } catch (e) {
      setFlash({ ok: false, msg: e instanceof Error ? e.message : "Erreur" })
    } finally {
      setPending(false)
    }
  }

  async function saveSettings() {
    if (!settings) return
    setPending(true)
    try {
      await setLiveSettings(settings)
      setFlash({ ok: true, msg: "Réglages enregistrés." })
    } catch (e) {
      setFlash({ ok: false, msg: e instanceof Error ? e.message : "Erreur" })
    } finally {
      setPending(false)
    }
  }

  const state = snapshot?.state ?? "lobby"
  const hasSession = !!snapshot?.sessionId
  const q = snapshot?.question ?? null
  const isLastQuestion = !!q && q.index + 1 >= q.total
  const durationInvalid = !Number.isFinite(durationS) || durationS <= 0

  return (
    <div className="flex flex-col gap-4">
      <AdminCard
        title="Session en direct"
        action={
          state === "question" && (
            <Radio size={15} className="text-accent animate-blink" aria-label="En direct" />
          )
        }
      >
        {flash && <Flash msg={flash.msg} ok={flash.ok} />}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Quiz">
            <select
              value={slug}
              disabled={pending}
              onChange={(e) => setSlug(e.target.value)}
              className="border-2 border-foreground bg-background px-3 py-2 font-mono text-sm outline-none focus:bg-muted"
            >
              {quizzes.length === 0 && <option value="">Aucun quiz</option>}
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.slug}>
                  {quiz.title} ({quiz.questions} questions)
                </option>
              ))}
            </select>
          </Field>
          <Field label="Durée par question (secondes)">
            <TextInput
              type="number"
              min={5}
              value={durationS}
              disabled={pending}
              onChange={(e) => setDurationS(Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Btn
            disabled={pending || !slug || durationInvalid}
            onClick={() => run(() => openSession(slug, durationS), "Session ouverte.")}
          >
            Ouvrir
          </Btn>
          <Btn
            disabled={pending || !hasSession || !canDo(state, "start")}
            onClick={() => run(() => startSession(), "Session démarrée.")}
          >
            Démarrer
          </Btn>
          <Btn
            disabled={pending || !hasSession || !canDo(state, "reveal")}
            onClick={() => run(() => revealAnswer(), "Réponse révélée.")}
          >
            Révéler
          </Btn>
          <Btn
            disabled={pending || !hasSession || !canDo(state, "next") || isLastQuestion}
            onClick={() => run(() => nextQuestion(), "Question suivante.")}
          >
            Suivante
          </Btn>
          <Btn
            disabled={pending || !hasSession || !canDo(state, "finish")}
            onClick={() => run(() => finishSession(), "Session terminée.")}
          >
            Terminer
          </Btn>
          <Btn
            variant="danger"
            disabled={pending || !hasSession || !canDo(state, "abort")}
            onClick={() => run(() => abortSession(), "Session abandonnée.")}
          >
            Abandonner
          </Btn>
        </div>

        {hasSession && state !== "finished" && state !== "aborted" && (
          <p className="mt-3 font-mono text-[10px] text-muted-foreground">
            {"// ouvrir un nouveau quiz abandonne la session en cours"}
          </p>
        )}
        {state === "reveal" && isLastQuestion && (
          <p className="mt-3 font-mono text-[10px] text-muted-foreground">
            {"// dernière question — utilise Terminer"}
          </p>
        )}

        <div className="mt-4">
          <StatGrid
            stats={[
              { label: "État", value: STATE_LABELS[state] },
              { label: "Question", value: q ? `${q.index + 1} / ${q.total}` : "—" },
              { label: "Participant·es", value: snapshot?.participants.length ?? 0 },
            ]}
          />
        </div>
      </AdminCard>

      <AdminCard title="Réglages">
        {settings ? (
          <>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 font-mono text-xs">
                <input
                  type="checkbox"
                  checked={settings.voteOpen}
                  disabled={pending}
                  onChange={(e) => setSettingsDraft({ ...settings, voteOpen: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Vote ouvert (/vote)
              </label>
              <label className="flex items-center gap-2 font-mono text-xs">
                <input
                  type="checkbox"
                  checked={settings.aiOpen}
                  disabled={pending}
                  onChange={(e) => setSettingsDraft({ ...settings, aiOpen: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Assistant IA ouvert
              </label>

              {/* Clearing the vote board is bulk and irreversible, so it asks
                  twice. Not a modal — a modal would be off-style and is easier
                  to click through on reflex than a button that changes under
                  the cursor. The count is shown because "Effacer" over 0 votes
                  and over 40 are very different actions. */}
              <div className="border-t-2 border-border pt-3 mt-1 flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {voteCount === null ? "…" : `${voteCount} vote${voteCount === 1 ? "" : "s"} enregistré${voteCount === 1 ? "" : "s"}`}
                </span>
                <Btn
                  variant="danger"
                  disabled={pending || voteCount === 0}
                  onClick={onClearVotes}
                >
                  {confirmClear ? "Confirmer l'effacement ?" : "Effacer les votes"}
                </Btn>
                {confirmClear && (
                  <Btn variant="ghost" disabled={pending} onClick={() => setConfirmClear(false)}>
                    Annuler
                  </Btn>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={settings.terminalOpen}
                    disabled={pending || !gatewayConfigured}
                    onChange={(e) => setSettingsDraft({ ...settings, terminalOpen: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  Terminal ouvert (/terminal)
                </label>
                {!gatewayConfigured && (
                  <p className="mt-1 text-[10px] font-mono uppercase text-muted-foreground">
                    {"// aucune passerelle déployée — /terminal reste en bac à sable"}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Btn variant="accent" disabled={pending} onClick={saveSettings}>
                Enregistrer
              </Btn>
              <Btn variant="ghost" disabled={pending} onClick={() => refreshSettings()}>
                Annuler
              </Btn>
            </div>
          </>
        ) : (
          <p className="font-mono text-sm text-muted-foreground">Chargement...</p>
        )}
      </AdminCard>
    </div>
  )
}
