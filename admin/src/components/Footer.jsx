import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-8">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-center items-center gap-2 text-sm text-gray-600 text-center md:text-left">
        <p>
          © {new Date().getFullYear()}{" "}
          <span>
            YourCompany {" "}
          </span>
          Admin Panel. All rights reserved.
        </p>
        <p>
          Developed by{" "}
          <a
            href="https://jawumitech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black font-medium hover:underline transition-colors"
          >
            JawumiTech
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
