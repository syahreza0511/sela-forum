import { expect, test } from '@playwright/test';

/**
 * Skenario
 * - Login dari halaman diskusi mengembalikan pengguna ke diskusi dan sesi pulih setelah reload.
 * - Kredensial yang salah menampilkan pesan dari API dan mempertahankan halaman login.
 * - Pengguna baru mendaftar, menerbitkan thread, mengomentari, dan memberi upvote pada thread.
 * - Pengunjung menemukan thread dengan filter serta pencarian dan melihat leaderboard.
 */

const credentials = { email: 'sela-qa@example.test', password: 'kata-sandi-uji' };
const viewer = { id: 'user-qa', name: 'Sela QA', avatar: null };
const author = { id: 'user-author', name: 'Maya Putri', avatar: null };
const sampleThread = {
  id: 'thread-redux',
  title: 'Pengalaman belajar Redux',
  category: 'redux',
  body: '<p>Ceritakan pengalamanmu.</p>',
  ownerId: author.id,
  createdAt: '2026-04-01T08:00:00.000Z',
  upVotesBy: [],
  downVotesBy: [],
  totalComments: 0,
};
const welcomeThread = {
  ...sampleThread,
  id: 'thread-welcome',
  category: 'perkenalan',
  title: 'Selamat datang di Sela',
};
const apiUrl = 'https://forum-api.dicoding.dev/v1/';

async function mockForumApi(page, { rejectLogin = false } = {}) {
  const threads = [sampleThread, welcomeThread];
  const comments = new Map();
  const votes = new Map();
  const calls = [];

  await page.route(`${apiUrl}**`, async (route) => {
    const request = route.request();
    const method = request.method();
    const path = request.url().slice(apiUrl.length);
    const body = request.postDataJSON();

    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, content-type',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
    };

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }

    calls.push({ method, path, body });
    const reply = (data, status = 200, message = 'OK') => route.fulfill({
      status,
      headers,
      json: { status: status < 300 ? 'success' : 'fail', message, data },
    });

    if (method === 'GET' && path === 'users') return reply({ users: [author, viewer] });
    if (method === 'GET' && path === 'leaderboards') {
      return reply({ leaderboards: [{ user: author, score: 12 }, { user: viewer, score: 5 }] });
    }
    if (method === 'POST' && path === 'register') {
      return reply({ user: viewer }, 201);
    }
    if (method === 'POST' && path === 'login') {
      if (rejectLogin || body.email !== credentials.email || body.password !== credentials.password) {
        return reply(null, 401, 'Email atau kata sandi salah.');
      }
      return reply({ token: 'token-simulasi-sela' });
    }

    const needsSession = method === 'POST' || path === 'users/me';
    if (needsSession && request.headers().authorization !== 'Bearer token-simulasi-sela') {
      return reply(null, 401, 'Sesi berakhir.');
    }

    if (method === 'GET' && path === 'users/me') return reply({ user: viewer });
    if (path === 'threads' && method === 'GET') return reply({ threads });
    if (path === 'threads' && method === 'POST') {
      const thread = {
        ...sampleThread,
        ...body,
        id: 'thread-created',
        ownerId: viewer.id,
        createdAt: '2026-04-02T08:00:00.000Z',
      };
      threads.unshift(thread);
      return reply({ thread }, 201);
    }

    const [, id, operation] = path.split('/');
    const thread = threads.find((item) => item.id === id);
    if (!thread) return reply(null, 404, 'Diskusi tidak ditemukan.');

    if (method === 'GET' && !operation) {
      return reply({
        detailThread: {
          ...thread,
          owner: thread.ownerId === viewer.id ? viewer : author,
          comments: comments.get(id) || [],
          upVotesBy: votes.get(id) || [],
        },
      });
    }

    if (method === 'POST' && operation === 'comments') {
      const comment = {
        id: 'comment-created',
        owner: viewer,
        content: body.content,
        createdAt: thread.createdAt,
        upVotesBy: [],
        downVotesBy: [],
      };
      comments.set(id, [...(comments.get(id) || []), comment]);
      return reply({ comment }, 201);
    }

    if (method === 'POST' && operation === 'up-vote') {
      votes.set(id, [viewer.id]);
      return reply({ vote: { id: 'vote-created', userId: viewer.id, threadId: id, voteType: 1 } });
    }

    return reply(null, 404, 'Endpoint uji tidak ditemukan.');
  });

  return calls;
}

