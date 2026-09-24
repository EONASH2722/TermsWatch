import { describe, expect, it, vi } from 'vitest';
import { extractPdf } from './pdfService';
import { openPdf } from './runtime';

vi.mock('./runtime', () => ({ openPdf: vi.fn() }));

describe('PDF loading task cleanup', () => {
  const file = Object.assign(new Blob(['fixture']), { arrayBuffer: async () => new ArrayBuffer(0) });
  it('releases the loading task after extracting metadata', async () => {
    const destroy = vi.fn(async () => {});
    vi.mocked(openPdf).mockReturnValue({ promise: Promise.resolve({ numPages: 0, getMetadata: async () => ({ info: { Title: 'Fixture' } }) }), destroy } as unknown as ReturnType<typeof openPdf>);
    expect((await extractPdf(file)).title).toBe('Fixture');
    expect(destroy).toHaveBeenCalledOnce();
  });
  it('releases the loading task when a PDF is unreadable', async () => {
    const destroy = vi.fn(async () => {});
    vi.mocked(openPdf).mockReturnValue({ promise: Promise.reject(new Error('Invalid PDF')), destroy } as unknown as ReturnType<typeof openPdf>);
    await expect(extractPdf(file)).rejects.toThrow('Invalid PDF');
    expect(destroy).toHaveBeenCalledOnce();
  });
});
