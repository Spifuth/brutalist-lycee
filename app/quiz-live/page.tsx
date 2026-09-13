// The same alias trick as app/plus-loin/page.tsx, which explains it:
// /quiz-live now lives at /live.

import { redirect } from "next/navigation"

export default function QuizLiveAlias() {
  redirect("/live")
}
