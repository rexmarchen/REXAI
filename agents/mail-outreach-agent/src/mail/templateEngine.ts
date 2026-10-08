/**
 * Template engine for outreach email personalization.
 * Supports merge-tags like {{first_name}}, {{last_name}}, {{full_name}},
 * {{company}}, {{current_title}}, with fallback support, unknown tag flagging,
 * and HTML escaping for lead-provided values.
 */

export const KNOWN_TAGS = [
  "first_name",
  "last_name",
  "full_name",
  "company",
  "current_title",
] as const;

export type KnownTag = typeof KNOWN_TAGS[number];

export interface LeadTemplateData {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  company?: string | null;
  current_title?: string | null;
  [key: string]: string | null | undefined;
}

export interface RenderTemplateOptions {
  escapeHtml?: boolean;
}

export interface RenderResult {
  rendered: string;
  warnings: {
    unknownTags: string[];
  };
}

export interface CampaignRenderResult {
  subject: string;
  bodyHtml: string;
  warnings: {
    unknownTags: string[];
  };
}

export interface ValidationResult {
  valid: boolean;
  unknownTags: string[];
}

/**
 * Escape HTML special characters in user/lead-provided values to prevent XSS.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Parse merge-tags in the template.
 * Matches: {{tag}} or {{tag | fallback}} or {{tag:fallback}}
 */
const TAG_REGEX = /\{\{\s*([a-zA-Z0-9_.-]+)(?:\s*[|:]\s*([^}]+?))?\s*\}\}/g;

/**
 * Validate template tags and check for any unrecognized tags.
 */
export function validateTemplateTags(template: string): ValidationResult {
  const unknownSet = new Set<string>();
  const matches = template.matchAll(TAG_REGEX);

  for (const match of matches) {
    const tagName = match[1];
    if (!KNOWN_TAGS.includes(tagName as KnownTag)) {
      unknownSet.add(tagName);
    }
  }

  const unknownTags = Array.from(unknownSet);
  return {
    valid: unknownTags.length === 0,
    unknownTags,
  };
}

/**
 * Render a single template string with lead data.
 * - Replaces known tags with corresponding values.
 * - Uses fallback if value is missing/null/undefined/empty string.
 * - Flags unknown tags in warnings without deleting them from the output.
 * - Optionally HTML-escapes inserted values (default: true).
 */
export function renderTemplate(
  template: string,
  data: LeadTemplateData,
  options: RenderTemplateOptions = { escapeHtml: true }
): RenderResult {
  const unknownSet = new Set<string>();

  const rendered = template.replace(TAG_REGEX, (match, rawTagName, rawFallback) => {
    const tagName = rawTagName.trim();
    const fallback = rawFallback !== undefined ? rawFallback.trim() : "";

    if (!KNOWN_TAGS.includes(tagName as KnownTag)) {
      unknownSet.add(tagName);
      // Flag unknown tags without deleting them
      return match;
    }

    const rawVal = data[tagName];
    const val = rawVal !== undefined && rawVal !== null && rawVal !== "" ? String(rawVal) : fallback;

    return options.escapeHtml ? escapeHtml(val) : val;
  });

  return {
    rendered,
    warnings: {
      unknownTags: Array.from(unknownSet),
    },
  };
}

/**
 * Render both subject and bodyHtml for a campaign using lead data.
 * Subject values are NOT HTML-escaped, but bodyHtml values ARE HTML-escaped.
 */
export function renderCampaignContent(
  subjectTemplate: string,
  bodyHtmlTemplate: string,
  data: LeadTemplateData
): CampaignRenderResult {
  const renderedSubject = renderTemplate(subjectTemplate, data, { escapeHtml: false });
  const renderedBody = renderTemplate(bodyHtmlTemplate, data, { escapeHtml: true });

  const allUnknownTags = Array.from(
    new Set([...renderedSubject.warnings.unknownTags, ...renderedBody.warnings.unknownTags])
  );

  return {
    subject: renderedSubject.rendered,
    bodyHtml: renderedBody.rendered,
    warnings: {
      unknownTags: allUnknownTags,
    },
  };
}
