import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const VERSION = "1.0.0";

export default function WhoopSleep() {
  const [sleepData, setSleepData] = useState([]);
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
      fetchSleepData();
    }
  }, [router]);

  async function fetchSleepData() {
    try {
      const response = await fetch("/api/whoop/sleep");
      if (response.ok) {
        const data = await response.json();
        setSleepData(data);
      }
    } catch (error) {
      console.error("Failed to fetch sleep data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate averages
  const avgPerformance = sleepData.length > 0
    ? Math.round(sleepData.reduce((sum, d) => sum + (d.sleepPerformance || 0), 0) / sleepData.length)
    : 0;
  
  const avgDuration = sleepData.length > 0
    ? Math.round(sleepData.reduce((sum, d) => sum + (d.asleepDuration || 0), 0) / sleepData.length)
    : 0;
  
  const avgEfficiency = sleepData.length > 0
    ? Math.round(sleepData.reduce((sum, d) => sum + (d.sleepEfficiency || 0), 0) / sleepData.length)
    : 0;

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        color: "white",
        fontFamily: "Inter, sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>😴</div>
          <p>Loading sleep data...</p>
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
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>😴 Whoop Sleep</h1>
          <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Sleep tracking & analysis</p>
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
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            borderRadius: 16,
            padding: "1.25rem",
            color: "white"
          }}>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.5rem" }}>Avg Sleep</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{Math.round(avgDuration / 60)}h {avgDuration % 60}m</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>per night</div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            borderRadius: 16,
            padding: "1.25rem",
            color: "white"
          }}>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.5rem" }}>Performance</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{avgPerformance}%</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>avg sleep need met</div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
            borderRadius: 16,
            padding: "1.25rem",
            color: "white"
          }}>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.5rem" }}>Efficiency</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{avgEfficiency}%</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>time in bed asleep</div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
            borderRadius: 16,
            padding: "1.25rem",
            color: "white"
          }}>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.5rem" }}>Records</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{sleepData.length}</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>nights tracked</div>
          </div>
        </div>

        {/* Sleep Data Table */}
        <div style={{
          background: "white",
          borderRadius: 16,
          padding: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>
            📊 Sleep History
          </h2>

          {sleepData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
              No sleep data available
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ textAlign: "left", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>Date</th>
                    <th style={{ textAlign: "center", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>Duration</th>
                    <th style={{ textAlign: "center", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>Performance</th>
                    <th style={{ textAlign: "center", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>Efficiency</th>
                    <th style={{ textAlign: "center", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>Deep</th>
                    <th style={{ textAlign: "center", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>REM</th>
                    <th style={{ textAlign: "center", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>Light</th>
                    <th style={{ textAlign: "center", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>Awake</th>
                  </tr>
                </thead>
                <tbody>
                  {sleepData.map((night, index) => {
                    const date = new Date(night.cycleStartTime);
                    const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                    
                    // Calculate sleep stages
                    const totalAsleep = night.asleepDuration || 0;
                    const deepPct = night.deepDuration ? Math.round((night.deepDuration / totalAsleep) * 100) : 0;
                    const remPct = night.remDuration ? Math.round((night.remDuration / totalAsleep) * 100) : 0;
                    const lightPct = night.lightDuration ? Math.round((night.lightDuration / totalAsleep) * 100) : 0;
                    const awakePct = night.awakeDuration ? Math.round((night.awakeDuration / totalAsleep) * 100) : 0;

                    return (
                      <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.75rem", fontWeight: 500, color: "#0f172a" }}>{dateStr}</td>
                        <td style={{ padding: "0.75rem", textAlign: "center", color: "#475569" }}>
                          {Math.floor((night.asleepDuration || 0) / 60)}h {(night.asleepDuration || 0) % 60}m
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "center" }}>
                          <span style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: 6,
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            background: night.sleepPerformance >= 85 ? "#dcfce7" : night.sleepPerformance >= 70 ? "#fef9c3" : "#fee2e2",
                            color: night.sleepPerformance >= 85 ? "#166534" : night.sleepPerformance >= 70 ? "#854d0e" : "#991b1b"
                          }}>
                            {night.sleepPerformance}%
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "center", color: "#475569" }}>{night.sleepEfficiency}%</td>
                        <td style={{ padding: "0.75rem", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                            <div style={{ width: 40, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: `${deepPct}%`, height: "100%", background: "#8b5cf6" }} />
                            </div>
                            <span style={{ fontSize: "0.8rem", color: "#64748b", minWidth: 30 }}>{night.deepDuration ? Math.round(night.deepDuration / 60) + 'h' : '-'}</span>
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                            <div style={{ width: 40, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: `${remPct}%`, height: "100%", background: "#3b82f6" }} />
                            </div>
                            <span style={{ fontSize: "0.8rem", color: "#64748b", minWidth: 30 }}>{night.remDuration ? Math.round(night.remDuration / 60) + 'h' : '-'}</span>
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "center", color: "#475569" }}>
                          {night.lightDuration ? Math.round(night.lightDuration / 60) + 'h' : '-'}
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "center", color: "#64748b" }}>
                          {night.awakeDuration ? Math.round(night.awakeDuration / 60) + 'h' : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div style={{
          marginTop: "2rem",
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          borderRadius: 16,
          padding: "1.5rem",
          color: "white"
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>📈 Sleep Stages Explained</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: "#8b5cf6" }} />
              <div>
                <div style={{ fontWeight: 500 }}>Deep (SWS)</div>
                <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>Physical recovery, immune function</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: "#3b82f6" }} />
              <div>
                <div style={{ fontWeight: 500 }}>REM</div>
                <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>Memory consolidation, learning</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: "#94a3b8" }} />
              <div>
                <div style={{ fontWeight: 500 }}>Light</div>
                <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>Transition, maintenance</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
