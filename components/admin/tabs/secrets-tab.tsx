"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, KeyRound, Eye, EyeOff } from "lucide-react"
import { listSecrets, upsertSecret, deleteSecret, type SecretRow } from "@/app/actions/admin"
import { AdminCard, Field, TextInput, TextArea, Btn, ConfirmBtn, Flash } from "@/components/admin/ui"
import { cn } from "@/lib/utils"

const EMPTY: Omit<SecretRow, "id" | "redemptions"> & { id?: string } = {
  code: "",
  name: "",
  hint: "",
  location: "",
  points: 10,
  category: "AUTRE",
  difficulty: "medium",
  unlockAt: null,
  badgeSlug: "",
  active: true,
}

const DIFFICULTIES = [
  ["easy", "Facile"],
  ["medium", "Moyen"],
  ["hard", "Difficile"],
  ["insane", "Démentiel"],
] as const

export function SecretsTab() {
  const [rows, setRows] = useState<SecretRow[]>([])
  const [draft, setDraft] = useState<typeof EMPTY | null>(null)
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null)

  async function refresh() {
    setRows(await listSecrets())
  }
  useEffect(() => {
    refresh()
  }, [])

  async function save() {
    if (!draft) return
    try {
      await upsertSecret(draft)
      setFlash({ ok: true, msg: draft.id ? "Secret mis à jour." : "Secret créé." })
      setDraft(null)
      refresh()
    } catch (e) {
      setFlash({ ok: false, msg: e instanceof Error ? e.message : "Erreur" })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminCard
        title="Secrets à trouver"
        action={
          <Btn variant="accent" onClick={() => setDraft({ ...EMPTY })}>
            <Plus size={12} className="mr-1 inline" /> Nouveau
          </Btn>
        }
      >
        {flash && <Flash msg={flash.msg} ok={flash.ok} />}
        <ul className="divide-y-2 divide-border">
          {rows.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              {s.active ? (
                <Eye size={16} className="shrink-0 text-accent" />
              ) : (
                <EyeOff size={16} className="shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-bold">
                  {s.name} <span className="text-accent">· {s.code}</span>
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">{s.hint}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {s.category} · {s.difficulty}
                  {s.unlockAt !== null && (
                    <span className="text-accent"> · palier à {s.unlockAt}</span>
                  )}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.redemptions} trouvé{s.redemptions > 1 ? "s" : ""} · +{s.points}
              </span>
              <Btn variant="ghost" aria-label="Modifier" onClick={() => setDraft(s)}>
                <Pencil size={14} />
              </Btn>
              <ConfirmBtn
                label="Supprimer"
                onConfirm={async () => {
                  await deleteSecret(s.id)
                  refresh()
                }}
              >
                <Trash2 size={14} className="text-destructive" />
              </ConfirmBtn>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="py-6 text-center font-mono text-sm text-muted-foreground">Aucun secret.</li>
          )}
        </ul>
      </AdminCard>

      {draft && (
        <AdminCard title={draft.id ? "Modifier le secret" : "Nouveau secret"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Code à saisir" hint="mis en MAJUSCULES automatiquement">
              <TextInput
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                className="uppercase tracking-widest"
              />
            </Field>
            <Field label="Nom du secret">
              <TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label="Points">
              <TextInput
                type="number"
                value={draft.points}
                onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })}
              />
            </Field>
            <Field label="Badge lié (slug, optionnel)">
              <TextInput
                value={draft.badgeSlug ?? ""}
                onChange={(e) => setDraft({ ...draft, badgeSlug: e.target.value })}
              />
            </Field>
            <Field label="Catégorie" hint="regroupée en familles sur la page chasse">
              <TextInput
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value.toUpperCase() })}
                className="uppercase"
              />
            </Field>
            <Field label="Difficulté">
              <select
                value={draft.difficulty}
                onChange={(e) => setDraft({ ...draft, difficulty: e.target.value })}
                className="w-full border-2 border-foreground bg-background px-3 py-2 font-mono text-sm outline-none focus:bg-muted"
              >
                {DIFFICULTIES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field
                label="Palier automatique (optionnel)"
                hint="nombre de secrets ordinaires à trouver pour le débloquer. Vide ou 0 = secret normal, validé en tapant le code. Rempli = accordé tout seul, et le code est refusé à la saisie."
              >
                <TextInput
                  type="number"
                  value={draft.unlockAt ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, unlockAt: e.target.value === "" ? null : Number(e.target.value) })
                  }
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Indice (visible par tous)">
                <TextArea rows={2} value={draft.hint} onChange={(e) => setDraft({ ...draft, hint: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Emplacement (révélé après la trouvaille)">
                <TextInput value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
              </Field>
            </div>
            <label className="flex items-center gap-2 font-mono text-xs">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Actif (validable par les élèves)
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
