import styles from './page.module.css';

export const metadata = {
  title: 'StoneBridge Capital Distribution | Distribution Partner Growth for Private Funds',
  description:
    'StoneBridge helps private fund managers clarify the partner offer, build partner-facing materials, and create the outreach infrastructure needed to recruit and activate distribution partners.',
};

const engagementTracks = [
  {
    label: 'Track 01',
    title: 'Partner Offer Diagnosis',
    body:
      'We isolate the actual bottleneck: unclear economics, weak partner positioning, unusable materials, or no repeatable path to recruit capital partners.',
    outcome: 'Diagnose',
  },
  {
    label: 'Track 02',
    title: 'Distribution Readiness Buildout',
    body:
      'We turn the offer into something a third-party partner can understand quickly: messaging, partner deck, one-pager, FAQ, diligence framing, and objection handling.',
    outcome: 'Package',
  },
  {
    label: 'Track 03',
    title: 'Partner Activation System',
    body:
      'We build the outreach layer to recruit aligned RIAs, capital aggregators, family-office networks, syndicators, and other distribution channels that fit the mandate.',
    outcome: 'Activate',
  },
];

const deliverables = [
  'Partner-channel audit of your current fund, FoF, or co-GP offer',
  'Sharper positioning around who the partner is, why they care, and how the economics work',
  'Partner-facing deck, one-pager, FAQ, and outreach copy',
  'Target list structure for the partner types most likely to place the strategy',
  'A repeatable first-touch workflow for partner recruitment and follow-up',
];

const fitSignals = [
  'You have a real fund, live pipeline, or credible operating track record.',
  'The issue is not product-market fit inside the deal. It is capital distribution outside the deal.',
  'You want more than introductions. You need a distribution channel that can be explained, sold, and repeated.',
];

const notFitSignals = [
  'You need legal advice, broker-dealer services, or securities placement activity.',
  'You do not yet have enough operating proof, track record, or investment clarity to support a partner channel.',
  'You want vague brand work instead of a commercial partner-acquisition system.',
];

export default function HomePage() {
  return (
    <main className={styles.pageShell}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.brandBlock}>
            <div className={styles.logoMark}>SB</div>
            <div>
              <p className={styles.wordmark}>StoneBridge Capital Distribution</p>
              <p className={styles.brandSubline}>Distribution Partner Growth for Private Funds</p>
            </div>
          </div>
          <a
            className={styles.headerLink}
            href="mailto:somton@jhu.edu?subject=Distribution%20Partner%20Sprint"
          >
            Start a Conversation
          </a>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Productized Service For Fund Managers</p>
            <h1>
              The likely bottleneck is not the fund.
              <span> It is the partner channel.</span>
            </h1>
            <p className={styles.heroText}>
              StoneBridge helps private fund managers make a FoF, co-GP, or distribution-partner model easier for the
              right capital partners to understand, trust, and place.
            </p>
            <p className={styles.heroText}>
              The work is practical: sharpen the partner offer, build partner-facing materials, and create the outreach
              infrastructure needed to recruit and activate distribution partners.
            </p>
            <div className={styles.ctaRow}>
              <a
                className={styles.ctaPrimary}
                href="mailto:somton@jhu.edu?subject=Distribution%20Partner%20Sprint&body=I%20want%20to%20discuss%20a%20distribution%20partner%20growth%20engagement."
              >
                Book the Diagnostic
              </a>
              <a className={styles.ctaSecondary} href="#engagement">
                See the Engagement
              </a>
            </div>
          </div>

          <aside className={styles.heroCard}>
            <p className={styles.cardLabel}>Built For</p>
            <ul className={styles.cardList}>
              <li>Real estate sponsors and private fund managers</li>
              <li>Operators with a credible track record but uneven distribution</li>
              <li>Teams trying to recruit capital partners without sounding vague</li>
            </ul>
            <div className={styles.cardDivider} />
            <p className={styles.cardLabel}>Typical Trigger</p>
            <p className={styles.cardBody}>
              “We have the strategy and track record. We need the right partners to understand the model, trust the
              economics, and bring capital.”
            </p>
          </aside>
        </section>

        <section className={styles.statStrip}>
          <article className={styles.stat}>
            <div className={styles.statValue}>3</div>
            <div className={styles.statLabel}>Core workstreams</div>
          </article>
          <article className={styles.stat}>
            <div className={styles.statValue}>5</div>
            <div className={styles.statLabel}>Primary deliverables</div>
          </article>
          <article className={styles.stat}>
            <div className={styles.statValue}>1</div>
            <div className={styles.statLabel}>Commercial message partners can repeat</div>
          </article>
          <article className={styles.stat}>
            <div className={styles.statValue}>0</div>
            <div className={styles.statLabel}>Tolerance for fuzzy “partnership” language</div>
          </article>
        </section>

        <section id="engagement" className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>The Engagement</p>
            <h2>A productized service, not generic consulting</h2>
            <p className={styles.sectionText}>
              This is designed for fund managers who need a clearer partner offer and a more repeatable distribution
              channel. The goal is to turn a vague fundraising conversation into a usable commercial system.
            </p>
          </div>

          <div className={styles.trackGrid}>
            {engagementTracks.map((track) => (
              <article key={track.title} className={styles.trackCard}>
                <p className={styles.trackLabel}>{track.label}</p>
                <h3>{track.title}</h3>
                <p>{track.body}</p>
                <span className={styles.trackOutcome}>{track.outcome}</span>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>Deliverables</p>
            <h2>What the buyer actually gets</h2>
          </div>

          <div className={styles.deliverablePanel}>
            {deliverables.map((item, index) => (
              <div key={item} className={styles.deliverableRow}>
                <span className={styles.deliverableIndex}>{String(index + 1).padStart(2, '0')}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.sectionSplit}>
          <article className={styles.fitPanel}>
            <p className={styles.sectionLabel}>Good Fit</p>
            <h2>If these are true, this will likely help</h2>
            <ul className={styles.signalList}>
              {fitSignals.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className={styles.fitPanel}>
            <p className={styles.sectionLabel}>Not The Right Fit</p>
            <h2>This is not placement work in disguise</h2>
            <ul className={styles.signalList}>
              {notFitSignals.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>Offer Language</p>
            <h2>The promise in one sentence</h2>
          </div>

          <blockquote className={styles.quote}>
            I help private fund managers recruit and enable distribution partners by clarifying the partner offer,
            building the materials, and setting up the outreach needed to grow capital channels.
          </blockquote>
        </section>

        <section className={styles.finalPanel}>
          <div>
            <p className={styles.sectionLabel}>Next Step</p>
            <h2>Use this if distribution is the actual constraint</h2>
            <p className={styles.sectionText}>
              If the fund is real but the partner channel is vague, slow, or hard to explain, the next move is not
              another broad fundraising conversation. It is a sharper offer and a cleaner path to partner activation.
            </p>
          </div>
          <div className={styles.finalActions}>
            <a
              className={styles.ctaPrimary}
              href="mailto:somton@jhu.edu?subject=Distribution%20Partner%20Growth%20Inquiry"
            >
              Contact StoneBridge
            </a>
            <p className={styles.actionNote}>Email: somton@jhu.edu</p>
          </div>
        </section>
      </div>
    </main>
  );
}
