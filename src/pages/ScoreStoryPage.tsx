import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ScoreStoryPage.css';

export const ScoreStoryPage: React.FC = () => {
  useEffect(() => {
    document.title = 'MoneyMapper – How Your Score Is Built';
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }

    if (typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('in');
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.15 }
      );

      document.querySelectorAll('.score-story-page .r').forEach((el) => io.observe(el));
      return () => io.disconnect();
    }
  }, []);

  return (
    <div className="score-story-page">
      

<nav className="story-nav"><b>MoneyMapper</b><span>The story behind your score</span></nav>

<section className="hero" style={{ ['--img' as any]: 'url(/images/score-story/img_1.jpg)' }}>
  <div className="wrap r">
    <h1>One number for your <span className="grad">entire financial health.</span></h1>
    <div className="row"><figure className="fig shot"><img src="/images/score-story/img_2.jpg" alt="MoneyMapper app screenshot" loading="lazy" decoding="async" /></figure><p>Your Financial Fitness Score doesn't appear out of thin air. Let's follow one person's story to see how it really comes together.</p></div>
    <span className="tag">Inspired by real-life money situations</span>
  </div>
</section>

<section className="flip" style={{ ['--img' as any]: 'url(/images/score-story/img_3.jpg)' }}>
  <div className="wrap r">
    <div className="kicker"><i className="dot"></i>The beginning</div>
    <h2>Meet Aarav</h2>
    <div className="row rev"><p>Aarav is 28. He has a good job, a salary that lands every month, and one question that keeps him up at night: <i>"Am I actually okay financially, or do I just look okay?"</i></p><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="Aarav wondering about his money"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<circle cx="150" cy="118" r="38" fill="#f4c7a1"/>
<path d="M95 255 Q95 170 150 170 Q205 170 205 255 Z" fill="#9333ea"/>
<text x="222" y="86" fontSize="64" fontWeight="700" fill="#ec4899" fontFamily="sans-serif">?</text>
<circle cx="72" cy="206" r="24" fill="#f59e0b"/>
<text x="72" y="216" fontSize="28" fontWeight="700" textAnchor="middle" fill="#120f20" fontFamily="sans-serif">₹</text></svg></figure></div>
    <div className="row"><figure className="fig shot"><img src="/images/score-story/img_4.jpg" alt="MoneyMapper app screenshot" loading="lazy" decoding="async" /></figure><p>His friends say everything's fine. His bank balance says nothing at all. So Aarav opens MoneyMapper, and the app looks at his entire financial life through <b>five pillars</b>.</p></div>
    <div className="q">Every pillar gets its own score from 0 to 100. Together, they become one final number.</div>
  </div>
</section>

<section style={{ ['--img' as any]: 'url(/images/score-story/img_5.jpg)' }}>
  <div className="wrap r">
    <div className="kicker"><i className="dot" style={{ ['--c' as any]: 'var(--green)' }}></i>Pillar one: Income</div>
    <h2>Earnings: the first brick</h2>
    <div className="row rev"><p>First, we look at how strong and dependable Aarav's income is. Not just how much he earns, but how steady the ground under it is.</p><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="Rising income"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<rect x="62" y="170" width="34" height="70" rx="6" fill="#2dd4a0" opacity=".55"/>
<rect x="112" y="140" width="34" height="100" rx="6" fill="#2dd4a0" opacity=".7"/>
<rect x="162" y="110" width="34" height="130" rx="6" fill="#2dd4a0" opacity=".85"/>
<rect x="212" y="80" width="34" height="160" rx="6" fill="#2dd4a0"/>
<polyline points="60,150 110,120 160,90 230,60" fill="none" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
<circle cx="80" cy="80" r="24" fill="#f59e0b"/>
<text x="80" y="90" fontSize="26" fontWeight="700" textAnchor="middle" fill="#120f20" fontFamily="sans-serif">₹</text></svg></figure></div>
    <div className="row"><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="Steady ground under income"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<rect x="60" y="150" width="46" height="60" rx="6" fill="#9333ea"/>
<rect x="124" y="120" width="46" height="90" rx="6" fill="#3b82f6"/>
<rect x="188" y="92" width="46" height="118" rx="6" fill="#a855f7"/>
<rect x="40" y="212" width="220" height="10" rx="5" fill="#2dd4a0"/></svg></figure><p>Someone whose income is stable, or comes from more than one source, stands on firmer ground. Someone whose earnings swing up and down gets a more careful score.</p></div>
    <div className="sees"><small>What we look at</small>The level of income, how steady it is, and which way it's heading.</div>
  </div>
</section>

<section className="flip" style={{ ['--img' as any]: 'url(/images/score-story/img_6.jpg)' }}>
  <div className="wrap r">
    <div className="kicker"><i className="dot" style={{ ['--c' as any]: 'var(--red)' }}></i>Pillar two: Expenses</div>
    <h2>Spending: where the story turns</h2>
    <div className="row rev"><p>Aarav earns well, yet his wallet is empty by the end of the month. This is where the Expenses pillar steps in. We look at how much of his income goes out the door, and whether that spending is under control.</p><figure className="fig shot"><img src="/images/score-story/img_7.jpg" alt="MoneyMapper app screenshot" loading="lazy" decoding="async" /></figure></div>
    <div className="row"><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="Wallet spending"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<rect x="60" y="140" width="180" height="120" rx="18" fill="#ec4899"/>
<rect x="190" y="175" width="70" height="46" rx="12" fill="#f9a8d4"/>
<circle cx="214" cy="198" r="7" fill="#120f20"/>
<path d="M110 128 L110 70" stroke="#ef4444" strokeWidth="6" strokeLinecap="round"/>
<path d="M96 84 L110 70 L124 84" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
<circle cx="200" cy="92" r="16" fill="#f59e0b"/></svg></figure><p>Two people with the same salary can live completely different lives. One saves, the other borrows before the month ends. That's why spending is often the most honest mirror of all.</p></div>
    <div className="q" style={{ ['--c' as any]: 'var(--red)' }}>Living comfortably within your means pushes your score up.</div>
  </div>
</section>

<section style={{ ['--img' as any]: 'url(/images/score-story/img_8.jpg)' }}>
  <div className="wrap r">
    <div className="kicker"><i className="dot" style={{ ['--c' as any]: 'var(--blue)' }}></i>Pillar three: Emergency Savings</div>
    <h2>Bad times don't send a warning</h2>
    <div className="row rev"><p>One day, news of layoffs hits Aarav's company. That night he understands what an emergency fund is for: the safety net that holds when everything else stops.</p><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="Umbrella in the rain"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<path d="M55 150 Q150 55 245 150 Z" fill="#3b82f6"/>
<path d="M150 150 L150 235 Q150 255 128 250" fill="none" stroke="#f4f1fb" strokeWidth="6" strokeLinecap="round"/>
<g stroke="#a69fbe" strokeWidth="4" strokeLinecap="round">
<line x1="70" y1="60" x2="62" y2="80"/><line x1="110" y1="40" x2="102" y2="60"/><line x1="200" y1="40" x2="192" y2="60"/><line x1="235" y1="70" x2="227" y2="90"/><line x1="265" y1="110" x2="257" y2="130"/><line x1="45" y1="115" x2="37" y2="135"/>
</g></svg></figure></div>
    <div className="row"><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="Savings jar of six months"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<path d="M100 110 Q100 92 120 92 L180 92 Q200 92 200 110 L210 130 L210 250 Q210 265 195 265 L105 265 Q90 265 90 250 L90 130 Z" fill="#2dd4a0" fillOpacity=".18" stroke="#2dd4a0" strokeWidth="4"/>
<rect x="112" y="78" width="76" height="16" rx="6" fill="#2dd4a0"/>
<circle cx="120" cy="245" r="12" fill="#f59e0b"/><circle cx="150" cy="245" r="12" fill="#f59e0b"/><circle cx="180" cy="245" r="12" fill="#f59e0b"/>
<circle cx="135" cy="220" r="12" fill="#f59e0b"/><circle cx="165" cy="220" r="12" fill="#f59e0b"/>
<circle cx="150" cy="195" r="12" fill="#f59e0b"/>
<text x="150" y="150" textAnchor="middle" fontSize="22" fontWeight="700" fill="#f4f1fb" fontFamily="sans-serif">6 months</text></svg></figure><p>This pillar asks one question. If his income stopped tomorrow, how long could Aarav run his life calmly, without panic? The more breathing room, the better the score.</p></div>
    <div className="sees"><small>What we look at</small>The safe savings you've set aside, and how long they could carry your everyday life.</div>
  </div>
</section>

<section className="flip" style={{ ['--img' as any]: 'url(/images/score-story/img_9.jpg)' }}>
  <div className="wrap r">
    <div className="kicker"><i className="dot" style={{ ['--c' as any]: '#a855f7' }}></i>Pillar four: Protection</div>
    <h2>A shield for the unexpected</h2>
    <div className="row rev"><p>Aarav has savings. But could one major illness or accident undo years of hard work in a single blow? The Protection pillar exists to answer exactly that.</p><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="Protective shield"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<path d="M150 58 L226 88 L226 150 Q226 212 150 246 Q74 212 74 150 L74 88 Z" fill="#a855f7"/>
<polyline points="118,150 142,174 184,128" fill="none" stroke="#f4f1fb" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/></svg></figure></div>
    <div className="row"><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="Family covered"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<path d="M60 96 Q150 22 240 96" fill="none" stroke="#2dd4a0" strokeWidth="8" strokeLinecap="round"/>
<circle cx="118" cy="128" r="24" fill="#ec4899"/>
<path d="M86 245 Q86 166 118 166 Q150 166 150 245 Z" fill="#ec4899"/>
<circle cx="194" cy="150" r="18" fill="#3b82f6"/>
<path d="M172 245 Q172 190 194 190 Q216 190 216 245 Z" fill="#3b82f6"/>
<path d="M150 72 C150 64 160 60 164 68 C168 60 178 64 178 72 C178 82 164 90 164 90 C164 90 150 82 150 72 Z" fill="#f59e0b"/></svg></figure><p>Here we look at how well Aarav and his family are covered through life and health insurance, and whether that cover truly matches the responsibilities he carries.</p></div>
    <div className="q" style={{ ['--c' as any]: '#a855f7' }}>Building wealth is one skill. Keeping it safe is another.</div>
  </div>
</section>

<section style={{ ['--img' as any]: 'url(/images/score-story/img_10.jpg)' }}>
  <div className="wrap r">
    <div className="kicker"><i className="dot" style={{ ['--c' as any]: 'var(--amber)' }}></i>Pillar five: Investment</div>
    <h2>Money that works for you</h2>
    <div className="row rev"><p>Saving alone isn't enough, because rising prices quietly shrink the value of idle money. Aarav's money has to go to work.</p><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="Money losing value"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<circle cx="110" cy="160" r="60" fill="#f59e0b"/>
<circle cx="110" cy="160" r="44" fill="none" stroke="#120f20" strokeOpacity=".25" strokeWidth="4"/>
<circle cx="230" cy="190" r="26" fill="#f59e0b" fillOpacity=".4"/>
<circle cx="250" cy="130" r="14" fill="#f59e0b" fillOpacity=".2"/>
<path d="M60 268 L240 268" stroke="#ef4444" strokeWidth="5" strokeLinecap="round"/>
<text x="150" y="256" textAnchor="middle" fontSize="16" fill="#ef4444" fontFamily="sans-serif">prices keep rising</text></svg></figure></div>
    <div className="row"><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="Money spread across options"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<g transform="rotate(-90 150 150)">
<circle cx="150" cy="150" r="70" fill="none" stroke="#9333ea" strokeWidth="34" strokeDasharray="120 440"/>
<circle cx="150" cy="150" r="70" fill="none" stroke="#2dd4a0" strokeWidth="34" strokeDasharray="90 440" strokeDashoffset="-122"/>
<circle cx="150" cy="150" r="70" fill="none" stroke="#f59e0b" strokeWidth="34" strokeDasharray="70 440" strokeDashoffset="-214"/>
<circle cx="150" cy="150" r="70" fill="none" stroke="#3b82f6" strokeWidth="34" strokeDasharray="160 440" strokeDashoffset="-286"/>
</g>
<text x="150" y="157" textAnchor="middle" fontSize="18" fontWeight="700" fill="#f4f1fb" fontFamily="sans-serif">spread out</text></svg></figure><p>This pillar looks at whether Aarav invests regularly, and whether his money is spread across different places or sitting in a single basket. Steady, thoughtful investing counts the most here.</p></div>
    <div className="sees"><small>What we look at</small>How consistently you invest, how well it's spread out, and how close it keeps you to your goals.</div>
  </div>
</section>

<section className="flip" style={{ ['--img' as any]: 'url(/images/score-story/img_11.jpg)' }}>
  <div className="wrap r">
    <div className="kicker"><i className="dot"></i>Bringing it together</div>
    <h2>Five pillars become <span className="grad">one number</span></h2>
    <div className="row rev"><p>Now each of Aarav's five pillars has its own score. MoneyMapper brings them together into a single Financial Fitness Score, and it's built so that <b>one weak pillar can't hide behind a strong one.</b></p><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="Five pillars"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<rect x="48" y="130" width="34" height="130" rx="6" fill="#2dd4a0"/>
<rect x="95" y="150" width="34" height="110" rx="6" fill="#ef4444"/>
<rect x="142" y="110" width="34" height="150" rx="6" fill="#3b82f6"/>
<rect x="189" y="95" width="34" height="165" rx="6" fill="#a855f7"/>
<rect x="236" y="120" width="34" height="140" rx="6" fill="#f59e0b"/>
<line x1="36" y1="262" x2="276" y2="262" stroke="#a69fbe" strokeWidth="3"/></svg></figure></div>
    <div className="row"><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="One weak pillar"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<rect x="48" y="90" width="38" height="170" rx="6" fill="#2dd4a0"/>
<rect x="100" y="100" width="38" height="160" rx="6" fill="#2dd4a0"/>
<rect x="152" y="95" width="38" height="165" rx="6" fill="#2dd4a0"/>
<rect x="204" y="200" width="38" height="60" rx="6" fill="#a855f7"/>
<circle cx="223" cy="165" r="0"/>
<circle cx="223" cy="170" r="0"/>
<line x1="36" y1="262" x2="262" y2="262" stroke="#a69fbe" strokeWidth="3"/>
<circle cx="223" cy="150" r="20" fill="#ef4444"/>
<text x="223" y="160" textAnchor="middle" fontSize="28" fontWeight="700" fill="#f4f1fb" fontFamily="sans-serif">!</text></svg></figure><p>If Aarav's income is excellent but his protection is almost nothing, the final score will show it plainly. That's how he knows exactly where to focus.</p></div>
    <div className="bands">
      <div className="band"><i className="dot" style={{ ['--c' as any]: 'var(--red)' }}></i><b>Below 40</b><span>Needs attention</span></div>
      <div className="band"><i className="dot" style={{ ['--c' as any]: 'var(--amber)' }}></i><b>40 to 70</b><span>Room to improve</span></div>
      <div className="band"><i className="dot" style={{ ['--c' as any]: 'var(--green)' }}></i><b>Above 70</b><span>Healthy</span></div>
    </div>
    <div className="row rev"><p>And it isn't a one-time verdict. As Aarav builds better habits, his score moves up month after month.</p><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="Score rising month by month"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<line x1="48" y1="256" x2="262" y2="256" stroke="#a69fbe" strokeWidth="3"/>
<polyline points="62,222 106,200 150,172 194,140 238,102" fill="none" stroke="#2dd4a0" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
<g fill="#2dd4a0" stroke="#150f26" strokeWidth="3">
<circle cx="62" cy="222" r="9"/><circle cx="106" cy="200" r="9"/><circle cx="150" cy="172" r="9"/><circle cx="194" cy="140" r="9"/><circle cx="238" cy="102" r="9"/>
</g></svg></figure></div>
  </div>
</section>

<section style={{ ['--img' as any]: 'url(/images/score-story/img_12.jpg)' }}>
  <div className="wrap r">
    <div className="kicker"><i className="dot" style={{ ['--c' as any]: 'var(--blue)' }}></i>What comes next</div>
    <h2>Score cards: a companion for smart decisions</h2>
    <div className="row"><figure className="fig shot"><img src="/images/score-story/img_13.jpg" alt="MoneyMapper app screenshot" loading="lazy" decoding="async" /></figure><p>Aarav's next questions are "Where should I invest?" and "Which insurance should I pick?" So MoneyMapper also scores the options themselves, helping him decide with understanding instead of guesswork.</p></div>
    <div className="cards">
      <div className="sc" style={{ ['--c' as any]: 'var(--green)' }}><h3>Stock Score</h3><p>Judging large companies by how strong they really are.</p></div>
      <div className="sc" style={{ ['--c' as any]: 'var(--blue)' }}><h3>Mutual Fund Score</h3><p>Spotting the better performers among thousands of funds.</p></div>
      <div className="sc" style={{ ['--c' as any]: '#a855f7' }}><h3>Insurance Score</h3><p>Weighing life and health plans against what you actually need.</p></div>
      <div className="sc" style={{ ['--c' as any]: 'var(--amber)' }}><h3>IPO Score</h3><p>Analysing upcoming IPOs so you don't just follow the crowd.</p></div>
    </div>
    <div className="row rev"><p>Every score follows one idea: look at many aspects together, and give you one clear, simple number.</p><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="Score gauge"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<path d="M60 220 A90 90 0 0 1 240 220" fill="none" stroke="#ef4444" strokeWidth="22" strokeDasharray="113 283"/>
<path d="M60 220 A90 90 0 0 1 240 220" fill="none" stroke="#f59e0b" strokeWidth="22" strokeDasharray="85 283" strokeDashoffset="-113"/>
<path d="M60 220 A90 90 0 0 1 240 220" fill="none" stroke="#2dd4a0" strokeWidth="22" strokeDasharray="85 283" strokeDashoffset="-198"/>
<line x1="150" y1="220" x2="199" y2="171" stroke="#f4f1fb" strokeWidth="6" strokeLinecap="round"/>
<circle cx="150" cy="220" r="9" fill="#f4f1fb"/>
<text x="150" y="262" textAnchor="middle" fontSize="22" fontWeight="700" fill="#f4f1fb" fontFamily="sans-serif">one number</text></svg></figure></div>
  </div>
</section>

<section className="flip" style={{ ['--img' as any]: 'url(/images/score-story/img_14.jpg)' }}>
  <div className="wrap r">
    <h2>What's Aarav's next move?</h2>
    <div className="row"><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="Path forward"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<path d="M60 240 Q120 180 150 150 T240 70" fill="none" stroke="#a69fbe" strokeWidth="4" strokeDasharray="8 9" strokeLinecap="round"/>
<circle cx="60" cy="240" r="11" fill="#2dd4a0"/>
<line x1="240" y1="70" x2="240" y2="26" stroke="#f4f1fb" strokeWidth="4" strokeLinecap="round"/>
<polygon points="240,26 272,38 240,50" fill="#ec4899"/></svg></figure><p>Aarav now knows where he stands, which pillar is weakest, and what to fix first. He's no longer guessing in the dark.</p></div>
    <div className="row rev"><p>What does your number say?</p><figure className="fig"><svg viewBox="0 0 300 300" role="img" aria-label="Look closer at your number"><rect width="300" height="300" fill="#150f26"/><circle cx="150" cy="150" r="118" fill="#1d1733"/>
<circle cx="132" cy="132" r="62" fill="#150f26" stroke="#3b82f6" strokeWidth="12"/>
<line x1="178" y1="178" x2="232" y2="232" stroke="#3b82f6" strokeWidth="16" strokeLinecap="round"/>
<text x="132" y="146" textAnchor="middle" fontSize="48" fontWeight="700" fill="#f4f1fb" fontFamily="sans-serif">52</text></svg></figure></div>
    <Link to="/" className="cta">See your score</Link>
    <p className="note">The characters and situations in this story are only for explanation. MoneyMapper scores and suggestions are for guidance, not investment or insurance advice.</p>
  </div>
</section>

<footer className="story-footer">Your personal money manager</footer>


    </div>
  );
};

export default ScoreStoryPage;
