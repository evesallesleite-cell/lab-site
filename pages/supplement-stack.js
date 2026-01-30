import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("../components/header"), { ssr: false });

// Supplement data organized by timing
const supplementData = [
  {
    id: 1,
    name: "B6 + B9 + B12 Complex",
    category: "Vitamins",
    dosage: "1 pill",
    details: "3mg B6 + 20mg B9 + 0.4mg + 1mg B12",
    timing: "Pre-breakfast",
    frequency: "Daily",
    benefits: "Energy, mood, methylation",
    brand: "Control Vita",
    storage: "Pantry",
    quantity: "60 pills"
  },
  {
    id: 2,
    name: "Magnesium Dimalate",
    category: "Minerals",
    dosage: "1 pill (500mg)",
    timing: "Pre-breakfast",
    frequency: "Daily",
    benefits: "Muscle relaxation, sleep, energy",
    brand: "Control Vita",
    storage: "Pantry",
    quantity: "60 pills"
  },
  {
    id: 3,
    name: "Taurine",
    category: "Amino Acids",
    dosage: "2 pills (1000mg)",
    timing: "Pre-breakfast",
    frequency: "Daily",
    benefits: "Heart, performance, antioxidant",
    brand: "Control Vita",
    storage: "Pantry",
    quantity: "120 pills"
  },
  {
    id: 4,
    name: "NAC",
    category: "Antioxidants",
    dosage: "2 pills (800mg)",
    timing: "Pre-breakfast",
    frequency: "Daily",
    benefits: "Liver detox, glutathione",
    brand: "Control Vita",
    storage: "Pantry",
    quantity: "120 pills"
  },
  {
    id: 5,
    name: "NMN",
    category: "Longevity",
    dosage: "2 pills (350mg)",
    timing: "Pre-breakfast",
    frequency: "Daily",
    benefits: "Cellular energy, NAD+",
    brand: "iHerb",
    storage: "Fridge",
    quantity: "60 pills"
  },
  {
    id: 6,
    name: "PQQ CoQ10",
    category: "Mitochondrial",
    dosage: "20mg",
    timing: "Morning",
    frequency: "Daily",
    benefits: "Mitochondria, energy",
    brand: "Various",
    storage: "Unknown",
    quantity: "Unknown"
  },
  {
    id: 7,
    name: "Testofen",
    category: "Hormonal",
    dosage: "1 pill (300mg)",
    timing: "Breakfast",
    frequency: "Daily",
    benefits: "Testosterone, libido",
    brand: "Control Vita",
    storage: "Pantry",
    quantity: "60 pills"
  },
  {
    id: 8,
    name: "CDP-Choline",
    category: "Nootropics",
    dosage: "1 pill (300mg)",
    timing: "Breakfast",
    frequency: "Daily",
    benefits: "Focus, memory",
    brand: "Control Vita",
    storage: "Pantry",
    quantity: "60 pills"
  },
  {
    id: 9,
    name: "Lion's Mane",
    category: "Nootropics",
    dosage: "2 pills (1000mg)",
    timing: "Breakfast",
    frequency: "Daily",
    benefits: "Cognitive, nerve growth",
    brand: "Control Vita",
    storage: "Pantry",
    quantity: "120 pills"
  },
  {
    id: 10,
    name: "Omega-3",
    category: "Essential Fats",
    dosage: "3 pills",
    details: "1620mg EPA + 1080mg DHA",
    timing: "Breakfast",
    frequency: "Daily",
    benefits: "Heart, brain, inflammation",
    brand: "Control Vita",
    storage: "Fridge",
    quantity: "60 pills"
  },
  {
    id: 11,
    name: "Collagen + Pepti Strong",
    category: "Structural",
    dosage: "1 pack",
    details: "10g Collagen + 2.4g Pepti Strong",
    timing: "Breakfast",
    frequency: "Daily",
    benefits: "Skin, joints, muscle",
    brand: "Control Vita",
    storage: "Pantry",
    quantity: "60 packs"
  },
  {
    id: 12,
    name: "Beta-Alanine",
    category: "Pre-Workout",
    dosage: "1 scoop (3g)",
    timing: "Pre-Workout",
    frequency: "Daily",
    benefits: "Endurance, lactic buffer",
    brand: "Control Vita",
    storage: "Pantry",
    quantity: "300g"
  },
  {
    id: 13,
    name: "Creatine",
    category: "Performance",
    dosage: "1 scoop (5g)",
    timing: "Pre-Workout",
    frequency: "Daily",
    benefits: "Strength, power, recovery",
    brand: "Amazon",
    storage: "Pantry",
    quantity: "2kg"
  },
  {
    id: 14,
    name: "Pre-Workout Complex",
    category: "Pre-Workout",
    dosage: "1 scoop (10g)",
    timing: "Pre-Workout",
    frequency: "Training Days",
    benefits: "Energy, focus, pump",
    brand: "Amazon",
    storage: "Pantry",
    quantity: "600g"
  },
  {
    id: 15,
    name: "L-Citrulline",
    category: "Pre-Workout",
    dosage: "2 scoops (10g)",
    timing: "Pre-Workout",
    frequency: "Training Days",
    benefits: "Blood flow, pumps, endurance",
    brand: "Control Vita",
    storage: "Pantry",
    quantity: "300g"
  },
  {
    id: 16,
    name: "Vinitrox",
    category: "Performance",
    dosage: "1 pill (100mg)",
    timing: "Pre-Workout",
    frequency: "Daily",
    benefits: "Endurance, VO2 max",
    brand: "Control Vita",
    storage: "Pantry",
    quantity: "60 pills"
  },
  {
    id: 17,
    name: "Whey Protein",
    category: "Protein",
    dosage: "2 scoops",
    details: "25g protein",
    timing: "Post-Workout",
    frequency: "Daily",
    benefits: "Muscle growth, recovery",
    brand: "Amazon",
    storage: "Pantry",
    quantity: "4kg"
  },
  {
    id: 18,
    name: "Tart Cherry",
    category: "Recovery",
    dosage: "2 pills (1000mg)",
    timing: "Before Bed",
    frequency: "Daily",
    benefits: "Sleep, inflammation",
    brand: "Control Vita",
    storage: "Pantry",
    quantity: "120 pills"
  },
  {
    id: 19,
    name: "Glycine",
    category: "Sleep Support",
    dosage: "1 scoop (5g)",
    timing: "Before Bed",
    frequency: "Daily",
    benefits: "Sleep quality, relaxation",
    brand: "Control Vita",
    storage: "Pantry",
    quantity: "300g"
  }
];

