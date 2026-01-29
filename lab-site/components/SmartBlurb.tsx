// filepath: c:\Users\User\lab-site\components\Header.js
import React from "react";
import { useRouter } from "next/router";

const Header = () => {
  const router = useRouter();

  const navigateTo = (page) => {
    router.push(`/${page}`);
  };

  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="flex justify-between">
        <h1 className="text-xl font-bold">Health Dashboard</h1>
        <div>
          <button
            onClick={() => navigateTo("lipids")}
            className="mr-4 hover:underline"
          >
            Lipids
          </button>
          <button
            onClick={() => navigateTo("hormones")}
            className="hover:underline"
          >
            Hormones
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;