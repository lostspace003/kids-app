// Public privacy policy, hosted at https://safar-anbiya.gennoor.com/privacy.
// Required for the Google Play listing (a kids/education app must link a
// publicly reachable privacy policy). Plain, readable, brand-themed.

export const metadata = {
  title: "Privacy Policy · Safar Anbiya",
  description:
    "How Safar Anbiya collects, uses, and protects the information of parents and children.",
};

const C = {
  bg: "#0c0820",
  card: "#151034",
  ink: "#f4eede",
  dim: "rgba(244,238,222,.72)",
  gold: "#f5c451",
  line: "rgba(245,196,81,.22)",
};

function H({ children }) {
  return (
    <h2
      style={{
        fontFamily: "Georgia, serif",
        color: C.gold,
        fontSize: 22,
        margin: "34px 0 10px",
      }}
    >
      {children}
    </h2>
  );
}

function P({ children }) {
  return (
    <p style={{ color: C.dim, fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
      {children}
    </p>
  );
}

function LI({ children }) {
  return (
    <li style={{ color: C.dim, fontSize: 16, lineHeight: 1.7, marginBottom: 6 }}>
      {children}
    </li>
  );
}

export default function PrivacyPolicy() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.ink,
        fontFamily: "system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        padding: "48px 20px 80px",
      }}
    >
      <article style={{ maxWidth: 760, margin: "0 auto" }}>
        <p style={{ letterSpacing: 3, fontSize: 12, color: C.gold, margin: 0 }}>
          SAFAR ANBIYA · JOURNEY OF THE PROPHETS
        </p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 38, margin: "10px 0 4px" }}>
          Privacy Policy
        </h1>
        <p style={{ color: C.dim, fontSize: 14, margin: 0 }}>
          Last updated: 26 June 2026
        </p>

        <div
          style={{
            background: C.card,
            border: `1px solid ${C.line}`,
            borderRadius: 16,
            padding: "8px 24px 28px",
            marginTop: 24,
          }}
        >
          <H>Who we are</H>
          <P>
            Safar Anbiya (&ldquo;Journey of the Prophets&rdquo;) is a gentle,
            gamified Islamic learning app for children, operated by Gennoor Tech
            Private Limited (&ldquo;we&rdquo;, &ldquo;us&rdquo;). This policy explains what
            information we collect, how we use it, and the choices you have. You can
            reach us any time at{" "}
            <a href="mailto:admin@gennoor.com" style={{ color: C.gold }}>
              admin@gennoor.com
            </a>
            .
          </P>
          <P>
            The app is intended to be set up and managed by a parent or guardian. A
            parent creates the account; a child then uses the app under that
            account.
          </P>

          <H>Information we collect</H>
          <P>We collect only what we need to run the learning experience:</P>
          <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
            <LI>
              <b>Parent account:</b> the parent&rsquo;s email address and a securely
              hashed password. We email a one-time verification code to confirm the
              address.
            </LI>
            <LI>
              <b>Child profile:</b> the child&rsquo;s first name (or nickname), date
              of birth, country, and gender. One profile is created per account.
            </LI>
            <LI>
              <b>Child photo (optional):</b> a photo you choose to upload. It is used
              only to generate a stylized cartoon avatar, and is screened by
              automated content moderation before use.
            </LI>
            <LI>
              <b>Learning progress:</b> which prophets have been completed, badges,
              &ldquo;Noor&rdquo; points, and similar in-app achievements.
            </LI>
            <LI>
              <b>Feedback (optional):</b> ratings or comments you choose to send us.
            </LI>
            <LI>
              <b>Basic technical data:</b> standard request information (such as IP
              address and device/browser type) needed to operate and secure the
              service.
            </LI>
          </ul>
          <P>
            <b>Advertising.</b> We show <b>no advertising inside the app.</b> On our
            public website only, we may display limited advertising provided by
            Google (AdSense), configured as <b>non-personalised</b> and for
            <b> child-directed treatment</b> — meaning ads are contextual, not based
            on a personal profile of the user. Google may use cookies or similar
            technology for non-personalised purposes such as frequency capping and
            fraud prevention. We do <b>not</b> use cross-app tracking and we do
            <b> not</b> sell personal information. You can learn how Google uses
            information from sites that use its services at{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              style={{ color: C.gold }}
            >
              policies.google.com/technologies/partner-sites
            </a>
            .
          </P>

          <H>How we use information</H>
          <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
            <LI>To create and secure the parent account and sign you in.</LI>
            <LI>
              To personalise the journey (greeting the child by name, showing the
              avatar, saving progress across devices).
            </LI>
            <LI>
              To generate the cartoon avatar from an uploaded photo and to keep
              uploaded images appropriate via automated moderation.
            </LI>
            <LI>
              To email essential messages, such as the verification code and, when a
              child finishes all 25 prophets, a Certificate of Completion.
            </LI>
            <LI>To respond to feedback and support requests, and to keep the service safe.</LI>
          </ul>

          <H>The child&rsquo;s photo</H>
          <P>
            Uploading a photo is optional. If you provide one, it is stored securely
            and used to create the child&rsquo;s avatar. You can edit the profile or
            ask us to delete the photo and account at any time (see
            &ldquo;Your choices&rdquo; below).
          </P>

          <H>Leaderboard (pseudonymous)</H>
          <P>
            The app includes an optional leaderboard that ranks children by their
            total &ldquo;Noor&rdquo; (in-app achievement points). To protect
            children, the leaderboard is <b>pseudonymous</b>: each child is shown
            only as a <b>fun mascot icon and an auto-generated handle</b> (for
            example, &ldquo;Brave Lantern&rdquo;). We do <b>not</b> display a
            child&rsquo;s real name, photo, age, date of birth, or country to other
            users. A child&rsquo;s date of birth is used only privately, on our
            server, as a tie-breaker when two scores are equal (younger first) — it
            is never shown. Tapping another entry shows only that same public
            information (icon, handle, score, lands completed). A child aged 10 or
            under may show their cartoon (Ghibli) avatar instead of an icon — never
            a real photo. A parent can hide their child from the leaderboard at any
            time; this control is protected by a 4-digit PIN (resettable by an
            emailed code).
          </P>

          <H>Trying the app without an account</H>
          <P>
            A visitor may preview a single story without logging in. In this guest
            mode <b>no account is created and no personal information is collected
            or saved</b>; progress is kept only in the browser for that session and
            is discarded. Logging in is required to continue beyond the first story,
            save progress, or appear on the leaderboard.
          </P>

          <H>How information is shared</H>
          <P>
            We never sell your data. We share information only with the service
            providers (subprocessors) that power the app, and only as needed to run
            it:
          </P>
          <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
            <LI>
              <b>Microsoft Azure</b> — secure hosting, database, and file storage for
              accounts, profiles, photos, and progress.
            </LI>
            <LI>
              <b>Azure Communication Services</b> — sending the verification code and
              certificate emails.
            </LI>
            <LI>
              <b>OpenAI / Azure OpenAI</b> — generating the cartoon avatar from an
              uploaded photo and helping screen images for appropriateness.
            </LI>
            <LI>
              <b>Google AdSense</b> — serving limited, non-personalised,
              child-directed ads on our public website only (never inside the app).
            </LI>
          </ul>
          <P>
            We may also disclose information if required by law, or to protect the
            rights, safety, and security of our users and service.
          </P>

          <H>Data retention &amp; deletion</H>
          <P>
            We keep account and profile data while the account is active. You can ask
            us to delete the account and all associated data — including the
            child&rsquo;s name, date of birth, photo, avatar, and progress — by
            emailing{" "}
            <a href="mailto:admin@gennoor.com" style={{ color: C.gold }}>
              admin@gennoor.com
            </a>
            . We will action verified deletion requests promptly.
          </P>

          <H>Children&rsquo;s privacy</H>
          <P>
            Safar Anbiya is designed for children but intended to be managed by a
            parent or guardian, who provides any information about the child. We do
            not knowingly collect more information from children than is needed to
            provide the learning experience, and we do not use children&rsquo;s data
            for advertising or profiling. We aim to handle children&rsquo;s
            information consistently with applicable laws such as COPPA and the GDPR
            (including provisions for children). If you believe a child has provided
            us information without a parent&rsquo;s involvement, contact us and we
            will delete it.
          </P>

          <H>Security</H>
          <P>
            Passwords are stored only in hashed form, data is transmitted over
            encrypted connections (HTTPS), and access to stored data is restricted.
            No method of storage or transmission is perfectly secure, but we work to
            protect your information.
          </P>

          <H>International transfers</H>
          <P>
            Our providers may process and store data in data centres located in
            various regions. Where data is transferred internationally, we rely on
            the safeguards offered by those providers.
          </P>

          <H>Your choices</H>
          <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
            <LI>Edit the child&rsquo;s profile details from within the app.</LI>
            <LI>Request a copy, correction, or deletion of your data by email.</LI>
            <LI>Stop using the app and request account deletion at any time.</LI>
          </ul>

          <H>Changes to this policy</H>
          <P>
            We may update this policy from time to time. We will revise the
            &ldquo;Last updated&rdquo; date above and, for significant changes, take
            reasonable steps to let you know.
          </P>

          <H>Contact us</H>
          <P>
            Questions or requests? Email{" "}
            <a href="mailto:admin@gennoor.com" style={{ color: C.gold }}>
              admin@gennoor.com
            </a>
            .
          </P>
        </div>
      </article>
    </main>
  );
}
