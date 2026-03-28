import { NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────────────────
//  Nexus Platform — Security Middleware
//
//  Runs on EVERY request before any page or
//  API handler. Handles:
//    1. Auth protection (redirect to /auth/login)
//    2. Rate limiting (in-memory, replace with
//       Redis/Upstash in production)
//    3. Security headers on all responses
//    4. Bot / abuse detection
// ─────────────────────────────────────────

// ── 1. Route definitions ─────────────────
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
]

const API_PUBLIC_ROUTES = [
  '/api/auth',
  '/api/webhooks',    // signed with WEBHOOK_SECRET separately
]

// ── 2. In-memory rate limiter ─────────────
// Production: replace with Upstash Redis
// npm install @upstash/ratelimit @upstash/redis
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/auth':     { max: 10,   windowMs: 60_000  },  // 10 auth attempts/min
  '/api/contacts': { max: 200,  windowMs: 60_000  },  // 200 req/min
  '/api/':         { max: 300,  windowMs: 60_000  },  // 300 general API req/min
  'default':       { max: 500,  windowMs: 60_000  },  // everything else
}

function getRateLimit(path: string) {
  for (const [prefix, limit] of Object.entries(RATE_LIMITS)) {
    if (path.startsWith(prefix)) return limit
  }
  return RATE_LIMITS.default
}

function checkRateLimit(ip: string, path: string): { allowed: boolean; remaining: number; resetAt: number } {
  const key   = `${ip}:${path.split('/').slice(0, 3).join('/')}`
  const limit = getRateLimit(path)
  const now   = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + limit.windowMs })
    return { allowed: true, remaining: limit.max - 1, resetAt: now + limit.windowMs }
  }

  entry.count++
  rateLimitMap.set(key, entry)

  return {
    allowed:   entry.count <= limit.max,
    remaining: Math.max(0, limit.max - entry.count),
    resetAt:   entry.resetAt,
  }
}

// Clean stale entries every 5 min to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }
}, 5 * 60_000)

// ── 3. Security headers ───────────────────
function addSecurityHeaders(response: NextResponse): NextResponse {
  const h = response.headers

  // Prevent clickjacking
  h.set('X-Frame-Options', 'DENY')

  // Prevent MIME sniffing
  h.set('X-Content-Type-Options', 'nosniff')

  // XSS filter (legacy browsers)
  h.set('X-XSS-Protection', '1; mode=block')

  // Referrer policy — don't leak full URL to third parties
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy — disable features we don't use
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')

  // HSTS — force HTTPS for 1 year (set only in production)
  if (process.env.NODE_ENV === 'production') {
    h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Content Security Policy
  // Tighten this further once you know all your external resources
  const isDev = process.env.NODE_ENV === 'development'
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${isDev ? "'unsafe-eval'" : ''} 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  h.set('Content-Security-Policy', csp)

  return response
}

// ── 4. Main middleware ────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Skip static assets ────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // ── Rate limiting ─────────────────────
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'

  if (pathname.startsWith('/api/')) {
    const rl = checkRateLimit(ip, pathname)

    if (!rl.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please slow down.', code: 'RATE_LIMITED' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After':  String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit':     '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset':     String(rl.resetAt),
          },
        }
      )
    }
  }

  // ── Auth protection ───────────────────
  const isPublicRoute    = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  const isPublicApiRoute = API_PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  if (!isPublicRoute && !isPublicApiRoute) {
    // Check Supabase session cookie
    const sessionCookie =
      request.cookies.get('sb-access-token')?.value ||
      request.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].replace('https://', '')}-auth-token`)?.value

    // In demo mode (no Supabase configured), allow through
    const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL

    if (hasSupabase && !sessionCookie && !pathname.startsWith('/api/')) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // API routes without auth → 401
    if (hasSupabase && !sessionCookie && pathname.startsWith('/api/') && !isPublicApiRoute) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required', code: 'UNAUTHENTICATED' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // ── Redirect logged-in users away from auth pages ──
  if (isPublicRoute && pathname.startsWith('/auth/')) {
    const sessionCookie = request.cookies.get('sb-access-token')?.value
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  const response = NextResponse.next()

  // ── Add security headers to all responses ──
  return addSecurityHeaders(response)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
