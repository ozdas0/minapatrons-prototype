import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Link from "next/link";

export default function Welcome() {
  const router = useRouter();

  const handleNavigation = () => {
    router.push("/home");
  };

  return (
    <>
      <Head>
        <title>MINAPATRONS - Welcome</title>
        <meta
          name="description"
          content="Welcome to MINAPATRONS, your platform to support and explore content creators."
        />
      </Head>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>MINAPATRONS</h1>
          <p className={styles.description}>
            Support your favorite creators and discover new talents.
          </p>
        </header>

        <main className={styles.main}>
          <div className={styles.hero}>
            <h2 className={styles.heroTitle}>Welcome to MINAPATRONS</h2>
            <p className={styles.heroDescription}>
              Your platform to support and explore content creators.
            </p>
            <Link href="/home" legacyBehavior>
              <a className={styles.callToAction}>Explore MINAPATRONS</a>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
