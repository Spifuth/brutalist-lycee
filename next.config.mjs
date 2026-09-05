/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle so the Docker image can run without
  // node_modules. See Dockerfile.
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    // Traefik's chain-no-auth-plugin owns the edge security headers
    // (see middlewares-secure-headers.yml). Only headers Traefik does NOT
    // set belong here — duplicates are emitted twice on every response.
    //
    // As of this writing Traefik already sets all five headers this app
    // previously duplicated: X-Content-Type-Options, Referrer-Policy,
    // X-Frame-Options, Permissions-Policy, Strict-Transport-Security.
    // The array below is intentionally empty — this is a deliberate
    // decision, not an oversight. If a new header need arises that
    // Traefik does not cover, add it here.
    const securityHeaders = []
    // Next rejects a route rule whose `headers` array is empty, so don't
    // emit the rule at all while the list is empty — the array (and this
    // comment) are what records the decision, not the returned config.
    if (securityHeaders.length === 0) return []
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
