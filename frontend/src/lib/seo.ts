export interface PageSeoOptions {
  readonly title: string;
  readonly description: string;
  readonly canonicalPath?: string;
}

const BASE_URL = 'https://klipday.com';

/**
 * Updates document head SEO tags dynamically for single-page application navigation.
 * Updates the document title, meta description, Open Graph tags, and canonical link.
 *
 * @param options - Page SEO options including title, description, and optional canonical path.
 * @returns void
 */
export function UpdatePageSeo({ title, description, canonicalPath = '' }: PageSeoOptions): void {
  // Update document title
  document.title = title;

  // Helper to update or create a meta tag
  const SetMetaTag = (attributeName: 'name' | 'property', attributeValue: string, content: string) => {
    let element = document.querySelector<HTMLMetaElement>(`meta[${attributeName}="${attributeValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attributeName, attributeValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Standard Meta
  SetMetaTag('name', 'description', description);
  SetMetaTag('name', 'title', title);

  // Open Graph
  const canonicalUrl = `${BASE_URL}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`.replace(/\/$/, '') || BASE_URL;
  SetMetaTag('property', 'og:title', title);
  SetMetaTag('property', 'og:description', description);
  SetMetaTag('property', 'og:url', canonicalUrl);

  // Twitter
  SetMetaTag('name', 'twitter:title', title);
  SetMetaTag('name', 'twitter:description', description);

  // Canonical Link
  let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);
}
