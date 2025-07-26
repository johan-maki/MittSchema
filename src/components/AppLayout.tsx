
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Menu, UserCircle2, HelpCircle, Moon, Sun } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check localStorage and system preferences on mount
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    setIsDark(savedTheme === "dark" || (!savedTheme && systemPrefersDark));
    
    // Apply the theme
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isDark);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const NavLinks = () => (
    <>
      <Link 
        to="/schedule" 
        className="px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#F1F1F1] rounded-md dark:text-white dark:hover:bg-gray-800"
      >
        Schema
      </Link>
      <Link 
        to="/directory" 
        className="px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#F1F1F1] rounded-md dark:text-white dark:hover:bg-gray-800"
      >
        Personal
      </Link>
      <Link 
        to="/employee" 
        className="px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#F1F1F1] rounded-md flex items-center gap-1 dark:text-white dark:hover:bg-gray-800"
      >
        <UserCircle2 className="w-4 h-4" />
        Anställda vy
      </Link>
      <Link 
        to="/help" 
        className="px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#F1F1F1] rounded-md flex items-center gap-1 dark:text-white dark:hover:bg-gray-800"
      >
        <HelpCircle className="w-4 h-4" />
        Hjälp
      </Link>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB] dark:bg-gray-900 transition-colors duration-200">
      <header className="border-b bg-white dark:bg-gray-800 dark:border-gray-700 sticky top-0 z-50">
        <div className="flex h-14 items-center px-4 gap-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-xl sm:text-2xl">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Vårdschema</span>
            <span className="text-sm text-gray-500 font-normal ml-2">• Karolinska</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 flex-1">
            <NavLinks />
          </nav>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger className="md:hidden ml-auto">
              <Menu className="h-6 w-6 dark:text-white" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[200px] dark:bg-gray-800 dark:text-white">
              <div className="flex flex-col gap-2 pt-4">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="mr-2"
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-yellow-500 transition-all" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700 transition-all" />
            )}
          </Button>

          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900 hidden md:block dark:text-gray-300 dark:hover:text-white"
          >
            Logga ut
          </button>
        </div>
      </header>
      <main className="flex-1 animate-fadeIn dark:text-white">
        {children}
      </main>
    </div>
  );
};
