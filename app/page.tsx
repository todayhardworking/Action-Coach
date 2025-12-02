import Link from 'next/link';

const firebaseDocs = 'https://firebase.google.com/docs/web/setup';
const nextDocs = 'https://nextjs.org/docs/app';
const vercelDeploy = 'https://vercel.com/docs/deployments/overview';

export default function HomePage() {
  return (
    <main>
      <section className="card">
        <h1>Next.js + Firebase starter is ready</h1>
        <p>
          The repository has been reset to a clean Next.js App Router project with Firebase Auth and Firestore
          initialization helpers. Plug in your Firebase credentials, deploy to Vercel, and start building.
        </p>
        <ul>
          <li>
            Update the <code>.env.example</code> values and copy them into a local <code>.env.local</code> file.
          </li>
          <li>
            Use the shared <code>lib/firebase/client.ts</code> initializer to access <code>auth</code> and <code>firestore</code> across
            your app.
          </li>
          <li>
            Start the dev server with <code>npm install</code> then <code>npm run dev</code>.
          </li>
          <li>
            Deploy with Vercel once your Firebase project settings are configured.
          </li>
        </ul>
        <p>
          Helpful links:{' '}
          <Link href={firebaseDocs} target="_blank" rel="noreferrer">Firebase docs</Link>{' | '}
          <Link href={nextDocs} target="_blank" rel="noreferrer">Next.js App Router guide</Link>{' | '}
          <Link href={vercelDeploy} target="_blank" rel="noreferrer">Vercel deployments</Link>
        </p>
      </section>
    </main>
  );
}
