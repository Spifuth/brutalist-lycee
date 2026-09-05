"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronUp, Send } from "lucide-react"
import { getQuestions, submitQuestion, upvoteQuestion, type QuestionRow } from "@/app/actions/engage"
import { useAuth } from "@/components/auth/auth-provider"
import { cn } from "@/lib/utils"

type SortMode = "top" | "recent"

export function QuestionsWall() {
  const { user } = useAuth()
  const [list, setList] = useState<QuestionRow[]>([])
  const [text, setText] = useState("")
  const [sort, setSort] = useState<SortMode>("top")
  const [notice, setNotice] = useState<string | null>(null)
  const [voted, setVoted] = useState<Set<string>>(new Set())

  const refresh = () => getQuestions(true).then(setList)
  useEffect(() => {
    refresh()
  }, [])

  const sorted = useMemo(() => {
    const copy = [...list]
    return sort === "top"
      ? copy.sort((a, b) => b.upvotes - a.upvotes || +new Date(b.created_at) - +new Date(a.created_at))
      : copy.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
  }, [list, sort])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    if (!user) {
      setNotice("Connecte-toi pour poser une question.")
      return
    }
    const res = await submitQuestion(text)
    if (res.ok) {
      setText("")
      setNotice("Envoyée ! Elle apparaîtra après validation par l'intervenant·e.")
      setTimeout(() => setNotice(null), 4000)
    } else {
      setNotice(res.error ?? "Erreur.")
    }
  }

  const handleUpvote = async (id: string) => {
    if (voted.has(id)) return
    setVoted((s) => new Set(s).add(id))
    setList((l) => l.map((q) => (q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q)))
    await upvoteQuestion(id)
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={submit} className="border-2 border-foreground mb-6">
        <div className="border-b-2 border-foreground bg-muted px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest">poser une question</span>
          <span className="text-[10px] font-mono text-muted-foreground">{text.length}/500</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="Écris ta question ici… elle est validée avant d'apparaître."
          className="w-full bg-transparent p-4 text-sm font-mono outline-none resize-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between border-t-2 border-foreground p-2">
          <span className="pl-2 text-[10px] font-mono text-muted-foreground">
            {user ? `en tant que ${user.pseudo}` : "non connecté"}
          </span>
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2 text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            Publier <Send size={13} />
          </button>
        </div>
      </form>

      {notice && (
        <p className="mb-4 border-2 border-foreground border-l-4 border-l-accent px-4 py-2 text-xs font-mono">
          {notice}
        </p>
      )}

      <div className="flex items-center gap-2 mb-4">
        {(["top", "recent"] as SortMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setSort(m)}
            className={cn(
              "text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 border-2 border-foreground transition-colors",
              sort === m ? "bg-foreground text-background" : "hover:bg-muted",
            )}
          >
            {m === "top" ? "Les plus votées" : "Les plus récentes"}
          </button>
        ))}
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">{list.length} questions</span>
      </div>

      <ul className="flex flex-col gap-2">
        {sorted.map((q) => (
          <li key={q.id} className="flex items-stretch gap-0 border-2 border-foreground">
            <button
              onClick={() => handleUpvote(q.id)}
              aria-pressed={voted.has(q.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 border-r-2 border-foreground transition-colors shrink-0",
                voted.has(q.id) ? "bg-accent text-accent-foreground" : "hover:bg-muted",
              )}
            >
              <ChevronUp size={16} />
              <span className="font-mono text-sm font-bold">{q.upvotes}</span>
            </button>
            <p className="flex-1 p-4 text-sm leading-relaxed">{q.body}</p>
          </li>
        ))}
        {sorted.length === 0 && (
          <li className="border-2 border-dashed border-foreground/40 p-6 text-center text-xs font-mono text-muted-foreground">
            Aucune question validée pour l'instant. Sois la première personne à en poser une !
          </li>
        )}
      </ul>
    </div>
  )
}
