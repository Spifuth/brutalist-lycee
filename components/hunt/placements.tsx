"use client"

import { useEffect, useState } from "react"

/**
 * Les trois cachettes de /chasse qui ont besoin du navigateur.
 *
 * Les codes arrivent en props depuis le composant serveur : ils viennent de la
 * base et ne sont écrits nulle part dans le dépôt.
 */
export function HuntPlacements({ timing, storage }: { timing?: string; storage?: string }) {
  const [showTiming, setShowTiming] = useState(false)

  useEffect(() => {
    // SIN-NETWORK-SPY et SIN-HEADER-CUSTOM : une requête qui n'existe que pour
    // apparaître dans l'onglet Réseau. On ignore volontairement la réponse.
    fetch("/api/decoy").catch(() => {})
  }, [])

  useEffect(() => {
    // SIN-LOCALSTORAGE-HACK : le navigateur garde des données par site, et
    // personne ne pense à les regarder.
    if (!storage) return
    try {
      window.localStorage.setItem("lycee.debug", storage)
    } catch {
      // Navigation privée ou stockage refusé : la cachette saute, pas la page.
    }
  }, [storage])

  useEffect(() => {
    // SIN-TIMING-TRAP : visible uniquement entre minuit et minuit cinq. Vérifié
    // à l'affichage puis chaque minute, sinon un onglet resté ouvert raterait
    // le créneau.
    const check = () => {
      const now = new Date()
      setShowTiming(now.getHours() === 0 && now.getMinutes() < 5)
    }
    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [])

  if (!showTiming || !timing) return null

  return (
    <p className="mt-6 border-2 border-accent px-4 py-3 font-mono text-xs uppercase tracking-widest text-accent">
      il est minuit passé de peu — {timing}
    </p>
  )
}
