"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, BookText, ChevronLeft } from "lucide-react"
import {
  listDocSubjects,
  upsertDocSubject,
  deleteDocSubject,
  listDocArticles,
  upsertDocArticle,
  deleteDocArticle,
  type AdminDocSubject,
  type AdminDocArticle,
} from "@/app/actions/admin"
import { AdminCard, Field, TextInput, TextArea, Btn, ConfirmBtn, Flash } from "@/components/admin/ui"

const EMPTY_SUBJECT: Omit<AdminDocSubject, "id" | "articles"> & { id?: string } = {
  slug: "",
  title: "",
  description: "",
  icon: "book",
  position: 0,
}

export function DocsTab() {
  const [rows, setRows] = useState<AdminDocSubject[]>([])
  const [draft, setDraft] = useState<typeof EMPTY_SUBJECT | null>(null)
  const [editing, setEditing] = useState<AdminDocSubject | null>(null)
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null)

  async function refresh() {
    setRows(await listDocSubjects())
  }
  useEffect(() => {
    refresh()
  }, [])

  async function save() {
    if (!draft) return
    try {
      await upsertDocSubject(draft)
      setFlash({ ok: true, msg: draft.id ? "Sujet mis à jour." : "Sujet créé." })
      setDraft(null)
      refresh()
    } catch (e) {
      setFlash({ ok: false, msg: e instanceof Error ? e.message : "Erreur" })
    }
  }

  if (editing) {
    return <ArticlesEditor subject={editing} onBack={() => { setEditing(null); refresh() }} />
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminCard
        title="Documentation — sujets"
        action={
          <Btn variant="accent" onClick={() => setDraft({ ...EMPTY_SUBJECT, position: rows.length })}>
            <Plus size={12} className="mr-1 inline" /> Nouveau sujet
          </Btn>
        }
      >
        {flash && <Flash msg={flash.msg} ok={flash.ok} />}
        <ul className="divide-y-2 divide-border">
          {rows.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <BookText size={16} className="shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-bold">
                  {s.title} <span className="text-muted-foreground">· {s.slug}</span>
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">{s.description}</p>
              </div>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.articles} articles
              </span>
              <Btn variant="ghost" onClick={() => setEditing(s)}>
                Articles
              </Btn>
              <Btn variant="ghost" aria-label="Modifier" onClick={() => setDraft(s)}>
                <Pencil size={14} />
              </Btn>
              <ConfirmBtn
                label="Supprimer"
                onConfirm={async () => {
                  await deleteDocSubject(s.id)
                  refresh()
                }}
              >
                <Trash2 size={14} className="text-destructive" />
              </ConfirmBtn>
            </li>
          ))}
          {rows.length === 0 && <li className="py-6 text-center font-mono text-sm text-muted-foreground">Aucun sujet.</li>}
        </ul>
      </AdminCard>

      {draft && (
        <AdminCard title={draft.id ? "Modifier le sujet" : "Nouveau sujet"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Titre">
              <TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="Slug">
              <TextInput value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
            </Field>
            <Field label="Icône (nom lucide)">
              <TextInput value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} />
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

function ArticlesEditor({ subject, onBack }: { subject: AdminDocSubject; onBack: () => void }) {
  const emptyArticle = {
    subjectId: subject.id,
    slug: "",
    title: "",
    summary: "",
    blocksText: '[\n  { "type": "paragraph", "text": "Ton contenu ici." }\n]',
    position: 0,
    published: true,
  }
  const [rows, setRows] = useState<AdminDocArticle[]>([])
  const [draft, setDraft] = useState<(typeof emptyArticle & { id?: string }) | null>(null)
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null)

  async function refresh() {
    setRows(await listDocArticles(subject.id))
  }
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save() {
    if (!draft) return
    try {
      await upsertDocArticle(draft)
      setFlash({ ok: true, msg: "Article enregistré." })
      setDraft(null)
      refresh()
    } catch (e) {
      setFlash({ ok: false, msg: e instanceof Error ? e.message : "Erreur" })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminCard
        title={`Articles — ${subject.title}`}
        action={
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={onBack}>
              <ChevronLeft size={12} className="mr-1 inline" /> Retour
            </Btn>
            <Btn variant="accent" onClick={() => setDraft({ ...emptyArticle, position: rows.length })}>
              <Plus size={12} className="mr-1 inline" /> Article
            </Btn>
          </div>
        }
      >
        {flash && <Flash msg={flash.msg} ok={flash.ok} />}
        <ul className="divide-y-2 divide-border">
          {rows.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-bold">
                  {a.title} {!a.published && <span className="text-muted-foreground">(brouillon)</span>}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">{a.summary}</p>
              </div>
              <Btn variant="ghost" aria-label="Modifier" onClick={() => setDraft(a)}>
                <Pencil size={14} />
              </Btn>
              <ConfirmBtn label="Supprimer" onConfirm={() => deleteDocArticle(a.id).then(refresh)}>
                <Trash2 size={14} className="text-destructive" />
              </ConfirmBtn>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="py-6 text-center font-mono text-sm text-muted-foreground">Aucun article.</li>
          )}
        </ul>
      </AdminCard>

      {draft && (
        <AdminCard title={draft.id ? "Modifier l'article" : "Nouvel article"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Titre">
              <TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="Slug">
              <TextInput value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Résumé">
                <TextInput value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Contenu (blocs JSON)"
                hint='tableau de blocs : { "type": "section" | "paragraph" | "code" | "list" | "callout", ... }'
              >
                <TextArea
                  rows={12}
                  value={draft.blocksText}
                  onChange={(e) => setDraft({ ...draft, blocksText: e.target.value })}
                  className="text-xs"
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
        </AdminCard>
      )}
    </div>
  )
}
