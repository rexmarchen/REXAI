import type { OutreachContactShape } from '@/types'

export function substituteEmailVariables(
  template: string,
  companyName: string,
  contact: OutreachContactShape
) {
  return template
    .replaceAll('{Name}', contact.name)
    .replaceAll('{Company}', companyName)
    .replaceAll('{Role}', contact.role)
    .replaceAll('{Position}', contact.role)
    .replaceAll('{Date}', new Date().toLocaleDateString('en-IN'))
}

export function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export function buildSuggestedSubject(companyName: string, role = 'hiring') {
  return `Quick question about ${role.toLowerCase()} at ${companyName}`
}
