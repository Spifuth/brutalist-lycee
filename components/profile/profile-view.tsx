"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { LogOut, Award, Lock, ArrowRight, Search, Upload } from "lucide-react"
import { useProfile, SurveyLevel } from "@/lib/profile"
import { useAuth } from "@/components/auth/auth-provider"
import { avatarUrl } from "@/lib/badges"
import { uploadAvatar } from "@/app/actions/avatar"
import { getBadgeCollection, type BadgeView } from "@/app/actions/badges"
import { getMySecrets } from "@/app/actions/engage"
import { SurveyPicker } from "@/components/survey/survey-picker"
import { cn } from "@/lib/utils"

const LEVEL_LABELS: Record<SurveyLevel, string> = {
  court: "court",
  moyen: "moyen",
  complet: "complet",
}

export function ProfileView() {
  const { profile, ready, setProfile } = useProfile()
  const { user, logout, refresh } = useAuth()
  const [showSurvey, setShowSurvey] = useState(false)
  const [badges, setBadges] = useState<BadgeView[]>([])
  const [secrets, setSecrets] = useState({ found: 0, total: 0 })
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    getBadgeCollection().then(setBadges)
    getMySecrets().then((s) => setSecrets({ found: s.found, total: s.total }))
  }, [user, showSurvey])

  const earnedCount = useMemo(() => badges.filter((b) => b.earned).length, [badges])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow choosing the same file again afterwards
    if (!file) return
    setAvatarError(null)
    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append("avatar", file)
      const res = await uploadAvatar(formData)
      if (!res.ok) {
        setAvatarError(res.error || "Envoi refusé.")
      } else {
        await refresh()
      }
    } catch {
      setAvatarError("Erreur réseau pendant l'envoi.")
    } finally {
      setAvatarUploading(false)
    }
  }

  if (!ready) {
    return <div className="h-40 border-2 border-foreground animate-pulse bg-muted/40" />
  }

  if (!profile || !user) {
    return (
      <div className="border-2 border-foreground p-8 text-center max-w-md">
        <p className="text-[10px] font-mono uppercase tracking-widest text-accent mb-2">// aucune identité</p>
        <h2 className="font-mono text-lg font-bold mb-2">Pas encore de profil</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Crée ton identité sur la page d&apos;accueil pour accéder à ton profil, tes questionnaires et
          ta collection de badges.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2.5 text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Créer mon identité <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  const created = new Date(profile.createdAt).toLocaleString("fr-FR")

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-6 items-start">
      {/* Identity card */}
      <div className="border-2 border-foreground">
        <div className="border-b-2 border-foreground bg-foreground text-background px-4 py-2 flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest">whoami</span>
          <span className="ml-auto h-2 w-2 bg-accent animate-blink" />
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl(user) || "/placeholder.svg"}
              alt={`Avatar de ${user.pseudo}`}
              width={56}
              height={56}
              className="h-14 w-14 border-2 border-foreground bg-muted object-cover"
              crossOrigin="anonymous"
            />
            <div>
              <p className="font-mono text-lg font-bold">{user.pseudo}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-accent">
                {user.points} pts
              </p>
            </div>
          </div>

          <div className="mb-4">
            <input
              ref={avatarInputRef}
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              disabled={avatarUploading}
              className="hidden"
            />
            <label
              htmlFor="avatar-upload"
              className={cn(
                "flex w-full items-center justify-center gap-2 border-2 border-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors",
                avatarUploading ? "opacity-50" : "cursor-pointer hover:bg-muted",
              )}
            >
              <Upload size={12} /> {avatarUploading ? "Envoi..." : "Changer la photo"}
            </label>
            <p className="mt-1.5 text-[10px] font-mono text-muted-foreground">
              {"// JPEG, PNG ou WebP · 4 Mo maximum · recadrée en 512×512, sans les données EXIF"}
            </p>
            {avatarError && (
              <p className="mt-1.5 text-[10px] font-mono text-destructive">{avatarError}</p>
            )}
          </div>

          <dl className="font-mono text-xs">
            <Row label="pseudo" value={user.pseudo} />
            <Row label="passphrase" value={profile.passphrase || "masquée (notée à la création)"} />
            <Row label="niveau" value={user.level} />
            <Row label="points" value={String(user.points)} />
            <Row label="badges" value={`${earnedCount} / ${badges.length}`} />
            <Row label="secrets" value={`${secrets.found} / ${secrets.total}`} />
            <Row label="créé le" value={created} />
          </dl>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/chasse"
              className="flex w-full items-center justify-center gap-2 border-2 border-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Search size={12} /> Chasse aux secrets
            </Link>
            <button
              onClick={async () => {
                await logout()
                setProfile()
              }}
              className="flex w-full items-center justify-center gap-2 border-2 border-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:bg-muted transition-colors"
            >
              <LogOut size={12} /> Se déconnecter
            </button>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-6">
        {/* Surveys */}
        <div className="border-2 border-foreground p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-mono text-sm font-bold uppercase tracking-wide">Questionnaires</h2>
            <span className="text-[10px] font-mono text-muted-foreground">
              {profile.completedSurveys.length} / 3 complétés
            </span>
          </div>
          <div className="flex gap-2 mb-4">
            {(["court", "moyen", "complet"] as SurveyLevel[]).map((lvl) => {
              const done = profile.completedSurveys.includes(lvl)
              return (
                <span
                  key={lvl}
                  className={cn(
                    "flex-1 text-center border-2 border-foreground px-2 py-2 text-[10px] font-mono uppercase tracking-widest",
                    done ? "bg-accent text-accent-foreground border-accent" : "text-muted-foreground",
                  )}
                >
                  {LEVEL_LABELS[lvl]}
                  <br />
                  {done ? "✓ fait" : "à faire"}
                </span>
              )
            })}
          </div>
          {showSurvey ? (
            <SurveyPicker
              completed={profile.completedSurveys}
              title="Complète un questionnaire"
              onComplete={() => setShowSurvey(false)}
              onSkip={() => setShowSurvey(false)}
            />
          ) : (
            <button
              onClick={() => setShowSurvey(true)}
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Compléter un questionnaire <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* Badges */}
        <div className="border-2 border-foreground p-5">
          <div className="flex items-center gap-2 mb-1">
            <Award size={16} className="text-accent" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-wide">Collection de badges</h2>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground mb-4">
            {`// ${earnedCount} débloqué·s sur ${badges.length}`}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {badges.map((b) => (
              <div
                key={b.slug}
                title={b.description}
                className={cn(
                  "flex flex-col gap-1 border-2 p-3",
                  b.earned ? "border-foreground" : "border-border opacity-50",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-accent">
                    {b.points} pts
                  </span>
                  {b.earned ? <Award size={12} /> : <Lock size={12} className="text-muted-foreground" />}
                </div>
                <span className="font-mono text-[11px] font-bold leading-tight">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border py-1.5 last:border-b-0">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-right break-all">{value}</dd>
    </div>
  )
}
