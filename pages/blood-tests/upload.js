import { useState } from "react";

export default function BloodworkUploadPage() {
  const [status, setStatus] = useState("");
  const [instructions, setInstructions] = useState(true);

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", fontFamily: "Inter, system-ui, sans-serif", padding: "0 1rem" }}>
      <h1 style={{ marginBottom: 8 }}>📋 Bloodwork Analysis</h1>
      
      <div style={{ 
        background: "#f0f9ff", 
        border: "1px solid #bae6fd", 
        borderRadius: 12, 
        padding: "1.5rem",
        marginBottom: "1.5rem"
      }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "1.1rem", color: "#0369a1" }}>
          How to submit bloodwork
        </h2>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8, color: "#334155" }}>
          <li>Take a photo or screenshot of your bloodwork PDF/lab results</li>
          <li>Send the image directly to <strong>Eve</strong> (this assistant)</li>
          <li>I'll analyze the results and provide:</li>
          <ul style={{ marginTop: 4 }}>
            <li>Extracted data in structured format</li>
            <li>Interpretation of each marker</li>
            <li>Recommendations based on your results</li>
          </ul>
        </ol>
        <p style={{ marginTop: 16, color: "#64748b", fontSize: "0.95rem" }}>
          💡 <strong>Tip:</strong> Send clear photos of each page. If there are multiple tests, 
          send them one at a time for better analysis.
        </p>
      </div>

      <div style={{ 
        background: "#f0fdf4", 
        border: "1px solid #86efac", 
        borderRadius: 12, 
        padding: "1.5rem"
      }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "1.1rem", color: "#15803d" }}>
          Why this approach?
        </h2>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8, color: "#334155" }}>
          <li><strong>More accurate:</strong> I can see charts, formatting, and context that automated systems miss</li>
          <li><strong>Personalized:</strong> I consider your historical data and trends</li>
          <li><strong>Conversational:</strong> Ask follow-up questions about any marker</li>
          <li><strong>No API costs:</strong> Direct analysis without external AI services</li>
        </ul>
      </div>

      <div style={{ marginTop: "2rem", padding: "1rem", background: "#fafafa", borderRadius: 8 }}>
        <h3 style={{ margin: "0 0 8px 0" }}>Example workflow:</h3>
        <code style={{ display: "block", background: "#fff", padding: "1rem", borderRadius: 6, fontSize: "0.9rem" }}>
          You: "Eve, here's my latest bloodwork" [sends image]<br/><br/>
          Eve: "I see your LDL cholesterol is 95 mg/dL (optimal), HDL is 58 mg/dL (excellent), 
          and triglycerides are 82 mg/dL. Your lipid panel looks great overall. However, your 
          vitamin D is 28 ng/mL - slightly low. Consider... [detailed analysis]"
        </code>
      </div>
    </div>
  );
}
