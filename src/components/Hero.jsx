import { Code2, MessageCircle, MessagesSquare } from 'lucide-react';

export function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="orbit orbit-outer" />
      <div className="orbit orbit-middle" />
      <div className="orbit orbit-inner" />
      <span className="art-dot art-dot-top" />
      <span className="art-dot art-dot-bottom" />
      <span className="art-sparkle">✦</span>
      <div className="art-card art-code"><Code2 size={31} strokeWidth={1.7} /></div>
      <div className="art-card art-chat"><MessagesSquare size={53} strokeWidth={1.45} /></div>
      <div className="art-card art-reply"><MessageCircle size={26} strokeWidth={1.7} /></div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero" aria-labelledby="forum-title">
      <div className="hero-copy">
        <h1 id="forum-title">Temukan jawaban.<br /><span>Bagikan pengalaman.</span></h1>
        <p>Ruang diskusi untuk belajar, bertanya, dan berbagi pengalaman ngoding.</p>
      </div>
      <HeroArt />
    </section>
  );
}
