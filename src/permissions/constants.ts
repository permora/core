/**
 * Default scope used when a session is created without an explicit scope
 * and as the fallback scope during role resolution.
 */
export const DEFAULT_SCOPE = '*' as const;

export type DefaultScope = typeof DEFAULT_SCOPE;
