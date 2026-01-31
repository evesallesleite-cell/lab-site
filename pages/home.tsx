import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const VERSION = "2.0.0";

interface HealthData {
  health?: {
    whoop?: {
      recovery_score: number;
      resting_heart_rate: number;
      hrv: number;
      spo2: number;
      skin_temp: number;
      strain: number;
      sleep_hours: number | null;
    };
  };
  insights?: string[];
}

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
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

  // Get stats from health data
  const getStats = () => {
    if (healthData?.health?.whoop) {
      const { recovery_score, strain, resting_heart_rate, hrv } = healthData.health.whoop;
      return {
        recovery: { value: recovery_score, unit: "%" },
        strain: { value: strain.toFixed(1), unit: "" },
        rhr: { value: resting_heart_rate, unit: "bpm" },
        hrv: { value: hrv.toFixed(1), unit: "ms" }
      };
    }
    return {
      recovery: { value: 72, unit: "%" },
      strain: { value: 15.2, unit: "" },
      rhr: { value: 57, unit: "bpm" },
      hrv: { value: 58.6, unit: "ms" }
    };
  };

  const stats = getStats();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLoggedIn = localStorage.getItem("lab-logged-in") === "true";
      setLoggedIn(isLoggedIn);
      if (!isLoggedIn) {
        router.replace("/login");
      } else {
        // Load integrated health data from Clawdbot
        fetch("/api/health/integrated")
          .then(res => res.json())
          .then(data => {
            setHealthData(data);
            setLoading(false);
          })
          .catch(() => {
            // Fallback to default data
            setLoading(false);
          });
      }
    }
  }, [router]);

  const getRecoveryColor = (score: number) => {
    if (score >= 70) return "#16a34a";
    if (score >= 40) return "#eab308";
    return "#dc2626";
  };

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
          <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Clawdbot + Lab-site Integration</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            padding: "0.5rem 0.75rem",
            background: healthData?.health ? "#f0fdf4" : "#fef3c7",
            color: healthData?.health ? "#16a34a" : "#d97706",
            borderRadius: 8,
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "currentColor"
            }}></span>
            {healthData?.health ? "Live" : "Demo"}
          </div>
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
        {/* AI Insights Banner */}
        {healthData?.insights && healthData.insights.length > 0 && (
          <div style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            borderRadius: 16,
            padding: "1.25rem",
            marginBottom: "1.5rem",
            color: "white"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.25rem" }}>🤖</span>
              <span style={{ fontWeight: 600 }}>Eve AI Insights</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {healthData.insights.slice(0, 3).map((insight, i) => (
                <div key={i} style={{ fontSize: "0.9rem", opacity: 0.95 }}>
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem"
        }}>
          {/* Recovery */}
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            borderLeft: `4px solid ${getRecoveryColor(stats.recovery.value)}`
          }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>🔋 Recovery</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a" }}>
              {stats.recovery.value}
              <span style={{ fontSize: "1rem", color: "#64748b", marginLeft: "0.25rem" }}>{stats.recovery.unit}</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
              {stats.recovery.value >= 70 ? "✅ Optimal" : stats.recovery.value >= 40 ? "⚠️ Moderate" : "❌ Low"}
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
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a" }}>
              {stats.strain.value}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
              {Number(stats.strain.value) >= 14 ? "🔥 High" : Number(stats.strain.value) >= 10 ? "📊 Moderate" : "💤 Low"}
            </div>
          </div>

          {/* RHR */}
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>❤️ RHR</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a" }}>
              {stats.rhr.value}
              <span style={{ fontSize: "1rem", color: "#64748b", marginLeft: "0.25rem" }}>{stats.rhr.unit}</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
              {stats.rhr.value < 60 ? "✅ Excellent" : "📊 Normal"}
            </div>
          </div>

          {/* HRV */}
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>📈 HRV</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a" }}>
              {stats.hrv.value}
              <span style={{ fontSize: "1rem", color: "#64748b", marginLeft: "0.25rem" }}>{stats.hrv.unit}</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
              {Number(stats.hrv.value) >= 50 ? "✅ Strong" : "💡 Below baseline"}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
          
          {/* Today's Supplements */}
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
                    background: slot.color ? `${slot.color}15` : "#f1f5f9",
                    color: slot.color || "#475569",
                    padding: "0.5rem 0.75rem",
                    borderRadius: 8,
                    minWidth: "100px",
                    textAlign: "center",
                    borderLeft: slot.color ? `3px solid ${slot.color}` : "none"
                  }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>{slot.time.split(" ")[0]}</span>
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
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Clawdbot + Whoop + Apple Health</div>
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

              <Link href="/personal-ai.js" style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem",
                background: "#fdf2f8",
                borderRadius: 12,
                textDecoration: "none"
              }}>
                <span style={{ fontSize: "1.5rem" }}>🤖</span>
                <div>
                  <div style={{ fontWeight: 500, color: "#0f172a" }}>Chat with Eve</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Personal AI health assistant</div>
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
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
              <span>Clawdbot</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.25rem" }}>🧬</span>
              <span>Genetics</span>
            </div>
          </div>
        </div>

        {/* Version */}
        <div style={{ textAlign: "center", marginTop: "2rem", color: "#94a3b8", fontSize: "0.85rem" }}>
          Version {VERSION} • Clawdbot Integration v1.0
        </div>
      </div>
    </div>
  );
}
