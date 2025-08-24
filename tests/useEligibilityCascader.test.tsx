import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { describe, it, expect, vi } from 'vitest';
import React, { ReactNode } from 'react';
import { useEligibilityCascader } from '@/features/decision-graph/hooks/useEligibilityCascader';

// Integration test to ensure no fetch is triggered without occupation parameters

describe('useEligibilityCascader', () => {
  it('does not fetch data when no occupation is provided', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
    );

    renderHook(
      () =>
        useEligibilityCascader(
          {},
          { selectedVisa: '190', selectedState: 'NSW' }
        ),
      { wrapper }
    );

    await waitFor(() => {
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    fetchSpy.mockRestore();
  });
});