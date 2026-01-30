import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const VERSION = "1.0.0";

export default function WhoopRecovery() {
  const [recoveryData, setRecoveryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loggedIn = localStorage.getItem("lab-logged-in");
      if (loggedIn !== "true") {
        router.replace("/login");
        return;
      }
      fetchRecoveryData();
    }
  }, [router]);

  async function fetchRecoveryData() {
    try {
      const response = await fetch("/api/whoop/recovery");
      if (response.ok) {
        const data = await response.json();
        setRecoveryData(data);
      }
    } catch (error) {
      console.error("Failed to fetch recovery data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate averages
  const avgRecovery = recoveryData.length > 0
    ? Math.round(recoveryData.reduce((sum, d) => sum + (d.recoveryScore || 0), 0) / recoveryData.length)
    : 0;
  
  const avgHRV = recoveryData.length > 0
    ? Math.round(recoveryData.reduce((sum, d) => sum + (d.hrv || 0), 0) / recoveryData.length)
    : 0;
  
  const avgRHR = recoveryData.length > 0
    ? Math.round(recoveryData.reduce((sum, d) => sum + (d.rhr || 0), 0) / recoveryData.length)
    : 0;

  // Get recovery distribution
  const greenDays = recoveryData.filter(d => d.recoveryScore >= 70).length;
  const yellowDays = recoveryData.filter(d => d.recoveryScore >= 40 && d.recoveryScore < 70).length;
  const redDays = recoveryData.filter(d => d.recoveryScore < 40).length;

  const getRecoveryColor = (score) => {
    if (score >= 70) return { bg: "#dcfce7", text: "#166534", label: "✅ Ready" };
    if (score >= 40) return { bg: "#fef9c3", text: "#854d0e", label: "⚠️ Moderate" };
    return { bg: "#fee2e2", text: "#991b1b", label: "❌ Low" };
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        color: "white",
        fontFamily: "Inter, sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔋</div>
          <p>Loading recovery data...</p>
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
        alignItems: "center"
      }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>🔋 Whoop Recovery</h1>
          <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Recovery scores & biometrics</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/home" style={{
            padding: "0.5rem 1rem",
            background: "#f1f5f9",
            color: "#475569",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: "0.9rem"
          }}>
            ← Home
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
        {/* Summary Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            borderRadius: 16,
            padding: "1.25rem",
            color: "white"
          }}>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.5rem" }}>Avg Recovery</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{avgRecovery}%</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>{greenDays} green days</div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            borderRadius: 16,
            padding: "1.25rem",
            color: "white"
          }}>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.5rem" }}>Avg HRV</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{avgHRV} <span style={{ fontSize: "1rem" }}>ms</span></div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>heart rate variability</div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            borderRadius: 16,
            padding: "1.25rem",
            color: "white"
          }}>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.5rem" }}>Avg RHR</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{avgRHR} <span style={{ fontSize: "1rem" }}>bpm</span></div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>resting heart rate</div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
            borderRadius: 16,
            padding: "1.25rem",
            color: "white"
          }}>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.5rem" }}>Records</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{recoveryData.length}</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>days tracked</div>
          </div>
        </div>

        {/* Recovery Distribution */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "2rem"
        }}>
          <div style={{
            background: "#dcfce7",
            borderRadius: 12,
            padding: "1rem",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#166534" }}>{greenDays}</div>
            <div style={{ fontSize: "0.85rem", color: "#166534" }}>✅ Ready</div>
          </div>
          <div style={{
            background: "#fef9c3",
            borderRadius: 12,
            padding: "1rem",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#854d0e" }}>{yellowDays}</div>
            <div style={{ fontSize: "0.85rem", color: "#854d0e" }}>⚠️ Moderate</div>
          </div>
          <div style={{
            background: "#fee2e2",
            borderRadius: 12,
            padding: "1rem",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#991b1b" }}>{redDays}</div>
            <div style={{ fontSize: "0.85rem", color: "#991b1b" }}>❌ Low</div>
          </div>
        </div>

        {/* Recovery History Table */}
        <div style={{
          background: "white",
          borderRadius: 16,
          padding: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>
            📊 Recovery History
          </h2>

          {recoveryData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
              No recovery data available
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ textAlign: "left", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>Date</th>
                    <th style={{ textAlign: "center", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>Recovery</th>
                    <th style={{ textAlign: "center", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>HRV</th>
                    <th style={{ textAlign: "center", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>RHR</th>
                    <th style={{ textAlign: "center", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>Skin Temp</th>
                    <th style={{ textAlign: "center", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>SpO2</th>
                    <th style={{ textAlign: "center", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>Strain</th>
                  </tr>
                </thead>
                <tbody>
                  {recoveryData.map((day, index) => {
                    const date = new Date(day.cycleStartTime);
                    const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                    const color = getRecoveryColor(day.recoveryScore);

                    return (
                      <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.75rem", fontWeight: 500, color: "#0f172a" }}>{dateStr}</td>
                        <td style={{ padding: "0.75rem", textAlign: "center" }}>
                          <span style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: 6,
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            background: color.bg,
                            color: color.text
                          }}>
                            {day.recoveryScore}%
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "center", color: "#475569" }}>{day.hrv || "-"} ms</td>
                        <td style={{ padding: "0.75rem", textAlign: "center", color: "#475569" }}>{day.rhr || "-"} bpm</td>
                        <td style={{ padding: "0.75rem", textAlign: "center", color: "#475569" }}>
                          {day.skinTemp ? `${day.skinTemp.toFixed(2)}°C` : "-"}
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "center", color: "#475569" }}>
                          {day.bloodOxygen ? `${day.bloodOxygen.toFixed(1)}%` : "-"}
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "center", color: "#475569" }}>
                          {day.strain || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Metrics Explained */}
        <div style={{
          marginTop: "2rem",
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          borderRadius: 16,
          padding: "1.5rem",
          color: "white"
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>📖 Recovery Metrics Explained</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            <div>
              <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>Recovery Score</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                Percentage showing how recovered your body is. Based on HRV, RHR, sleep, and other biometrics.
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>HRV (Heart Rate Variability)</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                Higher HRV generally means better recovery. Reflects autonomic nervous system balance.
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>RHR (Resting Heart Rate)</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                Lower is usually better. A sudden increase may indicate stress, illness, or poor recovery.
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>Skin Temperature</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                Deviations from your baseline can indicate illness, inflammation, or hormonal changes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
