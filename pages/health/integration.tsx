import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchHealthData } from "../../lib/clawdbot-integration";

export default function HealthIntegrationPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthData()
      .then(data => {
        setHealthData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔄</div>
          <p>Loading health data from Clawdbot...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
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
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>📊 Full Health Report</h1>
          <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Clawdbot Health API Integration</p>
        </div>
        <Link href="/home" style={{
          padding: "0.5rem 1rem",
          background: "#3b82f6",
          color: "white",
          borderRadius: 8,
          textDecoration: "none",
          fontSize: "0.9rem"
        }}>
          ← Back to Hub
        </Link>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
        {/* Data Source Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          background: healthData ? "#f0fdf4" : "#fef3c7",
          color: healthData ? "#16a34a" : "#d97706",
          borderRadius: 20,
          fontSize: "0.85rem",
          marginBottom: "1.5rem"
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "currentColor"
          }}></span>
          Data Source: {healthData ? "Clawdbot (Live)" : "Demo Mode"}
        </div>

        {/* Timestamp */}
        {healthData?.timestamp && (
          <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Last updated: {new Date(healthData.timestamp).toLocaleString()}
          </p>
        )}

        {/* WHOOP Data */}
        {healthData?.whoop && (
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>
              ⌚ Whoop Data
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem"
            }}>
              <MetricCard label="Recovery Score" value={`${healthData.whoop.recovery_score}%`} icon="🔋" />
              <MetricCard label="Resting HR" value={`${healthData.whoop.resting_heart_rate} bpm`} icon="❤️" />
              <MetricCard label="HRV" value={`${healthData.whoop.hrv} ms`} icon="📈" />
              <MetricCard label="SpO2" value={`${healthData.whoop.spo2}%`} icon="🫁" />
              <MetricCard label="Skin Temp" value={`${healthData.whoop.skin_temp}°C`} icon="🌡️" />
              <MetricCard label="Strain" value={healthData.whoop.strain.toFixed(1)} icon="💪" />
            </div>
          </div>
        )}

        {/* Profile Data */}
        {healthData?.profile && (
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>
              👤 João's Profile
            </h2>
            
            {/* Goals */}
            {healthData.profile.goals && healthData.profile.goals.length > 0 && (
              <div style={{
                background: "white",
                borderRadius: 16,
                padding: "1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                marginBottom: "1rem"
              }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#0f172a", marginBottom: "0.75rem" }}>
                  🎯 Active Goals
                </h3>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#475569" }}>
                  {healthData.profile.goals.map((goal: string, i: number) => (
                    <li key={i} style={{ marginBottom: "0.5rem" }}>{goal}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Latest Health Metrics */}
            {healthData.profile.latest_health && healthData.profile.latest_health.length > 0 && (
              <div style={{
                background: "white",
                borderRadius: 16,
                padding: "1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#0f172a", marginBottom: "0.75rem" }}>
                  📋 Latest Health Metrics
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {healthData.profile.latest_health.map((metric: any, i: number) => (
                    <div key={i} style={{
                      padding: "0.75rem 1rem",
                      background: "#f8fafc",
                      borderRadius: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <span style={{ color: "#0f172a" }}>{metric.metric}</span>
                      <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{metric.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* API Info */}
        <div style={{
          background: "#1e293b",
          borderRadius: 16,
          padding: "1.5rem",
          color: "white"
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
            🔗 API Integration Details
          </h3>
          <div style={{ fontSize: "0.9rem", opacity: 0.9, lineHeight: 1.8 }}>
            <p><strong>Endpoint:</strong> http://localhost:3002/api/health</p>
            <p><strong>Source:</strong> Clawdbot Knowledge Graph + WHOOP API</p>
            <p><strong>Status:</strong> {healthData ? "✅ Connected" : "❌ Disconnected"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{
      background: "white",
      borderRadius: 12,
      padding: "1.25rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    }}>
      <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{icon}</div>
      <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.25rem" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>{value}</div>
    </div>
  );
}
