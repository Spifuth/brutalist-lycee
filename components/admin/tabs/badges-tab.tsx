"use client"

// CRUD for the badge catalogue. It is the plainest of the four form tabs in
// this folder, so the idiom all four share is written down here rather than
// repeated in secrets-tab, quizzes-tab and docs-tab.
//
// One piece of state, `draft`, is both the form's contents and its
// visibility: null means no form on screen. "Nouveau" spreads the EMPTY
// template into it, "Modifier" spreads the row -- so a single form serves
// create and edit -- and every keystroke replaces the object
// (`setDraft({ ...draft, name: e.target.value })`) instead of mutating it,
// which is what lets React see the change at all. Whether a save inserts or
// updates then comes down to one question, "does the draft carry an id?",
// and that is exactly why the server action is named *upsert* rather than
// split in two. Three states (list, draft, flash) and two functions (refresh,
// save): that is a whole CRUD screen, and the other tabs only add a state
// when they add a second screen.
//
// `slug` is a foreign key the database does not enforce. quizzes.badge_slug
// and secrets.badge_slug (db/schema.sql) are plain TEXT columns, filled by
// hand in another tab, with no REFERENCES to break when this one changes.
// Renaming a slug here raises nothing anywhere -- it quietly leaves those
// rows pointing at a badge that no longer exists. lib/awards.ts is where that
// gets caught: awardBadge() logs loudly and awards nothing when a slug does
// not resolve, because three secrets really did point at a badge slug that
// was never created (`git log 5833dcf`). A soft reference needs a loud
// failure, or it fails as silence.
//
// `icon` is collected and stored, but nothing draws it today: badges reach a
// student through app/actions/badges.ts, and the badge cards in
// components/profile/profile-view.tsx draw a fixed Award/Lock pair instead.
// A form field is a promise -- check who reads it before you add one.

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Award } from "lucide-react"
import { listBadges, upsertBadge, deleteBadge, type BadgeRow } from "@/app/actions/admin"
import { AdminCard, Field, TextInput, TextArea, Btn, ConfirmBtn, Flash } from "@/components/admin/ui"

const EMPTY: Omit<BadgeRow, "id"> & { id?: string } = {
  slug: "",
  name: "",
  description: "",
  icon: "award",
  points: 0,
  kind: "manual",
  position: 0,
}

export function BadgesTab() {
  const [rows, setRows] = useState<BadgeRow[]>([])
  const [draft, setDraft] = useState<typeof EMPTY | null>(null)
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null)

  async function refresh() {
    setRows(await listBadges())
  }
  useEffect(() => {
    refresh()
  }, [])

  async function save() {
    if (!draft) return
    try {
      await upsertBadge(draft)
      setFlash({ ok: true, msg: draft.id ? "Badge mis à jour." : "Badge créé." })
      setDraft(null)
      refresh()
    } catch (e) {
      setFlash({ ok: false, msg: e instanceof Error ? e.message : "Erreur" })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminCard
        title="Badges"
        action={
          <Btn variant="accent" onClick={() => setDraft({ ...EMPTY, position: rows.length })}>
            <Plus size={12} className="mr-1 inline" /> Nouveau
          </Btn>
        }
      >
        {flash && <Flash msg={flash.msg} ok={flash.ok} />}
        <ul className="divide-y-2 divide-border">
          {rows.map((b) => (
            <li key={b.id} className="flex items-center gap-3 py-3">
              <Award size={16} className="shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-bold">
                  {b.name} <span className="text-muted-foreground">· {b.slug}</span>
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">{b.description}</p>
              </div>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {b.kind} · +{b.points}
              </span>
              <Btn variant="ghost" aria-label="Modifier" onClick={() => setDraft(b)}>
                <Pencil size={14} />
              </Btn>
              <ConfirmBtn
                label="Supprimer"
                onConfirm={async () => {
                  await deleteBadge(b.id)
                  refresh()
                }}
              >
                <Trash2 size={14} className="text-destructive" />
              </ConfirmBtn>
            </li>
          ))}
          {rows.length === 0 && <li className="py-6 text-center font-mono text-sm text-muted-foreground">Aucun badge.</li>}
        </ul>
      </AdminCard>

      {draft && (
        <AdminCard title={draft.id ? "Modifier le badge" : "Nouveau badge"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom">
              <TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label="Slug (identifiant)">
              <TextInput value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
            </Field>
            <Field label="Icône (nom lucide)" hint="ex: award, shield, key-round, trophy">
              <TextInput value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} />
            </Field>
            <Field label="Points">
              <TextInput
                type="number"
                value={draft.points}
                onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })}
              />
            </Field>
            <Field label="Type" hint="manual, quiz, secret, survey...">
              <TextInput value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })} />
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
