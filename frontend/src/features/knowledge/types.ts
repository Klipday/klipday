/**
 * Represents the active tab selection on the knowledge and help page.
 */
export type HelpTabType = 'rules' | 'faq';

/**
 * An individual item within an accordion dropdown group.
 */
export interface AccordionItemData {
  /** Unique identifier for the item (e.g. 'rule-1-1'). */
  id: string;
  /** Title or question text of the item. */
  title: string;
  /** Detailed content, clause explanation, or answer. */
  content: string;
}

/**
 * A themed section grouping multiple accordion items.
 */
export interface AccordionGroupSection {
  /** Unique section key (e.g. 'sec-account'). */
  id: string;
  /** Numbered title of the section (e.g. '1. Kelayakan Akun & Data Pribadi'). */
  title: string;
  /** Short descriptive badge or item counter text (e.g. '4 Ketentuan'). */
  itemCountText: string;
  /** The collection of items belonging to this section. */
  items: readonly AccordionItemData[];
}

/**
 * Properties for the SectionAccordionGroup component.
 */
export interface SectionAccordionGroupProps {
  /** The section data containing the group title and accordion items. */
  section: AccordionGroupSection;
  /** Optional custom CSS classes. */
  className?: string;
}

/**
 * Properties for the HelpHeader component.
 */
export interface HelpHeaderProps {
  /** The currently active tab. */
  activeTab: HelpTabType;
  /** Callback fired when the user selects a tab. */
  onTabChange: (tab: HelpTabType) => void;
  /** Optional custom CSS classes. */
  className?: string;
}

/**
 * Properties for the HelpTopNav component.
 */
export interface HelpTopNavProps {
  /** Optional custom CSS classes. */
  className?: string;
}

/**
 * Properties for the HelpPage orchestrator.
 */
export interface HelpPageProps {
  /** Initial default tab if not overridden by search params. Defaults to 'faq'. */
  defaultTab?: HelpTabType;
}

/**
 * An individual clause or sub-point within a legal section.
 */
export interface LegalClauseItem {
  /** Unique anchor identifier for the clause (e.g. 'clause-1-1'). */
  id: string;
  /** Title or number of the clause (e.g. '1.1 Marketplace Video Clipping Dua Sisi'). */
  title: string;
  /** Primary legal text or paragraph explanation. */
  content: string;
  /** Optional bullet points or detailed breakdown items. */
  bulletPoints?: readonly string[];
}

/**
 * A structured article or section in a legal document (Terms or Privacy Policy).
 */
export interface LegalDocumentSection {
  /** Unique anchor slug for direct linking and table of contents (e.g. 'definisi-platform'). */
  id: string;
  /** Formatted title of the section (e.g. '1. Definisi & Ketentuan Umum'). */
  title: string;
  /** Short label for the table of contents navigation (e.g. '1. Definisi'). */
  shortTitle: string;
  /** Optional summary or intro text preceding clauses. */
  description?: string;
  /** The collection of legal clauses under this section. */
  clauses: readonly LegalClauseItem[];
  /** Optional regulatory notice or callout highlight. */
  callout?: {
    title: string;
    description: string;
  };
}

/**
 * An item representing an entry in the table of contents.
 */
export interface TableOfContentsItem {
  /** Section anchor identifier. */
  id: string;
  /** Formatted short title for the navigation item. */
  shortTitle: string;
}

/**
 * Properties for the LegalHeader component.
 */
export interface LegalHeaderProps {
  /** Title of the legal document. */
  title: string;
  /** Subtitle or introductory scope description. */
  description: string;
  /** Last updated date text (e.g. '7 November 2026'). */
  lastUpdated: string;
  /** Optional category or regulatory badge label (e.g. 'Kepatuhan Regulasi RI'). */
  badgeLabel?: string;
  /** Optional custom CSS classes. */
  className?: string;
}

/**
 * Properties for the LegalTableOfContents component.
 */
export interface LegalTableOfContentsProps {
  /** The sections available for navigation. */
  sections: readonly TableOfContentsItem[];
  /** ID of the currently active/in-view section. */
  activeSectionId?: string;
  /** Callback fired when an item is selected. */
  onSelectSection: (id: string) => void;
  /** Optional custom CSS classes. */
  className?: string;
}

/**
 * Properties for the LegalSectionCard component.
 */
export interface LegalSectionCardProps {
  /** The section data to render. */
  section: LegalDocumentSection;
  /** Optional custom CSS classes. */
  className?: string;
}

/**
 * A single link item for the knowledge footer navigation.
 */
export interface KnowledgeFooterLink {
  /** Display label for the link. */
  label: string;
  /** Destination route or external URL. */
  href: string;
}

/**
 * Properties for the KnowledgeFooter component.
 */
export interface KnowledgeFooterProps {
  /** Optional custom CSS classes. */
  className?: string;
}

/**
 * Properties for the TermsPage orchestrator.
 */
export interface TermsPageProps {
  /** Optional custom CSS classes. */
  className?: string;
}

/**
 * Properties for the PrivacyPage orchestrator.
 */
export interface PrivacyPageProps {
  /** Optional custom CSS classes. */
  className?: string;
}

