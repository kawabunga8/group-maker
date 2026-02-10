tsx
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Group Maker</h1>
      <p>Create a class, add students, then generate random groups.</p>
      <p>
        Go to: <Link href="/">Home</Link>
      </p>
    </main>
  );
}
