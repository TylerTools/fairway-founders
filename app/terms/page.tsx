import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The Terms of Service governing membership in Fairway Founders Network, operated by Golf Links Network LLC.',
};

const LAST_UPDATED = 'June 10, 2026';

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-3 text-xs text-[color:var(--color-mute)]">
          Last updated {LAST_UPDATED}
        </p>
        <p className="mt-3 text-xs text-[color:#5a5a4a]">
          Operator: <strong>Golf Links Network LLC</strong>, a Florida limited
          liability company, doing business as <em>Fairway Founders Network</em>.
          Principal office: 5620 Tara Blvd, Ste 101A, Bradenton, FL 34203.
        </p>
      </header>

      <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-[color:#2a2a22]">
        <Section n="1" title="Agreement">
          <p>
            By creating an account, paying any fee, attending any event, or
            otherwise using Fairway Founders Network (&ldquo;Fairway Founders,&rdquo;
            &ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;), you
            (&ldquo;you,&rdquo; &ldquo;Member&rdquo;) agree to these Terms of
            Service (&ldquo;Terms&rdquo;) and our Privacy Policy. If you do not
            agree, do not use the Service.
          </p>
        </Section>

        <Section n="2" title="Who we are">
          <p>
            Fairway Founders is a private member-organized golf and networking
            group. We facilitate weekly golf rounds and networking opportunities.
            We are not a country club, a course owner or operator, a financial
            institution, a money transmitter, or an insurer. We are a coordinator
            and a software platform.
          </p>
        </Section>

        <Section n="3" title="Eligibility">
          <p>
            You must be at least 18 years old and legally capable of entering
            binding contracts. We may require identity verification. We may deny
            membership for any reason consistent with applicable law.
          </p>
        </Section>

        <Section n="4" title="Membership is a privilege; we may remove you at any time">
          <p>
            Membership is granted at our sole discretion. We may suspend,
            restrict, or terminate your account, revoke event invitations, and
            withhold any fees already paid, at any time, for any reason or no
            reason, with or without notice, subject to applicable law. To the
            maximum extent permitted by law, you waive any claim arising from
            termination of your membership.
          </p>
        </Section>

        <Section n="5" title="No privacy expectation; you grant us broad rights to your content">
          <p>
            Fairway Founders operates as a public-facing networking platform.
            <strong className="text-[color:var(--color-ink)]">
              {' '}
              Anything you submit &mdash; including your name, photo, bio,
              company, role, links, RSVPs, messages, scores, and any other
              information &mdash; may be displayed publicly, shared with members,
              shared with sponsors and partners, used in marketing and
              promotional materials, or otherwise distributed at our sole
              discretion.{' '}
            </strong>
            Do not submit anything you wish to keep confidential.
          </p>
          <p>
            You grant Fairway Founders a perpetual, irrevocable, worldwide,
            royalty-free, fully sublicensable license to use, reproduce,
            distribute, display, modify, translate, publish, and create
            derivative works of any content you submit, for any purpose, in any
            medium now known or later developed. This license survives
            termination of your membership.
          </p>
          <p>
            You represent that you own or have all necessary rights to any
            content you submit and that it does not infringe any third
            party&rsquo;s rights, and you indemnify us against any claim to the
            contrary.
          </p>
        </Section>

        <Section n="6" title="Events; assumption of risk; release">
          <p>
            Golf and on-course activities involve inherent risks, including but
            not limited to: being struck by golf balls or clubs, falls, slips,
            heat exhaustion, dehydration, lightning, motor-vehicle and golf-cart
            accidents, collisions with other participants, and interactions with
            course staff, animals, weather, and the general public.
          </p>
          <p className="uppercase font-semibold text-[color:var(--color-ink)] tracking-wide">
            By participating in any event, you expressly assume all such risks,
            including those not foreseeable.
          </p>
          <p className="uppercase font-semibold text-[color:var(--color-ink)] tracking-wide">
            To the maximum extent permitted by law, you release Fairway
            Founders, its owners, operators, employees, agents, admins, and
            other members from all claims, demands, liabilities, and causes of
            action for personal injury, death, property damage, or any other
            harm arising from your participation, whether caused by negligence
            or otherwise.
          </p>
          <p>
            The golf courses we play are operated by independent third parties.
            We do not own, control, or maintain them. Any claim arising from
            course conditions, equipment, staff conduct, alcohol service, or
            anything occurring on course premises is between you and the course
            operator.
          </p>
        </Section>

        <Section n="7" title="Payments; subscription; no refunds">
          <SubSection title="(a) Fees">
            Membership and event fees are as disclosed at signup or checkout.
            Fees may include in-app subscription charges and/or separate fees
            paid directly to a golf course or vendor.
          </SubSection>
          <SubSection title="(b) Third-party processors">
            We use a third-party payment processor. You agree to the
            processor&rsquo;s terms when you transact. Fairway Founders is not
            a party to the financial transaction once it is processed and is
            not responsible for processor errors, outages, fraud, chargebacks,
            or any dispute between you and the processor or your card issuer.
          </SubSection>
          <SubSection title="(c) Direct payments to vendors">
            Payments you make directly to a golf course, pro shop, or other
            vendor are between you and that vendor. Fairway Founders is not a
            party to those transactions.
          </SubSection>
          <SubSection title="(d) Auto-renewal">
            Subscriptions automatically renew at the then-current rate until
            you cancel. You may cancel at any time through the Service;
            cancellation takes effect at the end of the current billing period
            and does not entitle you to a refund of the current period&rsquo;s
            fee.
          </SubSection>
          <SubSection title="(e) No refunds">
            <span className="uppercase font-semibold text-[color:var(--color-ink)] tracking-wide">
              All fees &mdash; including subscription and event fees &mdash;
              are non-refundable, including if you are removed from the group,
              if an event is cancelled or relocated, or if you do not attend,
              except where a refund is required by applicable law.
            </span>
          </SubSection>
          <SubSection title="(f) Failed payments">
            We may suspend your access until you cure a failed payment.
          </SubSection>
        </Section>

        <Section n="8" title="Networking; member conduct">
          <p>
            The Service connects you with other people. Any deal, transaction,
            partnership, employment relationship, introduction, or personal
            interaction between you and another Member is between you and them.
            We do not endorse, vouch for, verify, or take responsibility for
            any Member or any representation a Member makes.
          </p>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>harass, threaten, defame, or discriminate against any person;</li>
            <li>misrepresent yourself or your credentials;</li>
            <li>solicit Members in violation of these Terms;</li>
            <li>
              collect Member data for use outside the Service except for
              ordinary personal networking;
            </li>
            <li>violate any law in connection with the Service.</li>
          </ul>
          <p>
            We may, but are not required to, investigate complaints, remove
            content, suspend access, and terminate accounts. We are not liable
            for any decision to act or not act on a complaint.
          </p>
        </Section>

        <Section n="9" title="Content from others">
          <p>
            Members and admins may post bios, broadcasts, messages, scores, and
            other content. We do not pre-screen or guarantee accuracy. Reliance
            on Member or admin content is at your own risk.
          </p>
        </Section>

        <Section n="10" title="AI policy">
          <p>
            We use artificial intelligence (&ldquo;AI&rdquo;) tools to operate
            and improve the Service, including but not limited to drafting
            messages, summarizing content, organizing groupings, generating
            recommendations, moderating content, and analyzing Member data.
          </p>
          <SubSection title="(a) Consent to AI processing">
            You consent to our use of AI to process any data you submit or
            generate through the Service, including transfer to AI service
            providers under their respective terms.
          </SubSection>
          <SubSection title="(b) No warranty on AI output">
            AI output is not professional advice (legal, medical, financial,
            golf instructional, or otherwise). It may contain errors. Verify
            before relying on it.
          </SubSection>
          <SubSection title="(c) AI-assisted decisions">
            We may use AI tools to flag potential rule violations and to assist
            in decisions about your membership. You may request human review of
            any AI-driven membership decision by emailing the address in
            Section 22.
          </SubSection>
          <SubSection title="(d) No model training on our data">
            You may not use the Service, scrape its content, or harvest Member
            data to train artificial intelligence or machine learning systems.
          </SubSection>
        </Section>

        <Section n="11" title="Intellectual property">
          <p>
            The Service, its design, brand, software, and content we create are
            owned by Fairway Founders and protected by intellectual property
            law. You may not copy, reproduce, modify, distribute,
            reverse-engineer, or create derivative works of the Service except
            as expressly permitted. Member-submitted content remains owned by
            the Member, subject to the broad license you grant under Section 5.
          </p>
        </Section>

        <Section n="12" title="Third-party services">
          <p>
            The Service integrates with third parties (payment processors,
            authentication providers, hosting, analytics, AI providers,
            email/SMS providers, golf courses, sponsors). Their performance and
            terms are outside our control. Outages, errors, security incidents,
            or actions of third parties are not our responsibility.
          </p>
        </Section>

        <Section n="13" title="Photography and video at events">
          <p>
            You consent to being photographed, filmed, and recorded at events
            and to our perpetual, royalty-free publication of those images and
            recordings in any medium, for any purpose. If you do not consent,
            do not attend events.
          </p>
        </Section>

        <Section n="14" title="Event cancellation; force majeure">
          <p>
            We may cancel, postpone, relocate, or substitute any event at any
            time. Fees paid for cancelled events are not refunded. We are not
            liable for any cancellation or impairment caused by weather,
            illness, public emergency, government action, course unavailability,
            supplier failure, or any event beyond our reasonable control.
          </p>
        </Section>

        <Section n="15" title="Disclaimers">
          <p className="uppercase font-semibold text-[color:var(--color-ink)] tracking-wide">
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as
            available,&rdquo; without warranty of any kind, express or implied,
            including warranties of merchantability, fitness for a particular
            purpose, non-infringement, and any warranty arising from course of
            dealing or usage of trade. We do not warrant that the Service will
            be uninterrupted, error-free, or secure.
          </p>
        </Section>

        <Section n="16" title="Limitation of liability">
          <p className="uppercase font-semibold text-[color:var(--color-ink)] tracking-wide">
            To the maximum extent permitted by law, Fairway Founders, its
            owners, employees, agents, and affiliates shall not be liable for
            any indirect, incidental, special, consequential, exemplary, or
            punitive damages, lost profits, lost data, or loss of goodwill
            arising from these Terms or the Service.
          </p>
          <p className="uppercase font-semibold text-[color:var(--color-ink)] tracking-wide">
            Our total cumulative liability for all claims shall not exceed the
            greater of (a) one hundred dollars ($100) or (b) the total fees you
            paid to us in the twelve (12) months preceding the event giving
            rise to the claim.
          </p>
        </Section>

        <Section n="17" title="Indemnification">
          <p>
            You will defend, indemnify, and hold harmless Fairway Founders and
            its owners, employees, and agents from any claim, demand, loss,
            damage, cost, or expense (including reasonable attorneys&rsquo;
            fees) arising from: (i) your use of the Service; (ii) your content;
            (iii) your interaction with other Members or third parties; (iv)
            your breach of these Terms; (v) your violation of any law or
            third-party right.
          </p>
        </Section>

        <Section n="18" title="Dispute resolution; arbitration; class action waiver">
          <p className="uppercase font-semibold text-[color:var(--color-ink)] tracking-wide">
            Any dispute arising from or related to these Terms or the Service
            shall be resolved by binding individual arbitration under the rules
            of the American Arbitration Association, in Bradenton, Florida,
            before a single arbitrator. You and Fairway Founders waive the
            right to a jury trial and the right to participate in any class,
            collective, or representative action.
          </p>
          <p>
            Exceptions: either party may bring an individual action in
            small-claims court or seek injunctive relief in court to protect
            intellectual property rights.
          </p>
        </Section>

        <Section n="19" title="Governing law">
          <p>
            These Terms are governed by the laws of the State of Florida,
            without regard to its conflict-of-law principles. Venue for any
            non-arbitrable action lies in Manatee County, Florida.
          </p>
        </Section>

        <Section n="20" title="Changes">
          <p>
            We may update these Terms at any time. Material changes will be
            communicated through the Service or by email. Your continued use
            after changes constitutes acceptance.
          </p>
        </Section>

        <Section n="21" title="Severability; entire agreement; assignment">
          <p>
            If any provision is held unenforceable, the remaining provisions
            remain in effect. These Terms are the entire agreement between you
            and Fairway Founders regarding the Service. You may not assign
            these Terms; we may.
          </p>
        </Section>

        <Section n="22" title="Contact">
          <p>
            Questions about these Terms can be directed to{' '}
            <a
              href="mailto:hello@fairwayfounders.org"
              className="text-[color:var(--color-gold)] underline"
            >
              hello@fairwayfounders.org
            </a>{' '}
            or by mail to Golf Links Network LLC, 5620 Tara Blvd, Ste 101A,
            Bradenton, FL 34203.
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
