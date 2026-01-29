import "../styles/globals.css";
import Header from "../components/header";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Header />
      <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <Component {...pageProps} />
      </main>
    </>
  );
}
