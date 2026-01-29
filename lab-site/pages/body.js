// filepath: c:\Users\User\lab-site\components\Header.js
import React from "react";
import { useRouter } from "next/router";

const Header = () => {
  const router = useRouter();

  const handleNavigation = (page) => {
    router.push(`/${page}`);
  };

  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="flex justify-between">
        <h1 className="text-xl font-bold">Health Dashboard</h1>
        <div>
          <button
            onClick={() => handleNavigation("lipids")}
            className="mx-2 text-gray-300 hover:text-white"
          >
            Lipids
          </button>
          <button
            onClick={() => handleNavigation("hormones")}
            className="mx-2 text-gray-300 hover:text-white"
          >
            Hormones
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;