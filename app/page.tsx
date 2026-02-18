// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import FamilyFloristApp from "@/components/FamilyFloristApp";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f2ec" }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#1a5c2e" }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  return <FamilyFloristApp supabase={supabase} user={user} />;
}