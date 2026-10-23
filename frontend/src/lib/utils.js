/**
 * Utility helper for conditionally combining class names
 */
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}

export default cn