// Organize by timing
const timeSlots = [
  { key: "Pre-breakfast", label: "🌅 Pre-Breakfast", color: "#f97316", bg: "#fff7ed" },
  { key: "Morning", label: "☀️ Morning", color: "#eab308", bg: "#fefce8" },
  { key: "Breakfast", label: "🍳 Breakfast", color: "#22c55e", bg: "#f0fdf4" },
  { key: "Pre-Workout", label: "🔥 Pre-Workout", color: "#ef4444", bg: "#fef2f2" },
  { key: "Post-Workout", label: "💪 Post-Workout", color: "#ec4899", bg: "#fdf2f8" },
  { key: "Before Bed", label: "🌙 Before Bed", color: "#6366f1", bg: "#eef2ff" }
];

const categoryIcons = {
  "Vitamins": "🟡",
  "Minerals": "🔵",
  "Amino Acids": "🟣",
  "Antioxidants": "🛡️",
  "Longevity": "⭐",
  "Mitochondrial": "⚡",
  "Hormonal": "💪",
  "Nootropics": "🧠",
  "Essential Fats": "🐟",
  "Structural": "🏗️",
  "Pre-Workout": "🔥",
  "Performance": "💥",
  "Protein": "🥤",
  "Recovery": "💤",
  "Sleep Support": "🌙"
};

