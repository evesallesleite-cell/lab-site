import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLoggedIn = localStorage.getItem("loggedIn") === "true";
      setLoggedIn(isLoggedIn);
      if (!isLoggedIn) {
        router.push("/");
      }
    }
  }, [router]);

  const categories = [
    {
      title: "🤖 Eve AI",
      description: "Your personal health AI assistant with proactive insights",
      icon: "🤖",
      color: "from-indigo-500 to-purple-600",
      items: [
        { name: "Chat with Eve", href: "/eve", description: "Ask questions about your health data, supplements, and get personalized recommendations" },
        { name: "Proactive Insights", href: "/eve-insights", description: "AI-powered analysis of your WHOOP, blood tests, and supplement data" }
      ]
    },
    {
      title: "Whoop Data",
      description: "Sleep, strain, and recovery insights from your Whoop device",
      icon: "⌚",
      color: "from-blue-500 to-blue-600",
      items: [
        { name: "Sleep", href: "/whoop/sleep", description: "Sleep stages, efficiency, and quality metrics" },
        { name: "Strain", href: "/whoop/strain", description: "Daily strain scores and workout analysis" },
        { name: "Recovery", href: "/whoop/recovery", description: "Recovery scores and readiness metrics" }
      ]
    },
    {
      title: "Blood Test Results",
      description: "Comprehensive lab results and AI-powered insights",
      icon: "🔬",
      color: "from-red-500 to-red-600",
      items: [
        { name: "Lipids", href: "/blood-tests/lipids", description: "Cholesterol, HDL, LDL, triglycerides analysis" },
        { name: "Hormones", href: "/blood-tests/hormones", description: "Hormone levels and endocrine system health" },
        { name: "Upload Data", href: "/data-management/upload", description: "Upload new lab results and blood test data" }
      ]
    },
    {
      title: "Specialized Reports",
      description: "Advanced metabolic and digestive health analysis",
      icon: "🧬",
      color: "from-purple-500 to-purple-600",
      items: [
        { name: "Metabolomics", href: "/blood-tests/metabolomics", description: "Comprehensive metabolite analysis and pathways" },
        { name: "LifeCode", href: "/medical/lifecode", description: "Genetic insights and personalized recommendations" },
        { name: "Digestive System", href: "/medical/digestive-unified", description: "Gut health and microbiome analysis" }
      ]
    },
    {
      title: "Physical Metrics",
      description: "Body composition and physical health tracking",
      icon: "📊",
      color: "from-green-500 to-green-600",
      items: [
        { name: "Body Metrics", href: "/medical/body", description: "Physical measurements and body composition" }
      ]
    },
    {
      title: "Supplements & Nutrition",
      description: "Daily supplement regimen and nutritional support",
      icon: "💊",
      color: "from-orange-500 to-orange-600",
      items: [
        { name: "Supplement Stack", href: "/supplement-stack", description: "Complete daily supplement regimen with dosages, timing, and benefits" }
      ]
    }
  ];

  if (!loggedIn) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Checking authentication...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Health Dashboard</h1>
              <p className="text-gray-600 mt-1">Your comprehensive health and wellness hub</p>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem("loggedIn");
                router.push("/");
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Health Hub</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access your sleep data, strain metrics, lab results, and health insights all in one place. 
            Click on any category below to explore your data.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              {/* Category Header */}
              <div className={`bg-gradient-to-r ${category.color} p-6 text-white`}>
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{category.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold">{category.title}</h3>
                    <p className="text-white/90 text-sm">{category.description}</p>
                  </div>
                </div>
              </div>

              {/* Category Items */}
              <div className="p-6 space-y-3">
                {category.items.map((item, itemIndex) => (
                  <Link
                    key={itemIndex}
                    href={item.href}
                    className="block group"
                  >
                    <div className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group-hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        </div>
                        <svg 
                          className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats or Additional Info */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">🔄</span>
                </div>
                <h4 className="font-semibold text-gray-900">Auto-Sync Data</h4>
                <p className="text-sm text-gray-600">
                  Your Whoop data syncs automatically. Visit any dashboard to see the latest metrics.
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">📈</span>
                </div>
                <h4 className="font-semibold text-gray-900">AI Insights</h4>
                <p className="text-sm text-gray-600">
                  Get intelligent analysis of your health data with personalized recommendations.
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">⚡</span>
                </div>
                <h4 className="font-semibold text-gray-900">Fast & Offline</h4>
                <p className="text-sm text-gray-600">
                  Browse your historical data instantly. Update only when you want fresh insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
