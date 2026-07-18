import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SyncStatusBadge } from '../../src/components/SyncStatusBadge';

afterEach(() => {
  delete (window as unknown as { pee?: unknown }).pee;
});

describe('SyncStatusBadge', () => {
  it('renders the latest status pushed by onStatus', () => {
    let emit: (status: unknown) => void = () => undefined;
    (window as unknown as { pee: unknown }).pee = {
      sync: {
        onStatus: (callback: (status: unknown) => void) => {
          emit = callback;
          return () => undefined;
        },
        now: vi.fn(),
      },
    };

    render(<SyncStatusBadge />);
    act(() => emit({ phase: 'synced', pulled: 2, pushed: 1 }));

    expect(screen.getByText(/Synced \(pulled 2, pushed 1\)/)).toBeInTheDocument();
  });

  it('calls sync.now when the button is clicked', () => {
    const now = vi.fn();
    (window as unknown as { pee: unknown }).pee = { sync: { onStatus: () => () => undefined, now } };

    render(<SyncStatusBadge />);
    fireEvent.click(screen.getByRole('button', { name: /sync now/i }));

    expect(now).toHaveBeenCalled();
  });
});
