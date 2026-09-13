// The live quiz route: a heading, then <LiveQuiz>.
//
// The most counter-intuitive page in this folder. Everything visible moves in
// real time -- the question, the countdown, the other players -- and yet
// `pnpm build` prints /live with a circle: prerendered once at build time and
// served as a static file. There is no contradiction. The page itself reads
// nothing, so there is nothing for the server to do per request; the live part
// is <LiveQuiz>, a "use client" component that opens a stream from the browser
// once the HTML has landed.
//
// That split -- a static server shell plus one interactive island -- is the
// shape of most pages here (/vote, /profil, /terminal, /questions and
// /questions-live are all the same file twice over). Reach for it by default:
// it keeps the page out of the JavaScript bundle, and it keeps "what is on
// screen" separate from "what changes".

import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { LiveQuiz } from "@/components/quiz/live-quiz"

export const metadata: Metadata = {
  title: "Quiz en direct",
  description: "Un quiz synchronisé façon Kahoot, joué en temps réel avec le reste de la classe.",
}

export default function LivePage() {
  return (
    <PageShell>
      <PageHeader
        index="LIVE / 071"
        command="quiz --live --room classe"
        title="Quiz en direct"
        description="Réponds vite, marque des points, grimpe au classement. Les autres joueurs sont de vrais élèves connectés en même temps que toi."
      />
      <section className="w-full px-6 pb-8 lg:px-12">
        <LiveQuiz />
      </section>
    </PageShell>
  )
}
