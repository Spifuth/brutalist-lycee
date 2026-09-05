"use client"

import Image from "next/image"
import { Trophy, Award, KeyRound } from "lucide-react"
import { dicebearUrl } from "@/lib/badges"
import { type LeaderRow } from "@/app/actions/engage"
import { useAuth } from "@/components/auth/auth-provider"
import { cn } from "@/lib/utils"

export function Leaderboard({ rows }: { rows: LeaderRow[] }) {
  const { user } = useAuth()

  if (rows.length === 0) {
    return (
      <p className="border-2 border-dashed border-muted-foreground/40 p-8 text-center font-mono text-sm text-muted-foreground">
        Personne n&apos;a encore marqué de points. Sois le premier !
      </p>
    )
  }

  return (
    <ol className="divide-y-2 divide-border border-2 border-foreground">
      {rows.map((r, i) => {
        const rank = i + 1
        const isMe = user?.pseudo === r.pseudo
        return (
          <li
            key={r.pseudo + i}
            className={cn(
              "flex items-center gap-4 bg-card p-4",
              isMe && "bg-accent/10",
              rank <= 3 && "bg-foreground text-background",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center border-2 font-pixel text-lg",
                rank <= 3 ? "border-background text-accent" : "border-foreground",
              )}
            >
              {rank}
            </span>
            <Image
              src={dicebearUrl(r.avatarSeed || r.pseudo) || "/placeholder.svg"}
              alt=""
              width={36}
              height={36}
              className={cn("h-9 w-9 shrink-0 border-2", rank <= 3 ? "border-background" : "border-foreground")}
              unoptimized
            />
            <div className="min-w-0 flex-1">
              <span className="block truncate font-mono text-sm font-bold">
                {r.pseudo}
                {isMe && <span className="ml-2 text-[10px] uppercase tracking-widest text-accent">toi</span>}
              </span>
              <span
                className={cn(
                  "flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest",
                  rank <= 3 ? "text-background/70" : "text-muted-foreground",
                )}
              >
                <span className="flex items-center gap-1">
                  <KeyRound size={10} /> {r.secrets}
                </span>
                <span className="flex items-center gap-1">
                  <Award size={10} /> {r.badges}
                </span>
              </span>
            </div>
            <span className="shrink-0 text-right">
              <span className="block font-pixel text-2xl text-accent">{r.points}</span>
              <span
                className={cn(
                  "font-mono text-[9px] uppercase tracking-widest",
                  rank <= 3 ? "text-background/70" : "text-muted-foreground",
                )}
              >
                points
              </span>
            </span>
            {rank === 1 && <Trophy size={18} className="shrink-0 text-accent" />}
          </li>
        )
      })}
    </ol>
  )
}