export default function SupplementStack() {
  const [viewMode, setViewMode] = useState("timeline"); // "timeline" or "category"
  const [searchTerm, setSearchTerm] = useState("");

  // Filter supplements
  const filteredSupplements = supplementData.filter(supplement =>
    searchTerm === "" ||
    supplement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplement.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplement.benefits.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by time
  const supplementsByTime = {};
  timeSlots.forEach(slot => {
    supplementsByTime[slot.key] = filteredSupplements.filter(s => s.timing === slot.key);
  });

  // Group by category
  const supplementsByCategory = {};
  filteredSupplements.forEach(supplement => {
    if (!supplementsByCategory[supplement.category]) {
      supplementsByCategory[supplement.category] = [];
    }
    supplementsByCategory[supplement.category].push(supplement);
  });

  // Stats
  const stats = {
    total: supplementData.length,
    daily: supplementData.filter(s => s.frequency === "Daily").length,
    trainingDays: supplementData.filter(s => s.frequency === "Training Days").length,
    categories: Object.keys(supplementsByCategory).length
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Header />
      
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "2rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
            💊 Daily Supplement Stack
          </h1>
          <p style={{ color: "#64748b" }}>
            {stats.total} supplements • {stats.daily} daily • {stats.trainingDays} training days only
          </p>
        </div>

        {/* Search & View Toggle */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "280px", position: "relative" }}>
            <input
              type="text"
              placeholder="🔍 Search supplements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 2.5rem",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                fontSize: "0.95rem",
                outline: "none"
              }}
            />
            <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "1rem" }}>🔍</span>
          </div>
          
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setViewMode("timeline")}
              style={{
                padding: "0.75rem 1.25rem",
                background: viewMode === "timeline" ? "#3b82f6" : "white",
                color: viewMode === "timeline" ? "white" : "#64748b",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              📅 By Time
            </button>
            <button
              onClick={() => setViewMode("category")}
              style={{
                padding: "0.75rem 1.25rem",
                background: viewMode === "category" ? "#3b82f6" : "white",
                color: viewMode === "category" ? "white" : "#64748b",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                fontWeight: 500,
                cursor: "pointer"
              }}
              >
              📁 By Category
            </button>
          </div>
        </div>

        {/* Timeline View */}
        {viewMode === "timeline" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {timeSlots.map(slot => {
              const supplements = supplementsByTime[slot.key] || [];
              if (supplements.length === 0) return null;
              
              return (
                <div key={slot.key} style={{
                  background: "white",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}>
                  {/* Time Slot Header */}
                  <div style={{
                    background: slot.bg,
                    padding: "1rem 1.5rem",
                    borderBottom: `3px solid ${slot.color}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem"
                  }}>
                    <span style={{ fontSize: "1.5rem" }}>{slot.label.split(" ")[0]}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{slot.label.replace(/^\S+\s/, "")}</div>
                      <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{supplements.length} supplement{supplements.length !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                  
                  {/* Supplements Grid */}
                  <div style={{ padding: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                    {supplements.map(supplement => (
                      <div key={supplement.id} style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: "1rem",
                        transition: "all 0.2s"
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                          <span style={{ fontSize: "1.5rem" }}>{categoryIcons[supplement.category] || "💊"}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: "0.25rem" }}>
                              {supplement.name}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>
                              {supplement.category}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{
                          background: "#f8fafc",
                          borderRadius: 8,
                          padding: "0.75rem",
                          marginTop: "0.75rem"
                        }}>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>DOSAGE</div>
                          <div style={{ fontWeight: 600, color: "#0f172a" }}>{supplement.dosage}</div>
                          {supplement.details && (
                            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
                              {supplement.details}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                          <span style={{
                            padding: "0.25rem 0.5rem",
                            background: "#dbeafe",
                            color: "#1e40af",
                            borderRadius: 6,
                            fontSize: "0.75rem",
                            fontWeight: 500
                          }}>
                            {supplement.frequency}
                          </span>
                          <span style={{
                            padding: "0.25rem 0.5rem",
                            background: "#f1f5f9",
                            color: "#475569",
                            borderRadius: 6,
                            fontSize: "0.75rem"
                          }}>
                            {supplement.brand}
                          </span>
                        </div>
                        
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.5rem" }}>
                          {supplement.benefits}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Category View */}
        {viewMode === "category" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {Object.entries(supplementsByCategory).map(([category, supplements]) => (
              <div key={category} style={{
                background: "white",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                {/* Category Header */}
                <div style={{
                  background: "#f8fafc",
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem"
                }}>
                  <span style={{ fontSize: "1.5rem" }}>{categoryIcons[category] || "💊"}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{category}</div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{supplements.length} supplement{supplements.length !== 1 ? "s" : ""}</div>
                  </div>
                </div>
                
                {/* Supplements List */}
                <div style={{ padding: "1rem" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                        <th style={{ textAlign: "left", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>SUPPLEMENT</th>
                        <th style={{ textAlign: "left", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>DOSAGE</th>
                        <th style={{ textAlign: "left", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>TIMING</th>
                        <th style={{ textAlign: "left", padding: "0.75rem", color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}>BENEFITS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplements.map(supplement => (
                        <tr key={supplement.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.75rem" }}>
                            <div style={{ fontWeight: 500, color: "#0f172a" }}>{supplement.name}</div>
                            <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{supplement.brand} • {supplement.quantity}</div>
                          </td>
                          <td style={{ padding: "0.75rem", color: "#0f172a" }}>
                            {supplement.dosage}
                            {supplement.details && (
                              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{supplement.details}</div>
                            )}
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            <span style={{
                              padding: "0.25rem 0.5rem",
                              background: "#f1f5f9",
                              borderRadius: 6,
                              fontSize: "0.8rem",
                              color: "#475569"
                            }}>
                              {supplement.timing}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem", color: "#64748b", fontSize: "0.85rem" }}>
                            {supplement.benefits}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Reference Card */}
        <div style={{
          marginTop: "2rem",
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          borderRadius: 16,
          padding: "1.5rem",
          color: "white"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>📋 Quick Reference</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.25rem" }}>Morning Total</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                {(supplementsByTime["Pre-breakfast"]?.length || 0) + (supplementsByTime["Morning"]?.length || 0) + (supplementsByTime["Breakfast"]?.length || 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.25rem" }}>Workout</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                {(supplementsByTime["Pre-Workout"]?.length || 0) + (supplementsByTime["Post-Workout"]?.length || 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.25rem" }}>Evening</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                {supplementsByTime["Before Bed"]?.length || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.25rem" }}>Categories</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{stats.categories}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
