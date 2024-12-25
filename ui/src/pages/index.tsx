import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../styles/Home.module.css";

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
          <button onClick={handleNavigation} className={styles.searchButton}>
            Go to MINAPATRONS
          </button>
        </main>
      </div>
    </>
  );
}
