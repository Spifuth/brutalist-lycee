"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, ListChecks, ChevronLeft } from "lucide-react"
import {
  listQuizzes,
  upsertQuiz,
  deleteQuiz,
  listQuizQuestions,
  upsertQuizQuestion,
  deleteQuizQuestion,
  type AdminQuiz,
  type AdminQuizQuestion,
} from "@/app/actions/admin"
import { AdminCard, Field, TextInput, TextArea, Btn, ConfirmBtn, Flash } from "@/components/admin/ui"
import { cn } from "@/lib/utils"

const EMPTY_QUIZ: Omit<AdminQuiz, "id" | "questions"> & { id?: string } = {
  slug: "",
  title: "",
  description: "",
  topic: "cyber",
  level: "tous",
  badgeSlug: "",
  published: true,
  position: 0,
}

export function QuizzesTab() {
  const [rows, setRows] = useState<AdminQuiz[]>([])
  const [draft, setDraft] = useState<typeof EMPTY_QUIZ | null>(null)
  const [editing, setEditing] = useState<AdminQuiz | null>(null)
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null)

  async function refresh() {
    setRows(await listQuizzes())
  }
  useEffect(() => {
    refresh()
  }, [])

  async function save() {
    if (!draft) return
    try {
      await upsertQuiz(draft)
      setFlash({ ok: true, msg: draft.id ? "Quiz mis à jour." : "Quiz créé." })
      setDraft(null)
      refresh()
    } catch (e) {
      setFlash({ ok: false, msg: e instanceof Error ? e.message : "Erreur" })
    }
  }

  if (editing) {
    return <QuizQuestionsEditor quiz={editing} onBack={() => { setEditing(null); refresh() }} />
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminCard
        title="Quiz"
        action={
          <Btn variant="accent" onClick={() => setDraft({ ...EMPTY_QUIZ, position: rows.length })}>
            <Plus size={12} className="mr-1 inline" /> Nouveau
          </Btn>
        }
      >
        {flash && <Flash msg={flash.msg} ok={flash.ok} />}
        <ul className="divide-y-2 divide-border">
          {rows.map((q) => (
            <li key={q.id} className="flex items-center gap-3 py-3">
              <ListChecks size={16} className="shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-bold">
                  {q.title} {!q.published && <span className="text-muted-foreground">(brouillon)</span>}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {q.topic} · {q.level} · {q.questions} questions
                </p>
              </div>
              <Btn variant="ghost" onClick={() => setEditing(q)}>
                Questions
              </Btn>
              <Btn variant="ghost" aria-label="Modifier" onClick={() => setDraft(q)}>
                <Pencil size={14} />
              </Btn>
              <ConfirmBtn
                label="Supprimer"
                onConfirm={async () => {
                  await deleteQuiz(q.id)
                  refresh()
                }}
              >
                <Trash2 size={14} className="text-destructive" />
              </ConfirmBtn>
            </li>
          ))}
          {rows.length === 0 && <li className="py-6 text-center font-mono text-sm text-muted-foreground">Aucun quiz.</li>}
        </ul>
      </AdminCard>

      {draft && (
        <AdminCard title={draft.id ? "Modifier le quiz" : "Nouveau quiz"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Titre">
              <TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="Slug">
              <TextInput value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
            </Field>
            <Field label="Thème" hint="cyber, ia, reseau, prive...">
              <TextInput value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} />
            </Field>
            <Field label="Niveau">
              <TextInput value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value })} />
            </Field>
            <Field label="Badge lié (slug, optionnel)">
              <TextInput value={draft.badgeSlug ?? ""} onChange={(e) => setDraft({ ...draft, badgeSlug: e.target.value })} />
            </Field>
            <Field label="Position">
              <TextInput
                type="number"
                value={draft.position}
                onChange={(e) => setDraft({ ...draft, position: Number(e.target.value) })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <TextArea
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 font-mono text-xs">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Publié
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Btn variant="accent" onClick={save}>
              Enregistrer
            </Btn>
            <Btn variant="ghost" onClick={() => setDraft(null)}>
              Annuler
            </Btn>
          </div>
          {!draft.id && (
            <p className="mt-3 font-mono text-[10px] text-muted-foreground">
              {"// crée le quiz puis clique « Questions » pour ajouter des questions"}
            </p>
          )}
        </AdminCard>
      )}
    </div>
  )
}

