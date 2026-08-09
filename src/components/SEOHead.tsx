import React, { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Lab Output Generator — Fake Terminal Screenshots & PDF Mockups",
  description = "Free online tool to generate realistic Ubuntu and Linux terminal screenshots for lab reports. The best Lab Output Generator with PDF export, customizable themes, and fake terminal mockups.",
  keywords = "lab output generator, terminal screenshot generator, fake terminal screenshot, ubuntu terminal mockup, linux terminal output generator, command line screenshot, lab report terminal output, terminal to image, bash output mockup, linux command line tool, pdf lab report generator",
  canonicalUrl = "https://lab-output-generator.vercel.app/",
  ogImage = "https://lab-output-generator.vercel.app/og-image.png"
}) => {
  useEffect(() => {
    // 1. Title
    document.title = title;

    // Helper to set or create meta element
    const setMeta = (nameAttr: string, attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to set link canonical
    const setCanonical = (href: string) => {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // Update primary meta tags
    setMeta('name', 'title', title);
    setMeta('name', 'description', description);
    setMeta('name', 'keywords', keywords);

    // OpenGraph
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:image', ogImage);

    // Twitter
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);

    // Canonical
    setCanonical(canonicalUrl);
  }, [title, description, keywords, canonicalUrl, ogImage]);

  return null;
};
