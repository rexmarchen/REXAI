// Variable resolution utilities for outreach email personalization

import type { OutreachContact, VariableKey } from '@/types/outreach'

/**
 * Map a contact to its variable values.
 */
function buildVariableMap(contact: OutreachContact): Record<VariableKey, string> {
  return {
    '{{firstName}}': contact.firstName,
    '{{lastName}}': contact.lastName ?? '',
    '{{jobTitle}}': contact.jobTitle,
    '{{companyName}}': contact.companyName,
    '{{industry}}': contact.industry ?? '',
    '{{location}}': contact.location,
  }
}

/**
 * Replace all known variables in a template string with contact data.
 */
export function resolveVariables(template: string, contact: OutreachContact): string {
  const map = buildVariableMap(contact)
  let result = template
  for (const [key, value] of Object.entries(map)) {
    result = result.replaceAll(key, value)
  }
  return result
}

/**
 * Return a list of variable keys that appear in the template but have no value
 * for the given contact.
 */
export function getMissingVariables(template: string, contact: OutreachContact): string[] {
  const map = buildVariableMap(contact)
  const missing: string[] = []
  for (const [key, value] of Object.entries(map)) {
    if (template.includes(key) && !value) {
      missing.push(key)
    }
  }
  return missing
}

/**
 * Get all variable keys that appear in a template string.
 */
export function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{[a-zA-Z]+\}\}/g) ?? []
  return [...new Set(matches)]
}

/**
 * Highlight variables in text for editor display.
 * Returns segments: { text, isVariable }[]
 */
export function segmentText(text: string): Array<{ text: string; isVariable: boolean }> {
  const parts = text.split(/(\{\{[a-zA-Z]+\}\})/g)
  return parts.map((part) => ({
    text: part,
    isVariable: /^\{\{[a-zA-Z]+\}\}$/.test(part),
  }))
}
