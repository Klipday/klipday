import { HomeFooter } from '@/features/home/components/HomeFooter';
import type { KnowledgeFooterProps } from '../types';

/**
 * Unified footer wrapper for the knowledge hub and legal pages (`FAQ`, `Peraturan Platform`,
 * `Syarat & Ketentuan`, and `Kebijakan Privasi`), delegating directly to the landing page footer.
 *
 * @param props - Custom styling classes.
 * @returns The rendered shared landing page footer component.
 */
export function KnowledgeFooter({ className = '' }: KnowledgeFooterProps) {
  const spacingClass = className ? `mt-16 ${className}` : 'mt-16';
  return <HomeFooter className={spacingClass} />;
}
