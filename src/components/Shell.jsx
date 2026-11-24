import { useSelector, useDispatch } from 'react-redux';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Compass, LogOut, Search, Trophy } from 'lucide-react';
import { Avatar, Brand } from './Primitives.jsx';
import { signOut } from '../state/session.js';
import { searchChanged } from '../state/forum.js';

const navigation = [
  { path: '/', title: 'Jelajah', Icon: Compass },
  { path: '/leaderboard', title: 'Leaderboard', Icon: Trophy },
];

export function loginLink(location) {
  return `/masuk?${new URLSearchParams({ lanjut: location.pathname + location.search })}`;
}

function Sidebar({ user, onLogout }) {
  return (
    <aside className="sidebar">
      <Brand />
      <nav className="navigation" aria-label="Navigasi utama">
        {navigation.map(({ path, title, Icon }) => (
          <NavLink key={path} to={path} end={path === '/'}>
            <Icon size={19} aria-hidden="true" />
            <span>{title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {user && (
          <div className="sidebar-user">
            <Avatar user={user} size="medium" />
            <span>{user.name}</span>
            <button type="button" className="icon-button" onClick={onLogout} aria-label="Keluar">
              <LogOut size={17} aria-hidden="true" />
            </button>
          </div>
        )}
        <a className="api-credit" href="https://forum-api.dicoding.dev/v1/" target="_blank" rel="noreferrer">
          Dicoding Forum API
        </a>
      </div>
    </aside>
  );
}

function HeaderSearch() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const query = useSelector((state) => state.forum.search);

  function updateSearch(value) {
    dispatch(searchChanged(value));

    if (pathname !== '/') {
      navigate('/');
    }
  }

  return (
    <div className="header-search" role="search">
      <Search size={18} aria-hidden="true" />
      <input
        aria-label="Cari judul diskusi"
        type="search"
        placeholder="Cari judul diskusi…"
        value={query}
        onChange={(event) => updateSearch(event.target.value)}
      />
    </div>
  );
}

export function Shell() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, status } = useSelector((state) => state.session);
  const activeRequests = useSelector((state) => state.requests);
  const isLoading = activeRequests > 0 || status !== 'idle';
  const shouldShowAuth = !user && status !== 'restoring';

  function logout() {
    dispatch(signOut());
  }

  return (
    <div className="app-shell">
      <a href="#konten" className="skip-link" onClick={(event) => {
        event.preventDefault();
        document.getElementById('konten')?.focus();
      }}>Lewati ke konten</a>
      <Sidebar user={user} onLogout={logout} />
      <div className="app-content">
        <header className="topbar">
          <span className="topbar-brand"><Brand /></span>
          <HeaderSearch />
          {shouldShowAuth && (
            <div className="header-actions">
              <Link className="button button-quiet" to={loginLink(location)}>Masuk</Link>
              <Link className="button button-primary header-register" to="/daftar">Daftar</Link>
            </div>
          )}
          {user && (
            <div className="header-actions user-actions">
              <Avatar user={user} size="medium" />
              <span>{user.name}</span>
              <button type="button" className="icon-button mobile-logout" onClick={logout} aria-label="Keluar">
                <LogOut size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        </header>
        {isLoading && <div className="progress" role="status" aria-label="Memuat data"><span /></div>}
        <main id="konten" tabIndex={-1} className="main-content"><Outlet /></main>
      </div>
    </div>
  );
}
