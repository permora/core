import { CircularRoleInheritanceError } from '../errors/circular-role-inheritance-error';
import { UnknownRoleError } from '../errors/unknown-role-error';
import { resolveRole } from './role-resolver';
import type { AnyPermissionsDefinition, ResolvedRole } from './role.types';

/**
 * Walks the inheritance graph starting from the input roles and returns
 * every reachable role, deduplicated, in depth-first order.
 *
 * Each role (including parents referenced via `extends`) is resolved with
 * the session scope, so overrides and fallbacks apply at every step.
 * Only reachable roles are visited, keeping session compilation O(R + P).
 *
 * @throws UnknownRoleError when a role or parent cannot be resolved.
 * @throws CircularRoleInheritanceError when the graph contains a cycle.
 */
export function collectRoleGraph(
  permissions: AnyPermissionsDefinition,
  scope: string,
  roles: readonly string[],
): ResolvedRole[] {
  const visited = new Set<string>();
  const collected: ResolvedRole[] = [];
  const stack: string[] = [];

  function visit(role: string): void {
    const cycleStart = stack.indexOf(role);
    if (cycleStart !== -1) {
      throw new CircularRoleInheritanceError({
        scope,
        path: [...stack.slice(cycleStart), role],
      });
    }

    if (visited.has(role)) {
      return;
    }

    const resolved = resolveRole(permissions, scope, role);
    if (resolved === undefined) {
      throw new UnknownRoleError({ scope, role });
    }

    visited.add(role);
    collected.push(resolved);

    stack.push(role);
    for (const parent of resolved.definition.extends ?? []) {
      visit(parent);
    }
    stack.pop();
  }

  for (const role of roles) {
    visit(role);
  }

  return collected;
}
