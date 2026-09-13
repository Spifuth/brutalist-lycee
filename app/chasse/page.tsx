// The hunt board: enter a code, score points. Also the page that physically
// holds three of the hiding places.
//
// The contract between a page and the hunt runs through a *placement name*,
// never through a code: this file asks for "hidden-css", "timing" and
// "local-storage", and lib/secret-placements.ts answers from the database.
// That indirection is what lets the repository stay public.
// tests/secret-placements.test.ts fails if a placement a page asks for is
// filled by zero secrets or by two -- which would show a student an empty spot
// or two answers where one was promised.

import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { HuntBoard } from "@/components/hunt/hunt-board"
import { HuntPlacements } from "@/components/hunt/placements"
import { getPlacedCodes } from "@/lib/secret-placements"

export const metadata: Metadata = {
  title: "Chasse aux secrets",
  description: "Trouve les codes cachés sur le site, valide-les et grimpe au classement.",
}

// Three hiding places live on this page (text masked in CSS, a localStorage
// key, a just-after-midnight window) and a fourth leads from here to
// /api/decoy. The codes are read from the database: this repository is
// public, and writing them here would amount to publishing the answers next
// to the riddles.
export const dynamic = "force-dynamic"

export default async function ChassePage() {
  const codes = await getPlacedCodes(["hidden-css", "timing", "local-storage"])

  return (
    <PageShell>
      <PageHeader
        index="./chasse"
        command="sudo find / -name secret"
        title="Chasse aux secrets"
        description="Des codes sont dissimulés partout sur le site. Trouve-les, valide-les ici et gagne des points."
      />
      <div className="px-6 pb-16 lg:px-12">
        {/* SIN-CSS-DISPLAY-NONE: off the screen, not off the page. A Ctrl+A
            or a glance at the page source brings it back. aria-hidden so a
            screen reader does not read out an absurd run of letters. */}
        {codes["hidden-css"] && (
          <span aria-hidden="true" className="absolute left-[-9999px] select-text font-mono">
            {codes["hidden-css"]}
          </span>
        )}
        <HuntBoard />
        <HuntPlacements timing={codes.timing} storage={codes["local-storage"]} />
      </div>
    </PageShell>
  )
}