const EMPTY_Q: Omit<AdminQuizQuestion, "id"> & { id?: string } = {
  prompt: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
  position: 0,
}

function QuizQuestionsEditor({ quiz, onBack }: { quiz: AdminQuiz; onBack: () => void }) {
  const [rows, setRows] = useState<AdminQuizQuestion[]>([])
  const [draft, setDraft] = useState<typeof EMPTY_Q | null>(null)

  async function refresh() {
    setRows(await listQuizQuestions(quiz.id))
  }
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save() {
    if (!draft) return
    await upsertQuizQuestion(quiz.id, { ...draft, options: draft.options.filter((o) => o.trim()) })
    setDraft(null)
    refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminCard
        title={`Questions — ${quiz.title}`}
        action={
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={onBack}>
              <ChevronLeft size={12} className="mr-1 inline" /> Retour
            </Btn>
            <Btn variant="accent" onClick={() => setDraft({ ...EMPTY_Q, position: rows.length })}>
              <Plus size={12} className="mr-1 inline" /> Question
            </Btn>
          </div>
        }
      >
        <ul className="flex flex-col gap-2">
          {rows.map((q, i) => (
            <li key={q.id} className="border-2 border-foreground p-3">
              <div className="flex items-start gap-3">
                <span className="font-pixel text-lg text-accent">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{q.prompt}</p>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {q.options.map((o, oi) => (
                      <li
                        key={oi}
                        className={cn(
                          "border px-2 py-0.5 font-mono text-[10px]",
                          oi === q.correctIndex ? "border-accent text-accent" : "border-border text-muted-foreground",
                        )}
                      >
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Btn variant="ghost" aria-label="Modifier" onClick={() => setDraft(q)}>
                    <Pencil size={14} />
                  </Btn>
                  <ConfirmBtn label="Supprimer" onConfirm={() => deleteQuizQuestion(q.id).then(refresh)}>
                    <Trash2 size={14} className="text-destructive" />
                  </ConfirmBtn>
                </div>
              </div>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="py-6 text-center font-mono text-sm text-muted-foreground">Aucune question.</li>
          )}
        </ul>
      </AdminCard>

      {draft && (
        <AdminCard title={draft.id ? "Modifier la question" : "Nouvelle question"}>
          <div className="flex flex-col gap-3">
            <Field label="Énoncé">
              <TextArea rows={2} value={draft.prompt} onChange={(e) => setDraft({ ...draft, prompt: e.target.value })} />
            </Field>
            <div className="grid gap-2 sm:grid-cols-2">
              {draft.options.map((o, i) => (
                <label key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={draft.correctIndex === i}
                    onChange={() => setDraft({ ...draft, correctIndex: i })}
                    className="h-4 w-4 accent-[var(--accent)]"
                    aria-label={`Bonne réponse ${i + 1}`}
                  />
                  <TextInput
                    value={o}
                    placeholder={`Option ${i + 1}`}
                    onChange={(e) => {
                      const options = [...draft.options]
                      options[i] = e.target.value
                      setDraft({ ...draft, options })
                    }}
                    className="flex-1"
                  />
                </label>
              ))}
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">
              {"// coche le bouton radio de la bonne réponse"}
            </p>
            <Field label="Explication (affichée après réponse)">
              <TextArea
                rows={2}
                value={draft.explanation}
                onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Btn variant="accent" onClick={save}>
              Enregistrer
            </Btn>
            <Btn variant="ghost" onClick={() => setDraft(null)}>
              Annuler
            </Btn>
          </div>
        </AdminCard>
      )}
    </div>
  )
}
