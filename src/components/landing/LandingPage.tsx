/* ModelOS Source landing page. Plain React markup; the motion is in useLandingMotion.ts and the look in landing.css
   (every rule is scoped under .ml, so nothing here leaks into the workspace).
   The "Go to workspace" buttons call onOpenWorkspace, which opens the workspace view. */
import { memo, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type Lenis from 'lenis';
import './landing.css';
import logoDark from '../../assets/images/landing-logo-dark.webp';
import logoLight from '../../assets/images/landing-logo-light.webp';
import { CUSTOMERS, PEXELS_STREET, ROWS, STATEMENT } from './data';
import { useLandingMotion } from './useLandingMotion';

const vars = (o: Record<string, string | number>) => o as CSSProperties;
const WIDE = '(min-width: 900px)';

export interface LandingPageProps {
  /** Opens the workspace (the data-generation studio). */
  onOpenWorkspace: () => void;
}

const WorkspaceButton = ({ onClick, nav = false }: { onClick: () => void; nav?: boolean }) => (
  <button type="button" className={nav ? 'btn btn--nav' : 'btn'} onClick={onClick}>
    <span className="btn__lbl"><span>Go to workspace</span><span aria-hidden="true">Go to workspace</span></span>
    <i className="btn__sq"></i>
  </button>
);

const Tile = ({ ar, className = '', children }: { ar: string; className?: string; children: ReactNode }) => (
  <figure className={('tile ' + className).trim()} data-ar={ar}>{children}</figure>
);

const Cap = ({ kind, note }: { kind: string; note?: string }) => (
  <figcaption className="tile__cap t-meta"><i></i>{kind}{note && <> <em>{note}</em></>}</figcaption>
);

const Video = ({ src, eager = false }: { src: string; eager?: boolean }) => (
  <video data-src={src} data-eager={eager ? 'true' : undefined} muted playsInline loop></video>
);

// ---------- the three chapters (text + visual), shared by the pinned and the stacked layouts ----------
const TEXTS: ReactNode[] = [
  <>
    <h3 className="t-l">Describe the business. Get the dataset.</h3>
    <p className="t-body mute">Write the scenario in plain language. Agents build the schema, plant the rare cases on purpose, and generate data that has to pass every validation gate before it ships.</p>
    <span className="t-meta mute-3">ModelOS Synthetic Data Generator · Telecom and BFSI today</span>
  </>,
  <>
    <h3 className="t-l">People on the ground, wherever your model will work.</h3>
    <p className="t-body mute">An on-demand global workforce collects and labels images, video, audio and text to your guidelines, then checks every item against your acceptance criteria.</p>
    <span className="t-meta mute-3">Populii Crowd Sourcing Platform</span>
  </>,
  <>
    <h3 className="t-l">The physical world, measured to the centimetre.</h3>
    <p className="t-body mute">LiDAR and imagery from vehicles, drones, helicopters and fixed-wing aircraft, turned into asset, defect and vegetation intelligence for utilities, rail and infrastructure.</p>
    <span className="t-meta mute-3">Altavec · AIMS</span>
  </>,
];

const GenVisual = () => (
  <>
    <div className="gen">
      <p className="gen__brief">Prepaid customers whose balance drops below <mark>₹50</mark>, and whether they top up within <mark>48 hours</mark>.</p>
      <p className="gen__meta t-meta"><span>Telecom · Prepaid</span><span>TM Forum TMF654 · TMF677</span><span>Contract GC-0142 v3</span></p>
      <div className="gen__table">
        <div className="gen__h">
          <span>subscriber</span><span>balance</span><span>hrs since top-up</span><span>channel</span><span>offer shown</span><span>topped up 48h</span>
        </div>
        {ROWS.slice(0, 13).map((r, i) => (
          <div key={r.id + i} className={'gen__r' + (r.edge ? ' edge' : '')} style={vars({ '--i': i })}>
            <span>{r.id}</span><span>₹{r.bal}</span><span>{r.hrs}</span><span>{r.ch}</span><span>{r.of}</span><span>{r.top}</span>
          </div>
        ))}
      </div>
      <div className="gen__foot t-meta"><span><b>312</b> rare cases planted on purpose</span><span><b>0</b> real customers</span></div>
    </div>
    <span className="illus" style={{ color: 'var(--ink)' }}>Illustrative</span>
  </>
);

const ReviewVisual = () => (
  <>
    <div className="col">
      <figure>
        <video data-src="https://videos.pexels.com/video-files/34816958/14761058_1280_720_30fps.mp4" muted playsInline loop></video>
        <Cap kind="Video" note="Street, New Delhi" />
        <div className="review t-meta">
          <span><i style={vars({ '--d': '900ms' })}></i>Reviewer 1</span>
          <span><i style={vars({ '--d': '1400ms' })}></i>Reviewer 2</span>
          <b>Accepted</b>
        </div>
      </figure>
      <figure>
        <img src={PEXELS_STREET} alt="" style={{ objectPosition: '50% 62%' }} />
        <Cap kind="Image" />
        <div className="box" style={vars({ left: '18%', top: '46%', width: '20%', height: '26%', '--d': '300ms' })}></div>
        <div className="tag" style={vars({ left: '40%', top: '40%', '--d': '500ms' })}>
          <span className="indic" lang="hi">बस</span><span className="indic" lang="ta">பேருந்து</span><span className="indic" lang="bn">বাস</span>
          <small>Label · 3 languages</small>
        </div>
      </figure>
      <figure>
        <video data-src="https://videos.pexels.com/video-files/13283745/13283745-sd_960_540_25fps.mp4" muted playsInline loop></video>
        <canvas data-wave></canvas>
        <Cap kind="Audio" note="Speech · Tamil" />
      </figure>
    </div>
    <span className="illus" style={{ color: 'var(--paper)' }}>Illustrative</span>
  </>
);

const FieldVisual = () => (
  <>
    <div className="cap3">
      <canvas data-lidar="stage" aria-label="LiDAR fly-through of a transmission corridor, with vegetation inside the clearance zone highlighted"></canvas>
      <dl className="hud t-meta">
        <dt>Capture</dt><b>Helicopter LiDAR</b>
        <dt>Network</dt><b>Transmission, 3 spans</b>
        <dt>Inside clearance</dt><b className="sig" data-enc>—</b>
      </dl>
    </div>
    <span className="illus" style={{ color: 'var(--paper)' }}>Illustrative</span>
  </>
);

const VISUALS: Array<{ body: ReactNode; bg?: string }> = [
  { body: <GenVisual />, bg: 'var(--paper-2)' },
  { body: <ReviewVisual /> },
  { body: <FieldVisual />, bg: '#0E0E0F' },
];

const TITLES = ['Generated from a scenario', 'Collected by people', 'Captured from the field'];

const PRINCIPLES: Array<[string, string]> = [
  ['Grounded in standards', 'Telecom data follows TM Forum. Banking data follows BIAN, FIBO, BCBS 239 and ISO 20022. New industries arrive as Domain Packs.'],
  ['Held back if it’s wrong', 'A row that breaks a type, dependency, formula, time or domain rule never ships. Validation runs before delivery.'],
  ['Signed off by people', 'AI proposes the scenario. Business, product, architecture and delivery reviewers approve the Generation Contract.'],
  ['Rebuilt on demand', 'Every dataset traces back to a versioned contract, so you can regenerate the same rows and explain any value.'],
];

const FIGURES: Array<{ to: number; dec?: number; sup: string; label: string }> = [
  { to: 200, sup: 'k+', label: 'km of LiDAR captured, processed and analysed' },
  { to: 1.1, dec: 1, sup: 'M', label: 'high-resolution asset images' },
  { to: 8.99, dec: 2, sup: 'M', label: 'panoramic images in AIMS 3D' },
  { to: 115, sup: 'K', label: 'km of oblique helicopter imagery' },
];

const LandingPageView = ({ onOpenWorkspace, wide }: LandingPageProps & { wide: boolean }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  useLandingMotion(rootRef, wide, lenisRef);

  const toTop = () => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="ml" ref={rootRef}>
      <header className="nav" data-nav>
        <button type="button" className="nav__brand" onClick={toTop} aria-label="ModelOS Source, powered by Tech Mahindra">
          <img className="nav__logo nav__logo--dark" src={logoDark} alt="" width={720} height={143} />
          <img className="nav__logo nav__logo--light" src={logoLight} alt="" width={720} height={143} />
        </button>
        <WorkspaceButton nav onClick={onOpenWorkspace} />
      </header>

      <main>
        <section className="hero grain" data-theme="dark" data-hero>
          <div className="hero__stage">
            <p className="hero__label t-meta"><i></i>Generate, collect and capture data for AI</p>
            <h1 className="sr">Source the data your AI is missing.</h1>
            <div className="t-hero hero__line" aria-hidden="true"><span>Source the data</span></div>
            <div className="hero__window" data-ribbon-window>
              <div className="ribbon fill" data-ribbon>
                <Tile ar=".98" className="tile--rows">
                  <Cap kind="Tabular" note="Synthetic" />
                  <div className="rows" data-rows>
                    <div className="rows__track">
                      {[0, 1].map((k) => ROWS.map((r, i) => (
                        <div key={k + '-' + i} className={'rows__r' + (r.edge ? ' edge' : '')} aria-hidden={k ? true : undefined}>
                          <span>{r.id}</span><span>₹{r.bal}</span><span>{r.top === 'never' ? 'never' : r.hrs + 'h'}</span>
                        </div>
                      )))}
                    </div>
                  </div>
                </Tile>
                <Tile ar=".82" className="tile--words">
                  <Cap kind="Text" note="3 languages" />
                  <ul>
                    <li><b className="indic" lang="hi">किराना स्टोर</b><span>HI</span></li>
                    <li><b className="indic" lang="ta">மளிகைக் கடை</b><span>TA</span></li>
                    <li><b className="indic" lang="bn">মুদির দোকান</b><span>BN</span></li>
                  </ul>
                </Tile>
                <Tile ar=".74">
                  <img src={PEXELS_STREET} alt="Buses, cars and pedestrians on a busy street in Kolkata" />
                  <Cap kind="Image" note="Street, Kolkata" />
                </Tile>
                <Tile ar=".86" className="tile--audio tile--dim">
                  <Video src="https://videos.pexels.com/video-files/13283745/13283745-sd_960_540_25fps.mp4" eager />
                  <canvas data-wave></canvas>
                  <Cap kind="Audio" note="Speech" />
                </Tile>
                <Tile ar="1.42" className="tile--dim">
                  <Video src="https://videos.pexels.com/video-files/34816958/14761057_960_540_30fps.mp4" eager />
                  <Cap kind="Video" note="Street, New Delhi" />
                </Tile>
                <Tile ar="1.3">
                  <canvas data-lidar="tile" aria-label="Animated LiDAR point cloud of a transmission corridor"></canvas>
                  <Cap kind="LiDAR" note="Point cloud" />
                </Tile>
                <Tile ar="1.5" className="tile--dim">
                  <Video src="https://videos.pexels.com/video-files/4609536/4609536-sd_960_540_24fps.mp4" eager />
                  <Cap kind="Video" note="Aerial survey" />
                </Tile>
                <Tile ar="1.1" className="tile--dim">
                  <Video src="https://videos.pexels.com/video-files/4907961/4907961-sd_960_540_30fps.mp4" eager />
                  <Cap kind="Video" note="Rail corridor" />
                </Tile>
              </div>
              <div className="hero__veil"></div>
              <div className="hero__over">
                <h2 className="t-l">Every format your models learn from.</h2>
                <p className="t-meta mute">Video · Image · Text · LiDAR · Tabular · Audio</p>
              </div>
            </div>
            <div className="t-hero hero__line" aria-hidden="true"><span>your AI is missing.</span></div>
          </div>
          <div className="hero__foot">
            <p className="hero__lede">Generate it from a business scenario, collect it with people on the ground, or capture it from the air. <b>ModelOS Source brings in whatever your next model needs to learn.</b></p>
            <div className="hero__act"><WorkspaceButton onClick={onOpenWorkspace} /></div>
            <p className="hero__cap t-meta">Three ways in<br /><b>Synthetic Data Generator · Populii · Altavec</b></p>
          </div>
        </section>

        <section className="s-light statement" data-theme="light">
          <div className="wrap grid">
            <span className="statement__k" aria-hidden="true"></span>
            <p className="statement__p t-xl" data-lit>
              {STATEMENT.split(/(\s+)/).map((part, i) => (/^\s+$/.test(part) || part === '' ? part : <span className="w" key={i}>{part}</span>))}
            </p>
          </div>
        </section>

        <section className={'s-light chapters' + (wide ? '' : ' is-static')} data-theme="light" data-chapters>
          <div className="chapters__pin">
            {wide ? (
              <>
                <div className="chapters__rail">
                  <ol className="chapters__index">
                    {TITLES.map((t, i) => <li key={t}><span className="t-meta">{'0' + (i + 1)}</span><b>{t}</b></li>)}
                  </ol>
                  <div className="chapters__texts">
                    {TEXTS.map((t, i) => <div className="ch-text" key={i}>{t}</div>)}
                  </div>
                </div>
                <div className="chapters__stage">
                  {VISUALS.map((v, i) => <div className="ch-visual" key={i} style={v.bg ? { background: v.bg } : undefined}>{v.body}</div>)}
                </div>
              </>
            ) : (
              TEXTS.map((t, i) => (
                <div className="ch-block" key={i}>
                  <div className="ch-text is-active">{t}</div>
                  <div className="ch-frame">
                    <div className="ch-visual" style={vars({ '--lp': 1, ...(VISUALS[i].bg ? { background: VISUALS[i].bg as string } : {}) })}>{VISUALS[i].body}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="s-light sec prin-sec" data-theme="light">
          <div className="wrap prin">
            <div className="prin__head">
              <h2 className="t-xxl" data-reveal>Synthetic, never made up.</h2>
              <p className="t-body mute" style={{ marginTop: '28px', maxWidth: '36ch' }} data-fade>Generated data earns trust the same way real data does: you can see where every value came from.</p>
            </div>
            <ol className="prin__list">
              {PRINCIPLES.map(([h, p], i) => (
                <li className="prin__item" key={h}>
                  <span className="t-meta mute-3">{'0' + (i + 1)}</span>
                  <div><h3 className="t-m">{h}</h3><p className="t-body mute">{p}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="film s-dark" data-theme="dark" data-film>
          <div className="film__sticky">
            <div className="film__frame">
              <video data-src="https://videos.pexels.com/video-files/6112549/6112549-hd_1920_1080_30fps.mp4" muted playsInline loop></video>
              <div className="film__copy">
                <blockquote className="t-xl">Twenty thousand days of people walking the network, removed.</blockquote>
                <p className="t-meta">Altavec for Sydney Trains<br />Measurement and inspection digital twin</p>
              </div>
            </div>
          </div>
        </section>

        <section className="s-dark sec" data-theme="dark">
          <div className="wrap grid">
            <h2 className="alt__head t-xxl" data-reveal>Out in the field, today.</h2>
            <p className="alt__note t-body mute" data-fade>Altavec already captures the physical world for utilities, rail and infrastructure owners. The same data can now feed your models.</p>
          </div>
          <div className="wrap">
            <div className="figs">
              {FIGURES.map((f) => (
                <div className="fig" key={f.label}>
                  <b><span data-count={f.to} data-dec={f.dec}>{f.to.toLocaleString('en-US', { minimumFractionDigits: f.dec ?? 0, maximumFractionDigits: f.dec ?? 0 })}</span><sup>{f.sup}</sup></b>
                  <span className="t-body mute">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="custs">
            <div className="wrap" style={{ marginBottom: '18px' }}><p className="t-meta mute-3">Altavec customers</p></div>
            <div className="marquee" style={vars({ '--mq-dur': '70s' })}>
              <div className="marquee__track">
                {[0, 1].map((k) => CUSTOMERS.map((c) => <span key={k + c} aria-hidden={k ? true : undefined}>{c}</span>))}
              </div>
            </div>
          </div>
        </section>

        <section className="s-dark cta grain" data-theme="dark" id="start">
          <div className="wrap grid">
            <h2 className="t-xxl" data-reveal>Start with one scenario.</h2>
            <div className="cta__act" data-fade>
              <WorkspaceButton onClick={onOpenWorkspace} />
              <a className="link" href="mailto:modelos@techmahindra.com">Talk to the team</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="s-dark foot" data-theme="dark">
        <img className="foot__logo" src={logoDark} alt="ModelOS Source, powered by Tech Mahindra" width={720} height={143} />
        <p className="t-meta mute-3">© 2026 Tech Mahindra</p>
      </footer>
    </div>
  );
};

const View = memo(LandingPageView);

/** Chooses the pinned (wide) or stacked layout from the window width, and follows it when the window is resized across 900px. */
export const LandingPage = ({ onOpenWorkspace }: LandingPageProps) => {
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches);
  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    on();
    return () => mq.removeEventListener('change', on);
  }, []);
  // A stable callback, so the page does not re-render every time the app does.
  const latest = useRef(onOpenWorkspace);
  latest.current = onOpenWorkspace;
  const open = useCallback(() => latest.current(), []);
  return <View onOpenWorkspace={open} wide={wide} />;
};

export default LandingPage;
