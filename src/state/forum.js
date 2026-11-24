import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { api } from '../lib/api.js';
import { toApiHtml, topicName } from '../lib/format.js';
import { withSession } from './session.js';

function userSummary({ id, name, avatar }) {
  return { id, name, avatar };
}

const emptyResource = { status: 'idle', error: null };
const emptyDetails = { ...emptyResource, item: null };

const detailKey = (id) => `thread:${id}`;

export const loadFeed = createAsyncThunk('forum/feed', async () => {
  const [{ threads }, { users }] = await Promise.all([api.threads(), api.users()]);
  const owners = new Set(threads.map((thread) => thread.ownerId));
  return {
    threads,
    users: Object.fromEntries(
      users.filter((user) => owners.has(user.id)).map((user) => [user.id, userSummary(user)]),
    ),
  };
}, {
  condition: (_, { getState }) => getState().forum.feed.status !== 'loading',
});

export const loadThread = createAsyncThunk('forum/thread', async (id) => {
  const { detailThread } = await api.thread(id);
  return detailThread;
}, {
  condition: (id, { getState }) => selectDetail(getState(), id).status !== 'loading',
});

export const loadLeaderboard = createAsyncThunk('forum/leaderboard', async () => {
  const { leaderboards } = await api.leaderboard();
  return leaderboards.map(({ user, score }) => ({ user: userSummary(user), score }));
}, {
  condition: (_, { getState }) => getState().forum.leaderboard.status !== 'loading',
});

export const publishThread = createAsyncThunk('forum/publish', async (draft, { dispatch, getState }) => {
  const { title, category, body } = draft;
  const { thread } = await withSession((token) => api.createThread({
    title: title.trim(),
    body: toApiHtml(body),
    category: topicName(category).toLowerCase(),
  }, token), dispatch, getState);

  return thread;
});

export const publishComment = createAsyncThunk(
  'forum/comment',
  async ({ threadId, text }, { dispatch, getState }) => {
    const viewer = getState().session.user;
    const { comment } = await withSession(
      (token) => api.createComment(threadId, toApiHtml(text), token),
      dispatch,
      getState,
    );

    return { ...comment, owner: { ...viewer, ...comment.owner } };
  },
);

const forum = createSlice({
  name: 'forum',
  initialState: {
    search: '',
    feed: { ...emptyResource, items: [], users: {} },
    details: {},
    leaderboard: { ...emptyResource, items: [] },
  },
  reducers: {
    searchChanged(state, { payload }) {
      state.search = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFeed.pending, (state) => {
        state.feed.status = 'loading';
        state.feed.error = null;
      })
      .addCase(loadFeed.fulfilled, (state, { payload }) => {
        state.feed = { status: 'ready', error: null, items: payload.threads, users: payload.users };
      })
      .addCase(loadFeed.rejected, (state, { error }) => {
        state.feed.status = 'error';
        state.feed.error = error.message;
      })
      .addCase(loadThread.pending, (state, { meta }) => {
        const key = detailKey(meta.arg);
        const current = state.details[key] || emptyDetails;
        state.details[key] = { ...current, status: 'loading', error: null };
      })
      .addCase(loadThread.fulfilled, (state, { payload, meta }) => {
        state.details[detailKey(meta.arg)] = { status: 'ready', error: null, item: payload };
      })
      .addCase(loadThread.rejected, (state, { error, meta }) => {
        state.details[detailKey(meta.arg)] = { ...emptyDetails, status: 'error', error: error.message };
      })
      .addCase(loadLeaderboard.pending, (state) => {
        state.leaderboard.status = 'loading';
        state.leaderboard.error = null;
      })
      .addCase(loadLeaderboard.fulfilled, (state, { payload }) => {
        state.leaderboard = { status: 'ready', error: null, items: payload };
      })
      .addCase(loadLeaderboard.rejected, (state, { error }) => {
        state.leaderboard.status = 'error';
        state.leaderboard.error = error.message;
      })
      .addCase(publishComment.fulfilled, (state, { payload, meta }) => {
        const { threadId } = meta.arg;
        const detail = state.details[detailKey(threadId)]?.item;
        const thread = state.feed.items.find((item) => item.id === threadId);

        if (detail && !detail.comments.some((comment) => comment.id === payload.id)) {
          detail.comments.push(payload);

          if (thread) {
            thread.totalComments = detail.comments.length;
          }
        }
      });
  },
});

export const forumReducer = forum.reducer;
export const { searchChanged } = forum.actions;

export const selectDetail = (state, id) => state.forum.details[detailKey(id)] || emptyDetails;

const selectThreads = (state) => state.forum.feed.items;

export const selectTopics = createSelector([selectThreads], (threads) => {
  const counts = new Map();

  for (const thread of threads) {
    const name = topicName(thread.category).toLowerCase();
    counts.set(name, (counts.get(name) || 0) + 1);
  }

  return Array.from(counts, ([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name, 'id'));
});
