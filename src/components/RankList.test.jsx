import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RankList } from './RankList.jsx';

/**
 * Skenario
 * - Leaderboard menampilkan nomor urut, nama, dan skor berformat Indonesia.
 * - Versi ringkas tetap menampilkan informasi peringkat yang sama.
 */

const entries = [
  { user: { id: 'maya', name: 'Maya Putri' }, score: 1450 },
  { user: { id: 'raka', name: 'Raka Akbar' }, score: 260 },
];

afterEach(cleanup);

describe('RankList', () => {
  it('menampilkan nomor urut, nama, dan skor sesuai urutan data', () => {
    render(<RankList entries={entries} />);

    const rows = screen.getAllByRole('listitem');
    const first = within(rows[0]);
    const second = within(rows[1]);

    expect(rows).toHaveLength(2);
    expect(first.getByText('1', { exact: true })).toBeVisible();
    expect(first.getByText('Maya Putri')).toBeVisible();
    expect(first.getByText('1.450')).toHaveTextContent('1.451 poin');
    expect(second.getByText('2', { exact: true })).toBeVisible();
    expect(second.getByText('Raka Akbar')).toBeVisible();
    expect(second.getByText('260')).toHaveTextContent('260 poin');
  });

  it('mempertahankan urutan, nama, dan skor pada versi ringkas', () => {
    const { rerender } = render(<RankList entries={entries} />);
    const fullRows = screen.getAllByRole('listitem').map((row) => row.textContent);

    rerender(<RankList entries={entries} compact />);

    const compactList = screen.getByRole('list');
    const compactRows = within(compactList).getAllByRole('listitem');

    expect(compactList).toHaveClass('rank-compact');
    expect(compactRows.map((row) => row.textContent)).toEqual(fullRows);
  });
});
