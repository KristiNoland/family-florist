// @ts-nocheck
"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    setError(""); setMessage(""); setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); } else { setMessage("Account created! You can now log in."); setIsSignUp(false); setPassword(""); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); } else { window.location.href = "/"; }
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f3d1d 0%, #1a5c2e 50%, #2d7a42 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Libre Franklin', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ background: "#fff", borderRadius: 16, padding: "48px 40px", width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#1a5c2e", marginBottom: 4 }}>Family Florist</h1>
          <p style={{ fontSize: 13, color: "#6b6b6b", fontStyle: "italic" }}>Delivery Driver Management</p>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, textAlign: "center" }}>{isSignUp ? "Create Account" : "Sign In"}</h2>
        {error && <div style={{ background: "#fdf0ef", border: "1px solid #e74c3c", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c0392b" }}>{error}</div>}
        {message && <div style={{ background: "#f0faf4", border: "1px solid #27ae60", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#1a5c2e" }}>{message}</div>}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b6b6b", marginBottom: 4 }}>EMAIL</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2ddd5", borderRadius: 8, fontSize: 14 }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b6b6b", marginBottom: 4 }}>PASSWORD</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2ddd5", borderRadius: 8, fontSize: 14 }} />
        </div>
        <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: 14, background: "#1a5c2e", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>{loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}</button>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }} style={{ background: "none", border: "none", color: "#1a5c2e", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>{isSignUp ? "Already have an account? Sign in" : "Need an account? Create one"}</button>
        </div>
      </div>
    </div>
  );
}