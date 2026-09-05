"use client"

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
