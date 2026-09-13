// Five lines whose only job is to keep an old URL alive: /plus-loin is now
// /pour-aller-plus-loin.
//
// redirect() from next/navigation does not return -- it throws, and the
// framework turns that into an HTTP redirect before anything renders. Which is
// why nothing follows it and why TypeScript does not ask for a return value.
// Deleting a URL is a decision your readers cannot undo for you; an alias file
// costs five lines and keeps every bookmark and every link that already exists
// working.

import { redirect } from "next/navigation"

export default function PlusLoinAlias() {
  redirect("/pour-aller-plus-loin")
}
