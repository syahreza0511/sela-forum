import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Loading } from '../components/Primitives.jsx';
import { loginLink } from '../components/Shell.jsx';
import { publishThread, selectTopics } from '../state/forum.js';

export function ComposePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, status } = useSelector((state) => state.session);
  const topics = useSelector(selectTopics);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();

    if (sending) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const draft = Object.fromEntries(form);

    if (!draft.title.trim() || !draft.body.trim()) {
      setError('Judul dan isi diskusi wajib diisi.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const thread = await dispatch(publishThread(draft)).unwrap();
      navigate(`/diskusi/${encodeURIComponent(thread.id)}`, { replace: true });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSending(false);
    }
  }

  if (status === 'restoring') {
    return <Loading label="Memulihkan sesi…" />;
  }

  if (!user && !error) {
    return <Navigate to={loginLink(location)} replace />;
  }

  return (
    <div className="detail-layout">
      <Link className="back-link" to="/"><ChevronLeft size={19} aria-hidden="true" /> Kembali ke diskusi</Link>
      <section className="detail-card compose-card">
        <header className="page-heading">
          <h1>Buat diskusi</h1>
          <p>Tambahkan konteks atau contoh agar orang lain mudah menanggapi.</p>
        </header>
        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="thread-title">Judul</label>
            <input id="thread-title" name="title" maxLength={150} required placeholder="Apa yang ingin kamu diskusikan?" />
          </div>
          <div className="field">
            <label htmlFor="thread-category">Kategori <span className="muted">(opsional)</span></label>
            <input id="thread-category" name="category" list="thread-topics" maxLength={40} placeholder="Contoh: react" />
            <datalist id="thread-topics">{topics.map(({ name }) => <option key={name} value={name} />)}</datalist>
            <small>Jika kosong, diskusi masuk kategori umum.</small>
          </div>
          <div className="field">
            <label htmlFor="thread-body">Isi diskusi</label>
            <textarea id="thread-body" name="body" required rows={8} placeholder="Jelaskan pertanyaan, kendala, atau pengalamanmu…" />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {user ? <button className="button button-primary" type="submit" disabled={sending}>{sending ? 'Menerbitkan…' : 'Terbitkan diskusi'}</button>
            : <Link className="button button-primary" to={loginLink(location)}>Masuk kembali</Link>}
        </form>
      </section>
    </div>
  );
}
