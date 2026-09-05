"use client"

import { useEffect, useState } from "react"
import { KeyRound, Ban, ShieldCheck, RotateCcw, Trash2, Shield, Search, Copy, Check } from "lucide-react"
import {
  listUsers,
  resetUserPassphrase,
  setUserStatus,
  setUserAdmin,
  resetUserProgress,
  deleteUser,
  type AdminUser,
} from "@/app/actions/admin"
import { AdminCard, TextInput, Btn, ConfirmBtn, Flash } from "@/components/admin/ui"
import { cn } from "@/lib/utils"

export function UsersTab({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null)
  const [revealed, setRevealed] = useState<{ id: string; phrase: string } | null>(null)
  const [copied, setCopied] = useState(false)

  async function refresh(q = search) {
    setLoading(true)
    setUsers(await listUsers(q))
    setLoading(false)
  }

  useEffect(() => {
    refresh("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function run(fn: () => Promise<void>, msg: string) {
    try {
      await fn()
      setFlash({ ok: true, msg })
      refresh()
    } catch (e) {
      setFlash({ ok: false, msg: e instanceof Error ? e.message : "Erreur" })
    }
  }

  async function onReset(u: AdminUser) {
    try {
      const { passphrase } = await resetUserPassphrase(u.id)
      setRevealed({ id: u.id, phrase: passphrase })
      setCopied(false)
      setFlash({ ok: true, msg: `Nouvelle phrase de passe générée pour ${u.pseudo}.` })
      refresh()
    } catch (e) {
      setFlash({ ok: false, msg: e instanceof Error ? e.message : "Erreur" })
    }
  }

  return (
    <AdminCard
      title="Gestion des utilisateurs"
      action={
        <span className="font-mono text-[10px] uppercase tracking-widest text-background/60">{users.length} comptes</span>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          refresh()
        }}
        className="mb-4 flex items-center gap-2"
      >
        <div className="flex flex-1 items-center border-2 border-foreground">
          <Search size={14} className="ml-3 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un pseudo..."
            className="flex-1 bg-transparent px-3 py-2 font-mono text-sm outline-none"
          />
        </div>
        <Btn type="submit">Chercher</Btn>
      </form>

      {flash && <Flash msg={flash.msg} ok={flash.ok} />}
      {revealed && (
        <div className="mb-3 flex items-center justify-between gap-2 border-2 border-accent bg-accent/10 px-3 py-2">
          <span className="font-mono text-sm text-accent">{revealed.phrase}</span>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(revealed.phrase)
              setCopied(true)
            }}
            className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-accent"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "copié" : "copier"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="font-mono text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-foreground text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="py-2 pr-3">Pseudo</th>
                <th className="px-3">Niveau</th>
                <th className="px-3">Pts</th>
                <th className="px-3">Badges</th>
                <th className="px-3">Secrets</th>
                <th className="px-3">Statut</th>
                <th className="px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUserId
                return (
                  <tr key={u.id} className="border-b border-border align-middle">
                    <td className="py-2 pr-3 font-mono text-sm font-bold">
                      <span className="flex items-center gap-1.5">
                        {u.isAdmin && <Shield size={12} className="text-accent" />}
                        {u.pseudo}
                        {isSelf && <span className="text-[9px] uppercase tracking-widest text-accent">toi</span>}
                      </span>
                    </td>
                    <td className="px-3 font-mono text-xs text-muted-foreground">{u.level}</td>
                    <td className="px-3 font-mono text-xs">{u.points}</td>
                    <td className="px-3 font-mono text-xs">{u.badges}</td>
                    <td className="px-3 font-mono text-xs">{u.secrets}</td>
                    <td className="px-3">
                      <span
                        className={cn(
                          "border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest",
                          u.status === "active" ? "border-accent text-accent" : "border-destructive text-destructive",
                        )}
                      >
                        {u.status === "active" ? "actif" : "suspendu"}
                      </span>
                    </td>
                    <td className="px-3">
                      <div className="flex items-center justify-end gap-1">
                        <Btn variant="ghost" aria-label="Réinitialiser la phrase de passe" onClick={() => onReset(u)}>
                          <KeyRound size={14} />
                        </Btn>
                        <Btn
                          variant="ghost"
                          aria-label="Réinitialiser la progression"
                          onClick={() => run(() => resetUserProgress(u.id), `Progression de ${u.pseudo} réinitialisée.`)}
                        >
                          <RotateCcw size={14} />
                        </Btn>
                        <Btn
                          variant="ghost"
                          aria-label={u.isAdmin ? "Retirer admin" : "Promouvoir admin"}
                          onClick={() => run(() => setUserAdmin(u.id, !u.isAdmin), `${u.pseudo} mis à jour.`)}
                        >
                          <Shield size={14} className={u.isAdmin ? "text-accent" : ""} />
                        </Btn>
                        {u.status === "active" ? (
                          <Btn
                            variant="ghost"
                            aria-label="Suspendre"
                            disabled={isSelf}
                            onClick={() => run(() => setUserStatus(u.id, "suspended"), `${u.pseudo} suspendu.`)}
                          >
                            <Ban size={14} />
                          </Btn>
                        ) : (
                          <Btn
                            variant="ghost"
                            aria-label="Réactiver"
                            onClick={() => run(() => setUserStatus(u.id, "active"), `${u.pseudo} réactivé.`)}
                          >
                            <ShieldCheck size={14} className="text-accent" />
                          </Btn>
                        )}
                        {!isSelf && (
                          <ConfirmBtn label="Supprimer le compte" onConfirm={() => run(() => deleteUser(u.id), `${u.pseudo} supprimé.`)}>
                            <Trash2 size={14} className="text-destructive" />
                          </ConfirmBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {users.length === 0 && <p className="py-6 text-center font-mono text-sm text-muted-foreground">Aucun compte.</p>}
        </div>
      )}
    </AdminCard>
  )
}
