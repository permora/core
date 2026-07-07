import { describe, expect, it } from 'vitest';
import { definePlugin } from '../../src/plugins';

describe('definePlugin', () => {
  it('returns the plugin object unchanged', () => {
    const plugin = definePlugin({
      name: 'audit',
      onDenied() {},
    });

    expect(plugin.name).toBe('audit');
    expect(plugin.onDenied).toBeTypeOf('function');
  });
});
