import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { HeroArt } from '../components/Hero.jsx';
import { Loading } from '../components/Primitives.jsx';
import { authenticate } from '../state/session.js';

export function AuthPage({ register = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const session = useSelector((state) => state.session);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [invalidName, setInvalidName] = useState(false);
  const requestedPath = params.get('lanjut') || '/';
  const follow = /^\/(?![\/\\])[\w%/?&=.+-]*$/.test(requestedPath)
    && !/^\/(?:masuk|daftar)(?:\?|$)/.test(requestedPath) ? requestedPath : '/';
  const alternate = register ? '/masuk' : '/daftar';
  const alternatePath = follow === '/' ? alternate : `${alternate}?${new URLSearchParams({ lanjut: follow })}`;
  const busy = session.status !== 'idle';

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();

    if (register && !name) {
      setInvalidName(true);
      return;
    }

    const credentials = {
      email: String(form.get('email')).trim(),
      password: String(form.get('password')),
    };

    if (register) {
      credentials.name = name;
    }

    setSubmitted(true);
    const success = await dispatch(authenticate(register ? 'register' : 'login', credentials));

    if (success) {
      navigate(follow, { replace: true });
    }
  }

  if (session.user) {
    return <Navigate to={follow} replace />;
  }

  if (session.status === 'restoring') {
    return <Loading label="Memulihkan sesi…" />;
  }

  return (
    <div className="auth-layout">
      <section className="auth-panel">
        <div className="page-heading">
          <h1>{register ? 'Buat akun Sela' : 'Masuk ke Sela'}</h1>
          <p>{register ? 'Buat akun untuk memulai diskusi dan berkomentar.' : 'Lanjutkan diskusi dengan akun forummu.'}</p>
        </div>
        <form className="form" onSubmit={submit}>
          {register && (
            <div className="field">
              <label htmlFor="auth-name">Nama</label>
              <input id="auth-name" name="name" autoComplete="name" maxLength={80} required onChange={() => setInvalidName(false)} />
              {invalidName && <p className="form-error" role="alert">Isi nama yang akan ditampilkan.</p>}
            </div>
          )}
          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="auth-password">Kata sandi</label>
            <div className="password-field">
              <input id="auth-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 6 : undefined} required />
              <button type="button" className="icon-button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
                {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
              </button>
            </div>
            {register && <small>Minimal 6 karakter.</small>}
          </div>
          {submitted && session.error && <p className="form-error" role="alert">{session.error}</p>}
          <button type="submit" className="button button-primary" disabled={busy}>
            {busy ? 'Memproses…' : register ? 'Buat akun' : 'Masuk'}
          </button>
        </form>
        <p className="auth-alternate">
          {register ? 'Sudah punya akun?' : 'Belum punya akun?'} <Link to={alternatePath}>{register ? 'Masuk' : 'Daftar'}</Link>
        </p>
      </section>
      <div className="auth-art" aria-hidden="true"><HeroArt /></div>
    </div>
  );
}