async function fillCredentials(page) {
  await page.getByLabel('Email', { exact: true }).fill(credentials.email);
  await page.getByLabel('Kata sandi', { exact: true }).fill(credentials.password);
}

test('login dari diskusi mengembalikan pengguna dan memulihkan sesi setelah reload', async ({ page }) => {
  const calls = await mockForumApi(page);
  await page.goto('/#/diskusi/thread-redux');

  await page.getByRole('main').getByRole('link', { name: 'Masuk', exact: true }).click();
  await fillCredentials(page);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();

  await expect(page).toHaveURL(/#\/diskusi\/thread-redux$/);
  await expect(page.getByRole('heading', { name: sampleThread.title })).toBeVisible();
  await expect(page.getByLabel('Tulis komentar')).toBeVisible();
  await expect(page.getByRole('banner').getByText(viewer.name)).toBeVisible();
  expect(calls.find(({ path }) => path === 'login')?.body).toEqual(credentials);

  await page.reload();
  await expect(page.getByLabel('Tulis komentar')).toBeVisible();
  expect(calls.filter(({ path }) => path === 'users/me')).toHaveLength(2);
});

test('kegagalan login menampilkan pesan dan mempertahankan sesi tamu', async ({ page }) => {
  const calls = await mockForumApi(page, { rejectLogin: true });
  await page.goto('/#/masuk');
  await fillCredentials(page);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();

  await expect(page.getByRole('alert')).toHaveText('Email atau kata sandi salah.');
  await expect(page.getByRole('heading', { name: 'Masuk ke Sela' })).toBeVisible();
  expect(calls.some(({ path }) => path === 'users/me')).toBe(false);
});

test('pengguna baru bisa mendaftar, membuat thread, berkomentar, dan memberi upvote', async ({ page }) => {
  const calls = await mockForumApi(page);
  await page.goto('/#/daftar');
  await page.getByLabel('Nama', { exact: true }).fill(viewer.name);
  await fillCredentials(page);
  await page.getByRole('button', { name: 'Buat akun', exact: true }).click();

  await page.getByRole('link', { name: 'Buat diskusi' }).click();
  await page.getByLabel('Judul', { exact: true }).fill('Diskusi yang baru dibuat');
  await page.getByLabel('Kategori (opsional)').fill('React');
  await page.getByLabel('Isi diskusi').fill('Mari berdiskusi tentang React.');
  await page.getByRole('button', { name: 'Terbitkan diskusi' }).click();

  await expect(page.getByRole('heading', { name: 'Diskusi yang baru dibuat' })).toBeVisible();
  await expect(page.getByText('Mari berdiskusi tentang React.')).toBeVisible();
  await page.getByLabel('Tulis komentar').fill('Aku ikut belajar!');
  await page.getByRole('button', { name: 'Kirim komentar' }).click();
  await expect(page.getByText('Aku ikut belajar!')).toBeVisible();
  await expect(page.getByRole('heading', { name: '1 Komentar' })).toBeVisible();

  const upvote = page.getByRole('article').getByRole('button', { name: 'Upvote' });
  await upvote.click();
  await expect(upvote).toHaveAttribute('aria-pressed', 'true');
  await expect(upvote).toBeEnabled();
  expect(calls.filter(({ method }) => method === 'POST').map(({ path }) => path)).toEqual([
    'register',
    'login',
    'threads',
    'threads/thread-created/comments',
    'threads/thread-created/up-vote',
  ]);
});

test('pengunjung dapat memfilter, mencari, dan membuka leaderboard', async ({ page }) => {
  await mockForumApi(page);
  await page.goto('/');
  await expect(page.getByRole('link', { name: sampleThread.title })).toBeVisible();
  await expect(page.getByRole('link', { name: welcomeThread.title })).toBeVisible();

  await page.getByRole('button', { name: 'redux', exact: true }).click();
  await expect(page.getByRole('link', { name: welcomeThread.title })).toHaveCount(0);
  await page.getByRole('button', { name: 'Semua', exact: true }).click();
  await page.getByRole('searchbox').pressSequentially('selamat');
  await expect(page.getByRole('link', { name: welcomeThread.title })).toBeVisible();
  await expect(page.getByRole('link', { name: sampleThread.title })).toHaveCount(0);

  await page.getByRole('link', { name: 'Leaderboard', exact: true }).click();
  const board = page.getByRole('region', { name: 'Peringkat kontributor' });
  await expect(board.getByText(author.name)).toBeVisible();
  await expect(board.getByText('12', { exact: false })).toBeVisible();
});
