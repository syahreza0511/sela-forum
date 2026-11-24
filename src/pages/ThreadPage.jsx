import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, MessageCircle } from 'lucide-react';
import { Author, ErrorNotice, HtmlContent, Loading, TopicTag } from '../components/Primitives.jsx';
import { VoteBar } from '../components/VoteBar.jsx';
import { loginLink } from '../components/Shell.jsx';
import { loadThread, publishComment, selectDetail } from '../state/forum.js';

function CommentForm({ threadId }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, status } = useSelector((state) => state.session);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();

    if (!text.trim() || sending) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      await dispatch(publishComment({ threadId, text })).unwrap();
      setText('');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSending(false);
    }
  }

  if (status === 'restoring') {
    return <Loading label="Memulihkan sesi…" />;
  }

  if (!user) {
    return (
      <div className="comment-gate">
        <MessageCircle size={21} aria-hidden="true" />
        <p>{error || 'Masuk untuk ikut berdiskusi.'}</p>
        <Link className="button button-outline" to={loginLink(location)}>Masuk</Link>
      </div>
    );
  }

  return (
    <form className="form comment-form" onSubmit={submit}>
      <label htmlFor="comment">Tulis komentar</label>
      <textarea id="comment" placeholder="Tambahkan tanggapanmu…" rows={4} required value={text} onChange={(event) => setText(event.target.value)} />
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary" type="submit" disabled={sending || !text.trim()}>
        {sending ? 'Mengirim…' : 'Kirim komentar'}
      </button>
    </form>
  );
}

function Comment({ comment, threadId }) {
  return (
    <li className="comment">
      <Author user={comment.owner} date={comment.createdAt} />
      <HtmlContent html={comment.content} />
      <VoteBar threadId={threadId} commentId={comment.id} item={comment} />
    </li>
  );
}

export function ThreadPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { status, item, error } = useSelector((state) => selectDetail(state, id));

  return (
    <div className="detail-layout">
      <Link className="back-link" to="/"><ChevronLeft size={19} aria-hidden="true" /> Kembali ke diskusi</Link>
      {status === 'error' && <ErrorNotice message={error} onRetry={() => dispatch(loadThread(id))} />}
      {!item && status !== 'error' && <Loading label="Memuat detail diskusi…" />}
      {item && (
        <>
          <article className="detail-card">
            <TopicTag category={item.category} />
            <h1>{item.title}</h1>
            <Author user={item.owner} date={item.createdAt} />
            <HtmlContent html={item.body} />
            <VoteBar threadId={id} item={item} />
          </article>
          <section className="detail-card comments-card" aria-labelledby="comments-title">
            <h2 id="comments-title"><MessageCircle size={22} aria-hidden="true" /> {item.comments.length} Komentar</h2>
            <CommentForm key={id} threadId={id} />
            {item.comments.length ? (
              <ol className="comment-list">
                {item.comments.map((comment) => <Comment key={comment.id} comment={comment} threadId={id} />)}
              </ol>
            ) : <p className="muted empty-comments">Belum ada komentar.</p>}
          </section>
        </>
      )}
    </div>
  );
}
