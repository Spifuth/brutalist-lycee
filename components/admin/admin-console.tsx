"use client"

import { useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Award,
  KeyRound,
  ListChecks,
  BookText,
  MessageSquare,
  Radio,
  Lock,
  ArrowLeft,
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { OverviewTab } from "@/components/admin/tabs/overview-tab"
import { UsersTab } from "@/components/admin/tabs/users-tab"
import { BadgesTab } from "@/components/admin/tabs/badges-tab"
import { SecretsTab } from "@/components/admin/tabs/secrets-tab"
import { QuizzesTab } from "@/components/admin/tabs/quizzes-tab"
import { DocsTab } from "@/components/admin/tabs/docs-tab"
import { QuestionsModTab } from "@/components/admin/tabs/questions-tab"
import { LiveTab } from "@/components/admin/tabs/live-tab"
import { cn } from "@/lib/utils"

type Tab = "overview" | "users" | "badges" | "secrets" | "quizzes" | "live" | "docs" | "questions"

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "badges", label: "Badges", icon: Award },
  { id: "secrets", label: "Secrets", icon: KeyRound },
  { id: "quizzes", label: "Quiz", icon: ListChecks },
  { id: "live", label: "Direct", icon: Radio },
  { id: "docs", label: "Docs", icon: BookText },
  { id: "questions", label: "Questions", icon: MessageSquare },
]

export function AdminConsole() {
  const { user, ready } = useAuth()
  const [tab, setTab] = useState<Tab>("overview")

  if (!ready) {
    return <div className="p-8 text-center font-mono text-sm text-muted-foreground">Chargement...</div>
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="mx-auto max-w-md border-2 border-foreground bg-card p-8 text-center">
        <Lock className="mx-auto mb-4 text-accent" size={32} />
        <h1 className="font-mono text-lg font-bold uppercase tracking-widest">Accès restreint</h1>
        <p className="mt-3 font-mono text-sm leading-relaxed text-muted-foreground">
          {user
            ? "Ton compte n'a pas les droits administrateur. Demande à un·e enseignant·e de te promouvoir."
            : "Cette console est réservée aux enseignant·es. Connecte-toi avec un compte administrateur."}
        </p>
        <Link
          href={user ? "/accueil" : "/"}
          className="mt-6 inline-flex items-center gap-2 border-2 border-foreground bg-accent px-5 py-2 font-mono text-xs font-bold uppercase tracking-widest text-accent-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          <ArrowLeft size={12} /> Retour
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-widest text-accent">
          admin@lycee-sin · {user.pseudo}
        </span>
        <h1 className="font-pixel text-3xl uppercase tracking-tight">Console d&apos;administration</h1>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex flex-wrap border-2 border-foreground">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors",
              i > 0 && "border-l-2 border-foreground",
              tab === t.id ? "bg-accent text-accent-foreground" : "bg-card hover:bg-muted",
            )}
          >
            <t.icon size={14} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab currentUserId={user.id} />}
      {tab === "badges" && <BadgesTab />}
      {tab === "secrets" && <SecretsTab />}
      {tab === "quizzes" && <QuizzesTab />}
      {tab === "live" && <LiveTab />}
      {tab === "docs" && <DocsTab />}
      {tab === "questions" && <QuestionsModTab />}
    </div>
  )
}
