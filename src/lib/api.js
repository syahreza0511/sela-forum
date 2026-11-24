const baseUrl = 'https://forum-api.dicoding.dev/v1';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { body, method = 'GET', token } = {}) {
  const headers = { Accept: 'application/json' };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError('Forum belum bisa dihubungi. Periksa koneksi lalu coba lagi.');
  }

  const result = await response.json().catch(() => null);

  if (!response.ok || result?.status !== 'success') {
    throw new ApiError(result?.message || 'Permintaan gagal. Silakan coba lagi.', response.status);
  }

  return result.data;
}

function threadPath(threadId) {
  return `/threads/${encodeURIComponent(threadId)}`;
}

const votePaths = {
  1: 'up-vote',
  0: 'neutral-vote',
  '-1': 'down-vote',
};

export const api = {
  register: (body) => request('/register', { method: 'POST', body }),
  login: (body) => request('/login', { method: 'POST', body }),
  profile: (token) => request('/users/me', { token }),
  users: () => request('/users'),
  threads: () => request('/threads'),
  thread: (id) => request(threadPath(id)),
  leaderboard: () => request('/leaderboards'),
  createThread: (body, token) => request('/threads', { method: 'POST', body, token }),
  createComment: (id, content, token) => request(`${threadPath(id)}/comments`, {
    method: 'POST',
    body: { content },
    token,
  }),
  vote: ({ threadId, commentId, value }, token) => {
    const path = commentId
      ? `${threadPath(threadId)}/comments/${encodeURIComponent(commentId)}`
      : threadPath(threadId);

    return request(`${path}/${votePaths[value]}`, { method: 'POST', token });
  },
};
