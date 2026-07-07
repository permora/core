import { AuthorizationError } from './authorization-error';

/**
 * Thrown when the role inheritance graph contains a cycle,
 * e.g. `admin → manager → editor → admin`.
 */
export class CircularRoleInheritanceError extends AuthorizationError {
  readonly code = 'AUTHZ_CIRCULAR_ROLE_INHERITANCE';

  readonly scope: string;
  readonly path: readonly string[];

  constructor(input: { scope: string; path: readonly string[] }) {
    super(
      `Circular role inheritance detected in scope "${input.scope}": ${input.path.join(' → ')}`,
    );
    this.scope = input.scope;
    this.path = input.path;
  }
}
