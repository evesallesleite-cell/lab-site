import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const VERSION = "1.0.0";

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Today's supplements by time
  const todaysSupplements = [
    { time: "🌅 Pre-Breakfast", items: ["B6+B9+B12", "Magnesium", "Taurine", "NAC", "NMN"], color: "#f97316" },
    { time: "🍳 Breakfast", items: ["Testofen", "CDP-Choline", "Lion's Mane", "Omega-3", "Collagen"], color: "#22c55e" },
    { time: "🔥 Pre-Workout", items: ["Beta-Alanine", "Creatine", "L-Citrulline", "Vinitrox"], color: "#ef4444" },
    { time: "💪 Post-Workout", items: ["Whey Protein"], color: "#ec4899" },
    { time: "🌙 Before Bed", items: ["Tart Cherry", "Glycine"], color: "#6366f1" }
  ];

  // Quick stats (would come from API in real app)
  const stats = {
    weight: { value: 69.7, unit: "kg", change: -0.5 },
    sleep: { value: 7.2, unit: "hrs", quality: 87 },
    recovery: { value: 72, unit: "%" },
    strain: { value: 15.2, unit: "" }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLoggedIn = localStorage.getItem("lab-logged-in") === "true";
      setLoggedIn(isLoggedIn);
      if (!isLoggedIn) {
        router.replace("/login");
      } else {
        // Load integrated health data
        fetch("/api/health/integrated")
          .then(res => res.json())
          .then(data => {
            setHealthData(data);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
    }
  }, [router]);

  if (!loggedIn) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        fontFamily: "Inter, sans-serif"
      }}>
        <div style={{ textAlign: "center", color: "white" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔒</div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      fontFamily: "Inter, system-ui, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: "white",
        borderBottom: "1px solid #e2e8f0",
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>🔗 Health Hub</h1>
          <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Integrated health dashboard</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/health/integration" style={{
            padding: "0.5rem 1rem",
            background: "#f1f5f9",
            color: "#475569",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: "0.9rem"
          }}>
            📊 Full Report
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("lab-logged-in");
              router.replace("/login");
            }}
            style={{
              padding: "0.5rem 1rem",
              background: "#f1f5f9",
              color: "#475569",
              border: "none",
              borderRadius: 8,
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "2rem" }}>
        {/* Quick Stats Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem"
        }}>
          {/* Weight */}
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>⚖️ Weight</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a" }}>
              {stats.weight.value} <span style={{ fontSize: "1rem", color: "#64748b" }}>{stats.weight.unit}</span>
            </div>
            <div style={{
              fontSize: "0.85rem",
              color: stats.weight.change < 0 ? "#16a34a" : "#dc2626",
              marginTop: "0.25rem"
            }}>
              {stats.weight.change < 0 ? "↓" : "↑"} {Math.abs(stats.weight.change)} kg
            </div>
          </div>

          {/* Sleep */}
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>😴 Sleep</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a" }}>
              {stats.sleep.value} <span style={{ fontSize: "1rem", color: "#64748b" }}>{stats.sleep.unit}</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
              Quality: {stats.sleep.quality}%
            </div>
          </div>

          {/* Recovery */}
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>🔋 Recovery</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a" }}>
              {stats.recovery.value}<span style={{ fontSize: "1rem", color: "#64748b" }}>%</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
              {stats.recovery.value >= 70 ? "✅ Ready" : stats.recovery.value >= 40 ? "⚠️ Moderate" : "❌ Low"}
            </div>
          </div>

          {/* Strain */}
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>💪 Strain</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a" }}>
              {stats.strain.value}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
              {stats.strain.value >= 14 ? "🔥 High" : stats.strain.value >= 10 ? " moderate" : " Low"}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
          
1.5rem          {/* Today's Supplements */}
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0f172a" }}>💊 Today's Stack</h2>
              <Link href="/supplement-stack" style={{ fontSize: "0.85rem", color: "#3b82f6", textDecoration: "none" }}>
                View All →
              </Link>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {todaysSupplements.map(slot => (
                <div key={slot.time} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem"
                }}>
                  <div style={{
                    background: slot.bg || "#f1f5f9",
                    padding: "0.5rem 0.75rem",
                    borderRadius: 8,
                    minWidth: "100px",
                    textAlign: "center"
                  }}>
                    <span style={{ fontSize: "0.8rem", color: "#475569" }}>{slot.time}</span>
                  </div>
                  <div style={{ flex: 1, display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {slot.items.map(item => (
                      <span key={item} style={{
                        padding: "0.25rem 0.5rem",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 6,
                        fontSize: "0.8rem",
                        color: "#475569"
                      }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>⚡ Quick Actions</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link href="/blood-tests/upload" style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem",
                background: "#f0f9ff",
                borderRadius: 12,
                textDecoration: "none"
              }}>
                <span style={{ fontSize: "1.5rem" }}>📋</span>
                <div>
                  <div style={{ fontWeight: 500, color: "#0f172a" }}>Submit Bloodwork</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Send PDFs to Eve for analysis</div>
                </div>
              </Link>

              <Link href="/health/integration" style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem",
                background: "#f0fdf4",
                borderRadius: 12,
                textDecoration: "none"
              }}>
                <span style={{ fontSize: "1.5rem" }}>📊</span>
                <div>
                  <div style={{ fontWeight: 500, color: "#0f172a" }}>Full Health Report</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Apple Health + Whoop integration</div>
                </div>
              </Link>

              <Link href="/whoop/sleep" style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem",
                background: "#fefce8",
                borderRadius: 12,
                textDecoration: "none"
              }}>
                <span style={{ fontSize: "1.5rem" }}>😴</span>
                <div>
                  <div style={{ fontWeight: 500, color: "#0f172a" }}>Sleep Analysis</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Whoop sleep data & trends</div>
                </div>
              </Link>

              <Link href="/medical/body" style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem",
                background: "#fdf2f8",
                borderRadius: 12,
                textDecoration: "none"
              }}>
                <span style={{ fontSize: "1.5rem" }}>📈</span>
                <div>
                  <div style={{ fontWeight: 500, color: "#0f172a" }}>Body Metrics</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Weight & composition tracking</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div style={{
          marginTop: "2rem",
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          borderRadius: 16,
          padding: "1.5rem",
          color: "white"
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>📁 Connected Data Sources</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.25rem" }}>🍎</span>
              <span>Apple Health</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.25rem" }}>⌚</span>
              <span>Whoop</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.25rem" }}>🔬</span>
              <span>Lab Data</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.25rem" }}>💊</span>
              <span>Supplements</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.25rem" }}>🤖</span>
              <span>Eve AI</span>
            </div>
          </div>
        </div>

        {/* Version */}
        <div style={{ textAlign: "center", marginTop: "2rem", color: "#94a3b8", fontSize: "0.85rem" }}>
          Version {VERSION} • Health Integration v1.0
        </div>
      </div>
    </div>
  );
}
