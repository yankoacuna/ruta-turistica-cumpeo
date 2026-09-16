import { NextRequest, NextResponse } from 'next/server';

/**
 * Passenger no ve el protocolo original: siempre recibe la petición como
 * HTTP desde el proxy interno, que sí sabe si la conexión externa fue HTTPS
 * y lo deja en `x-forwarded-proto`. En local (`npm run dev`) esa cabecera
 * también sale en `http` al no haber proxy, así que esto solo corre en
 * producción para no redirigir en desarrollo.
 */
export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') === 'http') {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|manifest.json|sw.js).*)'],
};
