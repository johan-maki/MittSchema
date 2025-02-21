
import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB]">
      <header className="border-b bg-white">
        <div className="flex h-14 items-center px-4 gap-8">
          <Link to="/" className="flex items-center gap-2 font-semibold text-2xl">
            <span className="text-[#0FA0CE]">Vårdschema</span>
            <span className="text-red-500">*</span>
          </Link>
          <nav className="flex items-center space-x-1 flex-1">
            <Link 
              to="/schedule" 
              className="px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#F1F1F1] rounded-md"
            >
              Schema
            </Link>
            <Link 
              to="/directory" 
              className="px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#F1F1F1] rounded-md"
            >
              Personal
            </Link>
          </nav>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logga ut
          </button>
        </div>
      </header>
      <main className="flex-1 animate-fadeIn">
        {children}
      </main>
    </div>
  );
};
