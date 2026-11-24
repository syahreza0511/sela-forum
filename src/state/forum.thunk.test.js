import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../lib/api.js';
import { loadFeed, publishThread } from './forum.js';
import { authenticate, signOut } from './session.js';
import { createAppStore } from './store.js';
import { changeVote } from './votes.js';

/**
 * Skenario
 * - Thunk feed menggabungkan thread dengan data penulis yang dibutuhkan UI.
 * - Thunk feed mencatat kegagalan API dan menyelesaikan indikator loading.
 * - Thunk feed menghindari permintaan yang sama selama permintaan pertama berjalan.
 * - Thunk penerbitan memeriksa sesi dan mengirim draf yang dinormalisasi.
 * - Thunk vote menampilkan perubahan sementara dan mengembalikannya jika API gagal.
 */

const profile = { id: 'user-qa', name: 'Sela QA', avatar: 'https://example.test/qa.png' };
const auth = { email: 'qa@example.test', password: 'sandi-uji' };
const thread = { id: 'thread-first', ownerId: profile.id };
const vote = { threadId: thread.id, userId: profile.id, value: 1 };
let store;

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function signIn() {
  vi.spyOn(api, 'login').mockResolvedValue({ token: 'token-uji' });
  vi.spyOn(api, 'profile').mockResolvedValue({ user: profile });
  await store.dispatch(authenticate('login', auth));
}

beforeEach(() => {
  store = createAppStore();
  store.dispatch(signOut());
});

afterEach(() => {
  store.dispatch(signOut());
  vi.restoreAllMocks();
});

describe('thunk forum', () => {
  it('mengambil feed dan menyimpan hanya profil publik penulis yang relevan', async () => {
    const fetchThreads = vi.spyOn(api, 'threads').mockResolvedValue({ threads: [thread] });
    const fetchUsers = vi.spyOn(api, 'users').mockResolvedValue({
      users: [{ ...profile, email: auth.email }, { id: 'user-lain', name: 'Lain' }],
    });

    await store.dispatch(loadFeed()).unwrap();

    expect(fetchThreads).toHaveBeenCalledOnce();
    expect(fetchUsers).toHaveBeenCalledOnce();
    expect(store.getState().forum.feed).toEqual({
      status: 'ready',
      error: null,
      items: [thread],
      users: { [profile.id]: profile },
    });
    expect(store.getState().requests).toBe(0);
  });

  it('mencatat kegagalan feed dan menghentikan indikator loading', async () => {
    vi.spyOn(api, 'threads').mockRejectedValue(new ApiError('Forum sedang offline', 503));
    vi.spyOn(api, 'users').mockResolvedValue({ users: [] });

    const result = store.dispatch(loadFeed());
    expect(store.getState().requests).toBe(1);

    await expect(result.unwrap()).rejects.toMatchObject({ message: 'Forum sedang offline' });
    expect(store.getState().forum.feed).toMatchObject({ status: 'error', error: 'Forum sedang offline' });
    expect(store.getState().requests).toBe(0);
  });

  it('melewati pemuatan feed duplikat saat permintaan awal belum selesai', async () => {
    const response = deferred();
    const fetchThreads = vi.spyOn(api, 'threads').mockReturnValue(response.promise);
    vi.spyOn(api, 'users').mockResolvedValue({ users: [] });

    const original = store.dispatch(loadFeed());
    const duplicate = await store.dispatch(loadFeed());

    expect(duplicate.meta.condition).toBe(true);
    expect(fetchThreads).toHaveBeenCalledOnce();
    expect(store.getState().requests).toBe(1);

    response.resolve({ threads: [] });
    await original.unwrap();
    expect(store.getState().requests).toBe(0);
  });

  it('menolak penerbitan tanpa sesi, lalu mengirim data yang sudah dinormalisasi setelah login', async () => {
    const postThread = vi.spyOn(api, 'createThread').mockResolvedValue({ thread });
    const draft = { title: ' Diskusi pertama ', body: 'Halo <b>forum</b>\nBaris kedua', category: ' React ' };

    await expect(store.dispatch(publishThread(draft)).unwrap())
      .rejects.toMatchObject({ message: 'Silakan masuk untuk melanjutkan.' });
    expect(postThread).not.toHaveBeenCalled();

    await signIn();
    await expect(store.dispatch(publishThread(draft)).unwrap()).resolves.toEqual(thread);
    expect(postThread).toHaveBeenCalledWith({
      title: 'Diskusi pertama',
      body: 'Halo &lt;b&gt;forum&lt;/b&gt;<br>Baris kedua',
      category: 'react',
    }, 'token-uji');
  });

  it('menghapus vote sementara saat API gagal dan mempertahankan vote terakhir yang berhasil', async () => {
    await signIn();
    const response = deferred();
    const sendVote = vi.spyOn(api, 'vote')
      .mockResolvedValueOnce({})
      .mockReturnValueOnce(response.promise);

    await store.dispatch(changeVote(vote)).unwrap();
    const pending = store.dispatch(changeVote({ ...vote, value: -1 }));

    expect(sendVote).toHaveBeenLastCalledWith({ ...vote, value: -1 }, 'token-uji');
    expect(store.getState().votes[thread.id].pending).toEqual({ userId: profile.id, value: -1 });

    response.reject(new ApiError('Vote gagal disimpan', 503));
    await expect(pending.unwrap()).rejects.toMatchObject({ message: 'Vote gagal disimpan' });
    expect(store.getState().votes[thread.id]).toEqual({
      confirmed: { [profile.id]: 1 },
      pending: null,
      error: 'Vote gagal disimpan',
    });
  });
});
