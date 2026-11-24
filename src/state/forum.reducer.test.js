import { describe, expect, it } from 'vitest';
import { forumReducer, loadFeed, loadThread, publishComment, selectDetail } from './forum.js';

/**
 * Skenario
 * - Feed baru menampilkan status loading dan menghapus pesan gagal sebelumnya.
 * - Respons feed sukses menyimpan daftar dan pemetaan penulis.
 * - Detail yang gagal dimuat tersimpan hanya pada ID yang diminta.
 * - Komentar baru muncul di detail dan jumlah komentar di feed ikut diperbarui.
 * - Action komentar yang sama tidak menggandakan komentar.
 */

const threadId = 'thread-testing';
const owner = { id: 'user-owner', name: 'Maya' };
const thread = { id: threadId, ownerId: owner.id, totalComments: 0 };
const detail = { id: threadId, owner, comments: [] };
const comment = { id: 'comment-first', content: 'Terima kasih!', owner };
const submittedComment = publishComment.fulfilled(comment, 'send-1', { threadId, text: comment.content });

function loadedForum() {
  const feed = forumReducer(undefined, loadFeed.fulfilled({
    threads: [thread],
    users: { [owner.id]: owner },
  }, 'feed-1'));
  return forumReducer(feed, loadThread.fulfilled(detail, 'detail-1', threadId));
}

describe('forumReducer', () => {
  it('membersihkan error saat memulai pemuatan ulang feed', () => {
    const failed = forumReducer(undefined, loadFeed.rejected(new Error('Gangguan jaringan'), 'feed-1'));
    const retrying = forumReducer(failed, loadFeed.pending('feed-2'));

    expect(failed.feed).toMatchObject({ status: 'error', error: 'Gangguan jaringan' });
    expect(retrying.feed).toMatchObject({ status: 'loading', error: null });
  });

  it('menyimpan thread dan penulis saat feed berhasil dimuat', () => {
    const state = loadedForum();

    expect(state.feed).toEqual({
      status: 'ready',
      error: null,
      items: [thread],
      users: { [owner.id]: owner },
    });
  });

  it('membatasi status error detail pada thread yang gagal dimuat', () => {
    const failed = forumReducer(loadedForum(), loadThread.rejected(new Error('Diskusi tidak ditemukan'), 'detail-2', 'missing'));

    expect(selectDetail({ forum: failed }, 'missing')).toEqual({
      status: 'error',
      error: 'Diskusi tidak ditemukan',
      item: null,
    });
    expect(selectDetail({ forum: failed }, threadId).item).toEqual(detail);
  });

  it('menambah komentar dan menyinkronkan jumlahnya tanpa memutasi state sebelumnya', () => {
    const previous = loadedForum();
    const updated = forumReducer(previous, submittedComment);

    expect(selectDetail({ forum: updated }, threadId).item.comments).toEqual([comment]);
    expect(updated.feed.items[0].totalComments).toBe(2);
    expect(selectDetail({ forum: previous }, threadId).item.comments).toEqual([]);
    expect(previous.feed.items[0].totalComments).toBe(0);
  });

  it('menyimpan satu komentar jika action dengan ID yang sama diproses dua kali', () => {
    const updated = forumReducer(loadedForum(), submittedComment);
    const repeated = forumReducer(updated, submittedComment);

    expect(selectDetail({ forum: repeated }, threadId).item.comments).toEqual([comment]);
    expect(repeated.feed.items[0].totalComments).toBe(1);
  });
});
