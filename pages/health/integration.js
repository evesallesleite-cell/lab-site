import { useState, useEffect } from "react";
import { useRouter } from "next/router";

const VERSION = "1.0.0";

export default function HealthDashboard() {
  const [healthData, setHealthData] = useState(null);
  const [whoopData, setWhoopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check auth
    if (typeof window !== "undefined") {
      const loggedIn = localStorage.getItem("lab-logged-in");
      if (loggedIn !== "true") {
        router.replace("/login");
        return;
      }
      loadHealthData();
    }
  }, [router]);

  async function loadHealthData() {
    try {
      // Load unified health data
      const response = await fetch("/api/health/integrated");
      if (response.ok) {
        const data = await response.json();
        setHealthData(data.appleHealth);
        setWhoopData(data.whoop);
      }
    } catch (error) {
      console.error("Failed to load health data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        fontFamily: "Arial, sans-serif"
      }}>
        <div style={{ color: "white", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📊</div>
          <p>Loading health data...</p>
        </div>
      </div>
    );
  }

  // Get latest weight
  const latestWeight = healthData?.weight?.data?.[0];
  const weightChange = healthData?.weight?.data?.[1];

  // Calculate weight change
  const weightDiff = latestWeight && weightChange 
    ? (latestWeight.value - weightChange.value).toFixed(1)
    : null;

  // Get latest Whoop cycle
  const latestCycle = whoopData?.cycles?.[0];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
      fontFamily: "Inter, system-ui, sans-serif",
      padding: "2rem"
    }}>
      {/* Header */}
      <div style={{ maxWidth: 1200, margin: "0 auto", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
          🔗 Health Integration Dashboard
        </h1>
        <p style={{ color: "#64748b" }}>
          Unified view of Apple Health + Whoop + Lab Data
        </p>
        <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.5rem" }}>
          Version {VERSION}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {/* Weight Card */}
        <div style={{
          background: "white",
          borderRadius: 16,
          padding: "1.5rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚖️</div>
          <div style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "4px" }}>Weight</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0f172a" }}>
            {latestWeight ? `${latestWeight.value.toFixed(1)} kg` : "—"}
          </div>
          {weightDiff && (
            <div style={{ 
              fontSize: "0.85rem", 
              color: parseFloat(weightDiff) >= 0 ? "#16a34a" : "#dc2626",
              marginTop: "4px"
            }}>
              {parseFloat(weightDiff) >= 0 ? "↑" : "↓"} {Math.abs(parseFloat(weightDiff))} kg
            </div>
          )}
        </div>

        {/* Sleep Card */}
        <div style={{
          background: "white",
          borderRadius: 16,
          padding: "1.5rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>😴</div>
          <div style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "4px" }}>Last Sleep</div>
          {latestCycle ? (
            <>
              <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0f172a" }}>
                {latestCycle.hoursSlept?.toFixed(1) || "—"}h
              </div>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
                {latestCycle.sleepNeedFulfillment?.toFixed(0) || "—"}% need fulfilled
              </div>
            </>
          ) : (
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0f172a" }}>—</div>
          )}
        </div>

        {/* Recovery Card */}
        <div style={{
          background: "white",
          borderRadius: 16,
          padding: "1.5rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔋</div>
          <div style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "4px" }}>Recovery</div>
          {latestCycle ? (
            <>
              <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0f172a" }}>
                {latestCycle.recoveryScore || "—"}%
              </div>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
                {latestCycle.napCount > 0 ? `${latestCycle.napCount} nap(s)` : "No naps"}
              </div>
            </>
          ) : (
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0f172a" }}>—</div>
          )}
        </div>

        {/* Strain Card */}
        <div style={{
          background: "white",
          borderRadius: 16,
          padding: "1.5rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💪</div>
          <div style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "4px" }}>Strain</div>
          {latestCycle ? (
            <>
              <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0f172a" }}>
                {latestCycle.strain || "—"}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
                {latestCycle.maxHeartRate || "—"} bpm max
              </div>
            </>
          ) : (
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0f172a" }}>—</div>
          )}
        </div>
      </div>

      {/* Data Sources */}
      <div style={{ maxWidth: 1200, margin: "0 auto", background: "white", borderRadius: 16, padding: "1.5rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>
          📁 Connected Data Sources
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
          <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "8px" }}>
              <span style={{ fontSize: "1.5rem" }}>🍎</span>
              <strong>Apple Health</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#64748b", fontSize: "0.9rem" }}>
              <li>Weight tracking</li>
              <li>Body composition</li>
              <li>Activity metrics</li>
            </ul>
          </div>
          
          <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "8px" }}>
              <span style={{ fontSize: "1.5rem" }}>⌚</span>
              <strong>Whoop</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#64748b", fontSize: "0.9rem" }}>
              <li>Sleep analysis</li>
              <li>Recovery scores</li>
              <li>Strain tracking</li>
            </ul>
          </div>
          
          <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "8px" }}>
              <span style={{ fontSize: "1.5rem" }}>🔬</span>
              <strong>Lab Data</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#64748b", fontSize: "0.9rem" }}>
              <li>Bloodwork analysis</li>
              <li>Historical trends</li>
              <li>Send PDFs to Eve</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ maxWidth: 1200, margin: "2rem auto", background: "white", borderRadius: 16, padding: "1.5rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>
          ⚡ Quick Actions
        </h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a href="/blood-tests/upload" style={{
            padding: "0.75rem 1.5rem",
            background: "#3b82f6",
            color: "white",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 500
          }}>
            📋 Submit Bloodwork
          </a>
          <a href="/whoop/sleep" style={{
            padding: "0.75rem 1.5rem",
            background: "#10b981",
            color: "white",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 500
          }}>
            📊 View Whoop Data
          </a>
          <a href="/medical/body" style={{
            padding: "0.75rem 1.5rem",
            background: "#8b5cf6",
            color: "white",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 500
          }}>
            📈 Body Metrics
          </a>
        </div>
      </div>
    </div>
  );
}
