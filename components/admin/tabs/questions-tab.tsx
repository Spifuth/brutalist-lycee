"use client"

import { useEffect, useState } from "react"
import { Check, X, Eye, Trash2 } from "lucide-react"
import {
  listAllQuestions,
  setQuestionStatus,
  deleteQuestion,
  type ModQuestion,
} from "@/app/actions/admin"
import { AdminCard, Btn, ConfirmBtn } from "@/components/admin/ui"
import { cn } from "@/lib/utils"

export function QuestionsModTab() {
  const [rows, setRows] = useState<ModQuestion[]>([])

  async function refresh() {
    setRows(await listAllQuestions())
  }
  useEffect(() => {
    refresh()
  }, [])

  const counts = {
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
  }

  return (
    <AdminCard title="Modération des questions">
      <div className="mb-4 flex gap-3">
        <Pill label="en attente" value={counts.pending} />
        <Pill label="validées" value={counts.approved} tone="accent" />
        <Pill label="rejetées" value={counts.rejected} tone="err" />
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((q) => (
          <li key={q.id} className="flex items-center gap-3 border-2 border-foreground p-3">
            <span
              className={cn(
                "shrink-0 border-2 px-2 py-1 font-mono text-[9px] uppercase tracking-widest",
                q.status === "pending" && "border-foreground",
                q.status === "approved" && "border-accent bg-accent text-accent-foreground",
                q.status === "rejected" && "border-destructive bg-destructive text-destructive-foreground",
              )}
            >
              {q.status === "pending" ? "attente" : q.status === "approved" ? "validée" : "rejetée"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm">{q.body}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {q.pseudo} · {q.upvotes} votes
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Btn variant="ghost" aria-label="Valider" onClick={() => setQuestionStatus(q.id, "approved").then(refresh)}>
                <Check size={14} />
              </Btn>
              <Btn variant="ghost" aria-label="En attente" onClick={() => setQuestionStatus(q.id, "pending").then(refresh)}>
                <Eye size={14} />
              </Btn>
              <Btn variant="ghost" aria-label="Rejeter" onClick={() => setQuestionStatus(q.id, "rejected").then(refresh)}>
                <X size={14} />
              </Btn>
              <ConfirmBtn label="Supprimer" onConfirm={() => deleteQuestion(q.id).then(refresh)}>
                <Trash2 size={14} className="text-destructive" />
              </ConfirmBtn>
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="py-6 text-center font-mono text-sm text-muted-foreground">Aucune question.</li>
        )}
      </ul>
    </AdminCard>
  )
}

function Pill({ label, value, tone }: { label: string; value: number; tone?: "accent" | "err" }) {
  return (
    <div
      className={cn(
        "flex min-w-[90px] flex-col items-center border-2 border-foreground px-3 py-2",
        tone === "accent" && "border-accent",
        tone === "err" && "border-destructive",
      )}
    >
      <span className="font-mono text-lg font-bold">{value}</span>
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  )
}
