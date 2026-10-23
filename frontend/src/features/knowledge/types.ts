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
