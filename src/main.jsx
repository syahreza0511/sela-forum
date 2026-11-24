import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createHashRouter, Link, RouterProvider } from 'react-router-dom';
import { Shell } from './components/Shell.jsx';
import { EmptyNotice } from './components/Primitives.jsx';
import { FeedPage } from './pages/FeedPage.jsx';
import { ThreadPage } from './pages/ThreadPage.jsx';
import { LeaderboardPage } from './pages/LeaderboardPage.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { ComposePage } from './pages/ComposePage.jsx';
import { loadFeed, loadLeaderboard, loadThread } from './state/forum.js';
import { restoreSession } from './state/session.js';
import { store } from './state/store.js';
import '@fontsource-variable/manrope';
import './styles.css';

store.dispatch(restoreSession());

const router = createHashRouter([
  {
    element: <Shell />,
    children: [
      {
        index: true,
        element: <FeedPage />,
        loader() {
          store.dispatch(loadFeed());
          store.dispatch(loadLeaderboard());
          return null;
        },
        shouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }) {
          return currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search
            ? false
            : defaultShouldRevalidate;
        },
      },
      {
        path: '/diskusi/:id',
        element: <ThreadPage />,
        loader({ params }) {
          store.dispatch(loadThread(params.id));
          return null;
        },
      },
      {
        path: '/leaderboard',
        element: <LeaderboardPage />,
        loader() {
          store.dispatch(loadLeaderboard());
          return null;
        },
      },
      { path: '/masuk', element: <AuthPage key="login" /> },
      { path: '/daftar', element: <AuthPage key="register" register /> },
      { path: '/buat', element: <ComposePage /> },
      {
        path: '*',
        element: (
          <EmptyNotice title="Halaman tidak ditemukan">
            <Link className="button button-primary" to="/">Kembali ke diskusi</Link>
          </EmptyNotice>
        ),
      },
    ],
  },
], {
  future: { 'v7_relativeSplatPath': true },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} future={{ 'v7_startTransition': true }} />
    </Provider>
  </StrictMode>,
);
