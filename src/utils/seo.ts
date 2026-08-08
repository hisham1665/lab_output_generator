export interface SEOMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

export function updateSEOMetadata(metadata: SEOMetadata) {
  const defaultTitle = 'Lab Output Generator — Fake Terminal Screenshots & Mockups';
  const defaultDesc = 'Free online tool to generate realistic Ubuntu and Linux terminal screenshots for lab reports. The best Lab Output Generator with PDF export, customizable themes, and fake terminal mockups.';
  const defaultCanonical = 'https://lab-output-generator.vercel.app/';
  const defaultOgImage = 'https://lab-output-generator.vercel.app/og-image.png';

  const title = metadata.title || defaultTitle;
  const description = metadata.description || defaultDesc;
  const canonicalUrl = metadata.canonicalUrl || defaultCanonical;
  const ogImage = metadata.ogImage || defaultOgImage;

  // Title
  document.title = title;

  // Primary Meta Tags
  setMetaTag('name', 'title', title);
  setMetaTag('name', 'description', description);
  if (metadata.keywords) {
    setMetaTag('name', 'keywords', metadata.keywords);
  }

  // Open Graph
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:image', ogImage);

  // Twitter
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', ogImage);

  // Canonical Link
  let canonicalElem = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalElem) {
    canonicalElem = document.createElement('link');
    canonicalElem.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalElem);
  }
  canonicalElem.setAttribute('href', canonicalUrl);
}

function setMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}
