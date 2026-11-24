import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { FeedPage } from './FeedPage.jsx';
import { loadFeed, searchChanged } from '../state/forum.js';
import { createAppStore } from '../state/store.js';

/**
 * Skenario
 * - Menampilkan metadata diskusi saat daftar berhasil dimuat.
 * - Memilih kategori menyaring diskusi yang tampak.
 * - Pencarian judul mencocokkan teks tanpa membedakan kapitalisasi.
 * - Pencarian tanpa hasil dapat direset oleh pengguna.
 * - Status loading terlihat saat feed sedang dimuat.
 */

const owner = { id: 'user-author', name: 'Maya Putri' };
const starter = {
  id: 'thread-redux',
  title: 'Mulai belajar Redux',
  body: '<p>Contoh state untuk forum.</p>',
  category: 'redux',
  createdAt: '2026-04-01T09:00:00.000Z',
  ownerId: owner.id,
  totalComments: 2,
};
const welcome = { ...starter, id: 'thread-welcome', title: 'Halo anggota baru', category: 'perkenalan' };

function renderFeed({ query = '', loading = false } = {}) {
  const store = createAppStore();
  store.dispatch(loading ? loadFeed.pending('feed-load') : loadFeed.fulfilled({
    threads: [starter, welcome],
    users: { [owner.id]: owner },
  }, 'feed-ready'));
  store.dispatch(searchChanged(query));

  render(
    <Provider store={store}>
      <MemoryRouter future={{ 'v7_startTransition': true, 'v7_relativeSplatPath': true }}>
        <FeedPage />
      </MemoryRouter>
    </Provider>,
  );
}

afterEach(cleanup);

describe('FeedPage', () => {
  it('menampilkan judul, cuplikan, penulis, tanggal, dan jumlah komentar', () => {
    renderFeed();

    const cards = screen.getAllByRole('article');
    const card = within(cards[0]);

    expect(card.getByRole('link', { name: starter.title })).toBeVisible();
    expect(card.getByText('Contoh state untuk forum.')).toBeVisible();
    expect(card.getByText(owner.name)).toBeVisible();
    expect(cards[0].querySelector('time')).toHaveAttribute('datetime', starter.createdAt);
    expect(card.getByRole('link', { name: '2 komentar' })).toBeVisible();
  });

  it('menyaring diskusi setelah kategori dipilih', async () => {
    renderFeed();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'redux', exact: true }));

    expect(await screen.findByRole('button', { name: 'redux', pressed: true, exact: true })).toBeVisible();
    expect(screen.getByRole('link', { name: starter.title })).toBeVisible();
    expect(screen.queryByRole('link', { name: welcome.title })).not.toBeInTheDocument();
  });

  it('menampilkan judul yang cocok dengan pencarian huruf kapital', () => {
    renderFeed({ query: '  REDUX  ' });

    expect(screen.getByRole('heading', { name: 'Hasil pencarian' })).toBeVisible();
    expect(screen.getByRole('link', { name: starter.title })).toBeVisible();
    expect(screen.queryByRole('link', { name: welcome.title })).not.toBeInTheDocument();
  });

  it('menghapus pencarian dan menampilkan lagi diskusi dari kondisi kosong', async () => {
    renderFeed({ query: 'tidak cocok' });
    const user = userEvent.setup();

    expect(screen.getByText('Belum ada diskusi yang cocok')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Hapus filter dan pencarian' }));

    expect(await screen.findByRole('heading', { name: 'Diskusi terbaru' })).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('memberi tahu pengguna bahwa diskusi masih dimuat', () => {
    renderFeed({ loading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Memuat diskusi…');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
