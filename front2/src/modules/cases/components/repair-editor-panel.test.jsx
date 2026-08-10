import { describe, expect, it, vi } from 'vitest';
import { invalidateCaseProjection } from './repair-editor-panel';

describe('invalidateCaseProjection', () => {
  it('invalidates workspace, detail, list, and panel queries after state-affecting mutations', async () => {
    const queryClient = { invalidateQueries: vi.fn().mockResolvedValue(undefined) };

    await invalidateCaseProjection(queryClient, 42);

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases', '42', 'workspace'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['panel'] });
  });
});
