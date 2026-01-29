import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return alert("Enter an email");
    // demo login — sets flag used by Header
    if (typeof window !== "undefined") localStorage.setItem("loggedIn", "true");
    router.push("/home");
  }

  return (
    <div style={{ maxWidth: 480, margin: "6rem auto", padding: 24, borderRadius: 8, boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}>
      <h1 style={{ margin: 0, marginBottom: 8 }}>Sign in</h1>
      <p style={{ marginTop: 0, color: "#666" }}>Use any email to sign in (demo)</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ddd" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ddd" }}
        />
        <button type="submit" style={{ padding: 10, borderRadius: 6, background: "#111", color: "#fff", border: "none", cursor: "pointer" }}>
          Login
        </button>
      </form>
    </div>
  );
}