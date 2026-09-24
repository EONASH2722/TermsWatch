import { afterEach, describe, expect, it, vi } from 'vitest';
import { isBrowserExtension, scanCurrentPage } from './extension';

afterEach(() => vi.unstubAllGlobals());
describe('browser extension detection', () => {
  it('treats regular websites including Chrome stubs as websites', async () => {
    vi.stubGlobal('chrome', undefined);
    expect(isBrowserExtension()).toBe(false);
    vi.stubGlobal('chrome', { runtime: {} });
    expect(isBrowserExtension()).toBe(false);
    await expect(scanCurrentPage()).rejects.toThrow('loaded as an extension');
  });
  it('only enables page scanning with extension runtime and tabs', () => {
    vi.stubGlobal('chrome', { runtime: { id: 'termswatch-test' }, tabs: {} });
    expect(isBrowserExtension()).toBe(true);
  });
});
