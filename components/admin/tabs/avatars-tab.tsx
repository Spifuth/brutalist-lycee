"use client"

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import { listAvatars, removeAvatar, type AdminAvatar } from "@/app/actions/admin"
import { AdminCard, Btn, Flash } from "@/components/admin/ui"

// The compensating control for having no upload approval queue: photos go
// live immediately, so removal here has to be fast. Newest first (the
// newest upload is the one most likely to need attention), image visible,
// one click removes it — deliberately no ConfirmBtn / "are you sure?" step.
export function AvatarsTab() {
  const [avatars, setAvatars] = useState<AdminAvatar[]>([])
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null)

  async function refresh() {
    setLoading(true)
    setAvatars(await listAvatars())
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function onRemove(a: AdminAvatar) {
    // Optimistic removal: the whole point of this tab is speed, so the row
    // disappears immediately rather than waiting on a round trip.
    setAvatars((prev) => prev.filter((x) => x.userId !== a.userId))
    try {
      await removeAvatar(a.userId)
      setFlash({ ok: true, msg: `Photo de ${a.pseudo} supprimée, retour à l'avatar DiceBear.` })
    } catch (e) {
      setFlash({ ok: false, msg: e instanceof Error ? e.message : "Erreur" })
      refresh()
    }
  }

  return (
    <AdminCard
      title="Photos de profil"
      action={
        <span className="font-mono text-[10px] uppercase tracking-widest text-background/60">
          {avatars.length} photo{avatars.length > 1 ? "s" : ""}
        </span>
      }
    >
      <p className="mb-4 border-l-4 border-l-accent border-2 border-foreground bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        {
          "// aucune file d'attente : une photo publiée est visible immédiatement. La suppression est le seul contrôle — un clic suffit, sans confirmation."
        }
      </p>

      {flash && <Flash msg={flash.msg} ok={flash.ok} />}

      {loading ? (
        <p className="font-mono text-sm text-muted-foreground">Chargement...</p>
      ) : avatars.length === 0 ? (
        <p className="py-6 text-center font-mono text-sm text-muted-foreground">Aucune photo publiée.</p>
      ) : (
        <ul className="divide-y-2 divide-border border-2 border-foreground">
          {avatars.map((a) => (
            <li key={a.userId} className="flex items-center gap-4 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/avatar/${a.userId}?v=${encodeURIComponent(a.uploadedAt)}`}
                alt={`Photo de ${a.pseudo}`}
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 border-2 border-foreground bg-muted object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-bold">{a.pseudo}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {new Date(a.uploadedAt).toLocaleString("fr-FR")}
                </p>
              </div>
              <Btn variant="danger" aria-label={`Supprimer la photo de ${a.pseudo}`} onClick={() => onRemove(a)}>
                <Trash2 size={14} />
              </Btn>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  )
}
