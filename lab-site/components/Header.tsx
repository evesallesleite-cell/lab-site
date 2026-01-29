// filepath: c:\Users\User\lab-site\components\Header.js
import React from "react";
import { useRouter } from "next/router";

const Header = () => {
  const router = useRouter();
  
  const handleNavigation = (page) => {
    router.push(`/${page}`);
  };

  return (
    <header className="flex justify-between items-center p-4 bg-gray-800 text-white">
      <h1 className="text-xl font-bold">Health Dashboard</h1>
      <nav>
        <ul className="flex space-x-4">
          <li>
            <button 
              onClick={() => handleNavigation("lipids")} 
              className={`hover:underline ${router.pathname === "/lipids" ? "font-bold" : ""}`}
            >
              Lipids
            </button>
          </li>
          <li>
            <button 
              onClick={() => handleNavigation("hormones")} 
              className={`hover:underline ${router.pathname === "/hormones" ? "font-bold" : ""}`}
            >
              Hormones
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;