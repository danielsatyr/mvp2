// pages/_app.tsx
import type { AppProps } from "next/app";
import { AuthProvider } from "../context/AuthContext";
import Layout from "../components/Layout";
import "../styles/globals.css";
import * as go from "gojs";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
