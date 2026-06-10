import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Golf Links Network LLC collects, uses, and shares personal information through Fairway Founders Network.',
};

const LAST_UPDATED = 'June 10, 2026';

export default function PrivacyPage() {
  return (
    <main className="px-6 py-12 md:py-16 max-w-3xl mx-auto w-full">
      <Link href="/" className="text-xs text-[color:var(--color-gold)]">
        ← Home
      </Link>

      <header className="mt-6 border-b border-[color:#e8e2d2] pb-6">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--color-mute)]">
          Legal
        </p>
        <h1
          className="mt-3 text-4xl md:text-5xl leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Privacy Policy
        </h1>
        <p className="mt-3 text-xs text-[color:var(--color-mute)]">
          Last updated {LAST_UPDATED}
        </p>
        <p className="mt-3 text-xs text-[color:#5a5a4a]">
          Operator: <strong>Golf Links Network LLC</strong>, a Florida limited
          liability company, doing business as <em>Fairway Founders Network</em>.
          Notice address: 5620 Tara Blvd, Ste 101A, Bradenton, FL 34203.
        </p>
      </header>

      <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-[color:#2a2a22]">
        <Section n="1" title="Read this first">
          <p className="uppercase font-semibold text-[color:var(--color-ink)] tracking-wide">
            Fairway Founders operates a public-facing networking platform. We
            collect personal information from you and we share it publicly. If
            you do not want your information shared publicly, do not use the
            Service.
          </p>
          <p>
            This Policy explains what we collect, why, with whom, and what
            limited controls you have. This Policy is part of our{' '}
            <Link
              href="/terms"
              className="text-[color:var(--color-gold)] underline"
            >
              Terms of Service
            </Link>
            . Capitalized terms used without definition have the meanings given
            in the Terms.
          </p>
        </Section>

        <Section n="2" title="Who this Policy applies to">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Members (signed-up users)</li>
            <li>Visitors to our website</li>
            <li>
              People who interact with our sponsors through links we provide
            </li>
          </ul>
        </Section>

        <Section n="3" title="Information you give us">
          <p>
            We collect information you submit when you sign up, complete your
            profile, RSVP for events, interact with other Members, post
            broadcasts, or contact us. This includes:
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              <strong>Identity:</strong> name, email, phone number (if
              provided), photo.
            </li>
            <li>
              <strong>Profile:</strong> company, professional role, bio,
              handicap, &ldquo;can help with&rdquo; tags, links.
            </li>
            <li>
              <strong>Activity:</strong> RSVPs, attendance, scores, group
              history, messages, notifications, feedback you submit.
            </li>
            <li>
              <strong>Payment-related identifiers:</strong> name on card,
              billing email, transaction confirmations. We do not store full
              card numbers &mdash; see §4.
            </li>
            <li>
              <strong>Communications:</strong> anything you send to us at our
              contact email.
            </li>
          </ul>
        </Section>

        <Section n="4" title="Information we collect automatically">
          <p>When you use the Service we automatically collect:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              <strong>Device and connection:</strong> IP address, browser type,
              operating system, device identifiers, time zone, language.
            </li>
            <li>
              <strong>Usage:</strong> pages viewed, links clicked, features
              used, session duration.
            </li>
            <li>Cookies and local storage (see §7).</li>
            <li>Sponsor link clicks (see §7c).</li>
          </ul>
          <p>
            We do <strong>not</strong> collect or store full payment-card
            numbers. Card data is handled directly by our payment processor and
            is subject to their privacy policy.
          </p>
        </Section>

        <Section n="5" title="How we use your information">
          <p>We use it to:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Operate, maintain, and improve the Service.</li>
            <li>Build foursomes, assign holes and carts, run the leaderboard.</li>
            <li>
              Display your profile and activity to other Members and the
              public.
            </li>
            <li>
              Communicate with you (operational notices, broadcasts, reminders,
              responses to inquiries).
            </li>
            <li>Process payments through our payment processor.</li>
            <li>
              Detect and respond to fraud, abuse, security incidents, and rule
              violations.
            </li>
            <li>Analyze Member, sponsor, and event engagement.</li>
            <li>
              Use, sublicense, publish, and distribute your content as
              described in Terms §5.
            </li>
            <li>Comply with legal obligations.</li>
          </ul>
        </Section>

        <Section n="6" title="How we share your information">
          <p>
            We share it broadly, by design. You acknowledge that we may share
            your information:
          </p>
          <SubSection title="(a) With other Members">
            Profile information, RSVPs, scores, group history, and broadcasts
            you post are visible to other Members.
          </SubSection>
          <SubSection title="(b) Publicly">
            Profile information may be displayed on public pages of the
            Service, in marketing materials, on social media, and on sponsor
            materials. We may continue to use and display content you submitted
            even after your membership ends.
          </SubSection>
          <SubSection title="(c) With sponsors">
            We may share Member rosters, engagement reports, event attendance,
            and aggregated or individual click data with sponsors in connection
            with our sponsorship relationships.
          </SubSection>
          <SubSection title="(d) With sub-processors">
            We use third-party vendors that process data on our behalf. See §8
            for the current list. We may add, change, or remove sub-processors
            at any time. Each operates under its own privacy policy.
          </SubSection>
          <SubSection title="(e) With our payment processor">
            When we add in-app payments we will share billing data with a
            payment processor under its privacy policy.
          </SubSection>
          <SubSection title="(f) With AI providers">
            As described in Terms §10, we use AI tools that may process your
            information.
          </SubSection>
          <SubSection title="(g) For legal reasons">
            We may disclose information when required by law, subpoena, court
            order, or regulatory request, or when we believe disclosure is
            necessary to protect our rights, your safety, or the safety of
            others.
          </SubSection>
          <SubSection title="(h) In a corporate transaction">
            If we are acquired, merged, or restructured, your information may
            be transferred to the new operator.
          </SubSection>
          <p className="uppercase font-semibold text-[color:var(--color-ink)] tracking-wide">
            We do not sell your personal information for money. The disclosures
            above, including to sponsors, may constitute &ldquo;sharing&rdquo;
            or &ldquo;selling&rdquo; under certain state laws (such as the
            California Consumer Privacy Act). See §13 for state-specific
            rights.
          </p>
        </Section>

        <Section n="7" title="Cookies, analytics, and click tracking">
          <SubSection title="(a) Cookies and local storage">
            We and our service providers use cookies, local storage, and
            similar technologies for sign-in, preferences, security, and
            analytics. You can disable cookies in your browser, but parts of
            the Service will stop working if you do.
          </SubSection>
          <SubSection title="(b) Analytics">
            We may use analytics tools to measure how the Service is used.
          </SubSection>
          <SubSection title="(c) Sponsor link clicks">
            When you click a link to a sponsor &mdash; whether from the public
            sponsor grid, a Member-facing page, or a notification &mdash; we
            record the click (sponsor, link type, your account if signed in,
            timestamp) and use that data to report engagement to sponsors and
            to prioritize future placements. Sponsors may receive your
            individual click data, or aggregated data, at our discretion.
          </SubSection>
        </Section>

        <Section n="8" title="Sub-processors we currently use">
          <p>
            The following vendors process personal information on our behalf:
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              <strong>Clerk</strong> (clerk.com) &mdash; authentication,
              sign-in, account management.
            </li>
            <li>
              <strong>Supabase</strong> (supabase.com) &mdash; database storage
              and backend infrastructure.
            </li>
            <li>
              <strong>Vercel</strong> (vercel.com) &mdash; application hosting,
              serverless compute, log collection.
            </li>
          </ul>
          <p>
            We may add other sub-processors at any time without prior notice.
            The list above will be updated periodically. Each sub-processor
            operates under its own terms and privacy practices.
          </p>
        </Section>

        <Section n="9" title="Information from other sources">
          <p>
            If another Member shares information about you (for example, by
            tagging or mentioning you in a broadcast), we may receive and store
            that information.
          </p>
        </Section>

        <Section n="10" title="AI processing">
          <p>
            As stated in Terms §10, we use AI to operate and improve the
            Service. This may include AI processing of your profile, messages,
            group history, and other Member data. AI service providers process
            data under their own terms.
          </p>
        </Section>

        <Section n="11" title="Data retention">
          <p>
            We retain Member information for as long as we believe it is
            useful, including indefinitely. Public content you have submitted
            (profile, broadcasts, scores) may be retained, displayed, and used
            after your membership ends, consistent with the license you granted
            in Terms §5. Operational logs, sponsor click data, billing
            identifiers, and other records may be retained as long as we
            believe necessary for security, legal compliance, accounting, fraud
            prevention, or business records.
          </p>
        </Section>

        <Section n="12" title="Security">
          <p>
            We take reasonable technical and organizational measures to protect
            information against unauthorized access, alteration, disclosure,
            and destruction. No system is perfectly secure. You use the Service
            at your own risk. If we become aware of a security incident that we
            believe affects your personal information, we will notify you as
            required by applicable law.
          </p>
        </Section>

        <Section n="13" title="Your choices and rights">
          <SubSection title="(a) Profile editing">
            You can edit most profile fields from your account settings.
          </SubSection>
          <SubSection title="(b) Account deletion">
            <span>
              You can request deletion of your account by emailing the address
              in §17. Deletion of your account does <strong>not</strong>{' '}
              delete: (i) public content you submitted that we have already
              published, copied, or shared; (ii) records we are required to
              retain for legal, accounting, security, or audit purposes; (iii)
              anonymized or aggregated data; (iv) content other Members have
              screenshotted, copied, or re-shared.
            </span>
          </SubSection>
          <SubSection title="(c) Marketing communications">
            You can opt out of non-essential marketing emails by following the
            unsubscribe link in any such email. Operational and transactional
            messages (account, billing, events, security) cannot be opted out
            of while your account is active.
          </SubSection>
          <SubSection title="(d) California residents">
            The California Consumer Privacy Act (CCPA) and California Privacy
            Rights Act (CPRA) may give you the right to: know what personal
            information we have collected about you, request deletion, request
            correction, and limit certain uses of &ldquo;sensitive personal
            information.&rdquo; To exercise these rights, contact us at the
            address in §17. We will verify your identity before responding.
            You may also designate an authorized agent. We do not sell personal
            information for money. To the extent any of our sharing &mdash;
            including with sponsors &mdash; qualifies as &ldquo;sharing&rdquo;
            under the CCPA/CPRA, you may opt out by emailing us at the address
            in §17 with the subject line &ldquo;Do Not Share.&rdquo;
          </SubSection>
          <SubSection title="(e) Other states">
            Residents of Virginia, Colorado, Connecticut, Utah, and other
            states with comprehensive privacy laws may have similar rights.
            Contact us to exercise them.
          </SubSection>
          <SubSection title="(f) Right-of-publicity">
            You acknowledge in Terms §5 and §13 that we may use your name,
            voice, and likeness in marketing and sponsorship materials. You may
            withdraw consent prospectively by emailing the address in §17;
            previously distributed materials are not affected.
          </SubSection>
        </Section>

        <Section n="14" title="International users">
          <p>
            Fairway Founders is operated from and intended for users in the
            United States. We do not target the Service to residents of the
            European Economic Area, the United Kingdom, or any other
            jurisdiction with specific data-protection regimes. If you access
            the Service from outside the United States, you do so at your own
            risk, and you consent to your information being processed and
            stored in the United States.
          </p>
        </Section>

        <Section n="15" title="Children">
          <p>
            The Service is not directed to anyone under 18. We do not knowingly
            collect information from anyone under 18. If we discover such
            information, we will delete it.
          </p>
        </Section>

        <Section n="16" title="Changes to this Policy">
          <p>
            We may update this Policy at any time. Material changes will be
            communicated through the Service or by email. The &ldquo;Last
            updated&rdquo; date at the top of this Policy reflects the most
            recent revision. Your continued use after a change constitutes
            acceptance.
          </p>
        </Section>

        <Section n="17" title="Contact">
          <p>
            Privacy questions, deletion requests, and opt-out requests:
          </p>
          <p>
            <a
              href="mailto:hello@fairwayfounders.org"
              className="text-[color:var(--color-gold)] underline"
            >
              hello@fairwayfounders.org
            </a>
          </p>
          <p>
            Golf Links Network LLC
            <br />
            5620 Tara Blvd, Ste 101A
            <br />
            Bradenton, FL 34203
          </p>
        </Section>
      </div>

      <div className="mt-16 pt-6 border-t border-[color:#e8e2d2] text-center">
        <Link href="/" className="text-xs text-[color:var(--color-gold)]">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className="text-xl md:text-2xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <span className="text-[color:var(--color-gold)]">{n}.</span>{' '}
        <span>{title}</span>
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[color:#2a2a22]">
        {children}
      </div>
    </section>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <p>
      <strong className="text-[color:var(--color-ink)]">{title}.</strong>{' '}
      {children}
    </p>
  );
}
