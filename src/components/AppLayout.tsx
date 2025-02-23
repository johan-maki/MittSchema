
import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const NavLinks = () => (
    <>
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
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB]">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="flex h-14 items-center px-4 gap-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-xl sm:text-2xl">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Vårdschema</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 flex-1">
            <NavLinks />
          </nav>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger className="md:hidden ml-auto">
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[200px]">
              <div className="flex flex-col gap-2 pt-4">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>

          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900 hidden md:block"
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
