// In-browser simulated shell with an in-memory filesystem.
// SWAP POINT: this is the safe fallback used when TERMINAL_WS_URL (read at
// runtime via app/api/terminal/config/route.ts) is not set. The real
// terminal connects to a container gateway over WebSocket.

type FileNode = { type: "file"; content: string }
type DirNode = { type: "dir"; children: Record<string, Node> }
type Node = FileNode | DirNode

function dir(children: Record<string, Node> = {}): DirNode {
  return { type: "dir", children }
}
function file(content: string): FileNode {
  return { type: "file", content }
}

export class SimShell {
  private root: DirNode
  private cwd: string[] = ["home", "eleve"]

  constructor() {
    this.root = dir({
      home: dir({
        eleve: dir({
          "bienvenue.txt": file(
            "Bienvenue dans le terminal bac a sable !\nTape `help` pour voir les commandes disponibles.",
          ),
          "notes.md": file("# Mes notes\n- Ne jamais reutiliser un mot de passe\n- Verifier avant de cliquer"),
          projets: dir({
            "hello.js": file('console.log("Bonjour depuis le bac a sable")'),
          }),
        }),
      }),
      etc: dir({
        "motd.txt": file("Systeme pedagogique — usage encadre."),
      }),
    })
  }

  get prompt(): string {
    return `eleve@lycee:/${this.cwd.join("/")}$ `
  }

  private resolve(path: string): string[] | null {
    const parts = path.startsWith("/") ? path.split("/") : [...this.cwd, ...path.split("/")]
    const out: string[] = []
    for (const p of parts) {
      if (p === "" || p === ".") continue
      if (p === "..") {
        if (out.length > 0) out.pop()
      } else {
        out.push(p)
      }
    }
    return out
  }

  private nodeAt(parts: string[]): Node | null {
    let node: Node = this.root
    for (const p of parts) {
      if (node.type !== "dir" || !node.children[p]) return null
      node = node.children[p]
    }
    return node
  }

  /** Run one command line, returning output lines. */
  run(line: string): string[] {
    const trimmed = line.trim()
    if (!trimmed) return []
    const [cmd, ...args] = trimmed.split(/\s+/)

    switch (cmd) {
      case "help":
        return [
          "commandes : ls, cd, pwd, cat, echo, mkdir, node, clear, help",
          "  ls [chemin]         lister le contenu d'un dossier",
          "  cd <chemin>         changer de dossier",
          "  pwd                 afficher le dossier courant",
          "  cat <fichier>       afficher un fichier",
          "  echo <texte>        afficher du texte",
          "  mkdir <nom>         creer un dossier",
          "  node -e '<code>'    executer du JS simple (sandbox)",
          "  clear               nettoyer l'ecran",
        ]
      case "pwd":
        return [`/${this.cwd.join("/")}`]
      case "ls": {
        const target = args[0] ? this.resolve(args[0]) : this.cwd
        if (!target) return [`ls: chemin invalide`]
        const node = this.nodeAt(target)
        if (!node) return [`ls: ${args[0] ?? ""}: introuvable`]
        if (node.type === "file") return [args[0] ?? ""]
        const names = Object.keys(node.children)
        if (names.length === 0) return [""]
        return [
          names
            .map((n) => (node.children[n].type === "dir" ? `${n}/` : n))
            .join("   "),
        ]
      }
      case "cd": {
        if (!args[0]) {
          this.cwd = ["home", "eleve"]
          return []
        }
        const target = this.resolve(args[0])
        if (!target) return [`cd: chemin invalide`]
        const node = this.nodeAt(target)
        if (!node) return [`cd: ${args[0]}: introuvable`]
        if (node.type !== "dir") return [`cd: ${args[0]}: n'est pas un dossier`]
        this.cwd = target
        return []
      }
      case "cat": {
        if (!args[0]) return ["cat: precise un fichier"]
        const target = this.resolve(args[0])
        const node = target && this.nodeAt(target)
        if (!node) return [`cat: ${args[0]}: introuvable`]
        if (node.type !== "file") return [`cat: ${args[0]}: est un dossier`]
        return node.content.split("\n")
      }
      case "echo":
        return [args.join(" ").replace(/^["']|["']$/g, "")]
      case "mkdir": {
        if (!args[0]) return ["mkdir: precise un nom"]
        const parent = this.nodeAt(this.cwd)
        if (parent && parent.type === "dir") {
          if (parent.children[args[0]]) return [`mkdir: ${args[0]}: existe deja`]
          parent.children[args[0]] = dir()
          return []
        }
        return ["mkdir: erreur"]
      }
      case "node":
        return this.runNode(args)
      case "whoami":
        return ["eleve"]
      case "clear":
        return ["\u0000CLEAR"]
      default:
        return [`${cmd}: commande introuvable — tape \`help\``]
    }
  }

  private runNode(args: string[]): string[] {
    if (args[0] !== "-e") return ["node: utilise `node -e '<code>'` dans ce bac a sable"]
    const code = args.slice(1).join(" ").replace(/^["']|["']$/g, "")
    if (!code) return ["node: aucun code fourni"]
    const logs: string[] = []
    const fakeConsole = {
      log: (...a: unknown[]) => logs.push(a.map(String).join(" ")),
      error: (...a: unknown[]) => logs.push(a.map(String).join(" ")),
    }
    try {
      // Restricted sandbox: shadow dangerous globals, no network/DOM access.
      const fn = new Function(
        "console",
        "window",
        "document",
        "fetch",
        "globalThis",
        "self",
        `"use strict";\n${code}`,
      )
      const result = fn(fakeConsole, undefined, undefined, undefined, undefined, undefined)
      if (result !== undefined && logs.length === 0) logs.push(String(result))
      return logs.length ? logs : [""]
    } catch (err) {
      return [`node: ${(err as Error).message}`]
    }
  }
}
