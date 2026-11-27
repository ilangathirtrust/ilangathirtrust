import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const queryLang = request.nextUrl.searchParams.get('lang');
  const cookieLang = request.cookies.get('ilangathir_lang')?.value;
  const resolvedLang =
    queryLang === 'ta' || queryLang === 'en'
      ? queryLang
      : cookieLang === 'ta'
      ? 'ta'
      : 'en';

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-ilangathir-lang', resolvedLang);

  const response = NextResponse.next({
    request: { headers: requestHeaders }
  });

  if (queryLang === 'ta' || queryLang === 'en') {
    response.cookies.set('ilangathir_lang', queryLang, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax'
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|assets|favicon.ico|sitemap.xml|robots.txt).*)']
};
