import type { KnowledgeFooterLink } from '../types';

/**
 * Standard footer navigation links for the knowledge and legal compliance pages.
 */
export const KNOWLEDGE_FOOTER_LINKS: readonly KnowledgeFooterLink[] = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Aturan Main', href: '/peraturan' },
  { label: 'Syarat & Ketentuan', href: '/syarat-ketentuan' },
  { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
] as const;
