import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [isWhoopDropdownOpen, setIsWhoopDropdownOpen] = useState(false);
  const [isBloodTestDropdownOpen, setIsBloodTestDropdownOpen] = useState(false);
  const [isSpecializedDropdownOpen, setIsSpecializedDropdownOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check localStorage for authentication
      const isLoggedIn = localStorage.getItem('lab-logged-in') === 'true';
      setLoggedIn(isLoggedIn);
    }
  }, [router.pathname]);

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem('lab-logged-in');
      localStorage.removeItem('lab-password');
      document.cookie = 'lab-access=; path=/; max-age=0';
      setLoggedIn(false);
      router.push("/login");
    }
  }

  const navStyle = { display: "flex", gap: 12, alignItems: "center" };
  const headerStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, borderBottom: "1px solid #eee", background: "#fff" };
  const linkStyle = { textDecoration: "none", color: "#111" };

  const dropdownStyle = {
    position: "relative",
    display: "inline-block",
  };

  const dropdownButtonStyle = {
    ...linkStyle,
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "inherit",
    fontFamily: "inherit",
  };

  const dropdownContentStyle = {
    display: isWhoopDropdownOpen ? "block" : "none",
    position: "absolute",
    backgroundColor: "#fff",
    minWidth: "120px",
    boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
    zIndex: 1,
    border: "1px solid #ddd",
    borderRadius: "4px",
    top: "100%",
    left: 0,
  };

  const bloodTestDropdownContentStyle = {
    display: isBloodTestDropdownOpen ? "block" : "none",
    position: "absolute",
    backgroundColor: "#fff",
    minWidth: "120px",
    boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
    zIndex: 1,
    border: "1px solid #ddd",
    borderRadius: "4px",
    top: "100%",
    left: 0,
  };

  const specializedDropdownContentStyle = {
    display: isSpecializedDropdownOpen ? "block" : "none",
    position: "absolute",
    backgroundColor: "#fff",
    minWidth: "160px",
    boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
    zIndex: 1,
    border: "1px solid #ddd",
    borderRadius: "4px",
    top: "100%",
    left: 0,
  };

  const dropdownLinkStyle = {
    ...linkStyle,
    color: "#111",
    padding: "8px 12px",
    textDecoration: "none",
    display: "block",
  };

  return (
    <header style={headerStyle}>
      {loggedIn && (
      <nav style={navStyle}>
        <Link href="/home" style={{ ...linkStyle, fontWeight: 600 }}>Home</Link>
        <Link href="/data-management/upload" style={linkStyle}>Upload</Link>
        <Link href="/medical/body" style={linkStyle}>Body</Link>
        
        <Link href="/supplement-stack" style={linkStyle}>
          Supplement Stack
        </Link>
        
        <Link href="/personal-ai" style={linkStyle}>
          Personal AI
        </Link>
        
        <div style={dropdownStyle}>
          <button 
            style={dropdownButtonStyle}
            onClick={() => setIsBloodTestDropdownOpen(!isBloodTestDropdownOpen)}
            onBlur={() => setTimeout(() => setIsBloodTestDropdownOpen(false), 150)}
          >
            Blood Test
            <span style={{ transform: isBloodTestDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              ▼
            </span>
          </button>
          <div style={bloodTestDropdownContentStyle}>
            <Link 
              href="/blood-tests/lipids" 
              style={dropdownLinkStyle}
              onMouseDown={(e) => e.preventDefault()}
            >
              Lipids
            </Link>
            <Link 
              href="/blood-tests/hormones" 
              style={dropdownLinkStyle}
              onMouseDown={(e) => e.preventDefault()}
            >
              Hormones
            </Link>
          </div>
        </div>
        
        <div style={dropdownStyle}>
          <button 
            style={dropdownButtonStyle}
            onClick={() => setIsSpecializedDropdownOpen(!isSpecializedDropdownOpen)}
            onBlur={() => setTimeout(() => setIsSpecializedDropdownOpen(false), 150)}
          >
            Specialized
            <span style={{ transform: isSpecializedDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              ▼
            </span>
          </button>
          <div style={specializedDropdownContentStyle}>
            <Link 
              href="/blood-tests/metabolomics" 
              style={dropdownLinkStyle}
              onMouseDown={(e) => e.preventDefault()}
            >
              Metabolomics
            </Link>
            <Link 
              href="/medical/lifecode" 
              style={dropdownLinkStyle}
              onMouseDown={(e) => e.preventDefault()}
            >
              LifeCode
            </Link>
            <Link 
              href="/medical/digestive-unified" 
              style={dropdownLinkStyle}
              onMouseDown={(e) => e.preventDefault()}
            >
              Digestive System Analysis
            </Link>
            <Link 
              href="/medical/simple-pdf" 
              style={dropdownLinkStyle}
              onMouseDown={(e) => e.preventDefault()}
            >
              Simple PDF Extractor
            </Link>
          </div>
        </div>
        
        <div style={dropdownStyle}>
          <button 
            style={dropdownButtonStyle}
            onClick={() => setIsWhoopDropdownOpen(!isWhoopDropdownOpen)}
            onBlur={() => setTimeout(() => setIsWhoopDropdownOpen(false), 150)}
          >
            Whoop
            <span style={{ transform: isWhoopDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              ▼
            </span>
          </button>
          <div style={dropdownContentStyle}>
            <Link 
              href="/whoop/sleep" 
              style={dropdownLinkStyle}
              onMouseDown={(e) => e.preventDefault()}
            >
              Sleep
            </Link>
            <Link 
              href="/whoop/strain" 
              style={dropdownLinkStyle}
              onMouseDown={(e) => e.preventDefault()}
            >
              Strain
            </Link>
            <Link 
              href="/whoop/recovery" 
              style={dropdownLinkStyle}
              onMouseDown={(e) => e.preventDefault()}
            >
              Recovery
            </Link>
          </div>
        </div>
      </nav>
      )}

      <div>
        {loggedIn ? (
          <button onClick={handleLogout} style={{ padding: "6px 10px", borderRadius: 8, background: "#111", color: "#fff", border: "none", cursor: "pointer" }}>
            Logout
          </button>
        ) : (
          <Link href="/login" style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", textDecoration: "none" }}>
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
