import {
  DEFAULT_SCOPE_RESOLUTION,
  type ScopeResolutionOptions,
} from './role.types';

/**
 * Fills omitted `scopeResolution` fields with {@link DEFAULT_SCOPE_RESOLUTION}.
 */
export function normalizeScopeResolution(
  options?: ScopeResolutionOptions,
): Required<ScopeResolutionOptions> {
  return {
    fallback: options?.fallback ?? DEFAULT_SCOPE_RESOLUTION.fallback,
    merge: options?.merge ?? DEFAULT_SCOPE_RESOLUTION.merge,
  };
}
