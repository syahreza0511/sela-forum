import { useState } from 'react';
import { AlertCircle, Hash, LoaderCircle, MessagesSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, formatRelativeDate, sanitizeContent, topicName } from '../lib/format.js';

export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Sela, beranda">
      <span className="brand-icon"><MessagesSquare size={22} aria-hidden="true" /></span>
      <span>sela<span className="brand-dot">.</span></span>
    </Link>
  );
}

export function Avatar({ user, size = 'small' }) {
  const [brokenUrl, setBrokenUrl] = useState(null);
  const name = user?.name || 'Pengguna';
  const url = user?.avatar;
  const validUrl = typeof url === 'string' && /^https:\/\//i.test(url) && brokenUrl !== url;
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('');
  const color = name.length % 4;

  return (
    <span className={`avatar avatar-${size} avatar-color-${color}`} aria-hidden="true">
      {initials}
      {validUrl && <img alt="" referrerPolicy="no-referrer" src={url} onError={() => setBrokenUrl(url)} />}
    </span>
  );
}

export function Author({ user, date, compact = false }) {
  return (
    <div className="author">
      <Avatar user={user} size={compact ? 'small' : 'medium'} />
      <div className={compact ? 'author-inline' : 'author-stacked'}>
        <span className="author-name">{user?.name || 'Pengguna'}</span>
        {compact && <span className="author-dot" aria-hidden="true">·</span>}
        <time dateTime={date} title={formatDate(date)}>{compact ? formatRelativeDate(date) : formatDate(date)}</time>
      </div>
    </div>
  );
}

export function TopicTag({ category }) {
  const name = topicName(category);
  const theme = name.toLowerCase() === 'redux' ? 'purple' : 'green';

  return (
    <Link className={`tag tag-${theme}`} to={`/?${new URLSearchParams({ kategori: name.toLowerCase() })}`}>
      <Hash size={13} aria-hidden="true" />{name}
    </Link>
  );
}

export function HtmlContent({ html }) {
  return <div className="rich-text" dangerouslySetInnerHTML={{ __html: sanitizeContent(html) }} />;
}

export function Loading({ label = 'Memuat data…' }) {
  return (
    <div className="notice" role="status">
      <LoaderCircle className="spinner" size={23} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorNotice({ message, onRetry }) {
  return (
    <div className="notice notice-error" role="alert">
      <AlertCircle size={21} aria-hidden="true" />
      <span>{message}</span>
      {onRetry && <button className="button button-outline" onClick={onRetry} type="button">Coba lagi</button>}
    </div>
  );
}

export function EmptyNotice({ title, children, icon: Icon = MessagesSquare }) {
  return (
    <div className="notice notice-empty">
      <span className="icon-tile"><Icon size={22} aria-hidden="true" /></span>
      <strong>{title}</strong>
      {children}
    </div>
  );
}
