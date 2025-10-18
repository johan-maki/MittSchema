
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, UserCircle2, HelpCircle, MapPin, Sun, Moon, Sparkles, Menu, Users } from 'lucide-react';
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
        className="group px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-150 flex items-center gap-2 dark:text-white dark:hover:bg-gray-700 dark:hover:text-indigo-400"
      >
        <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
        Schema
      </Link>
      <Link 
        to="/directory" 
        className="group px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-150 flex items-center gap-2 dark:text-white dark:hover:bg-gray-700 dark:hover:text-indigo-400"
      >
        <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
        Personalkatalog
      </Link>
      <Link 
        to="/employee" 
        className="group px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-150 flex items-center gap-2 dark:text-white dark:hover:bg-gray-700 dark:hover:text-indigo-400"
      >
        <UserCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
        Anställdas vy
      </Link>
      <Link 
        to="/route-planning" 
        className="group px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-150 flex items-center gap-2 dark:text-white dark:hover:bg-gray-700 dark:hover:text-indigo-400"
      >
        <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
        Slingplanering
      </Link>
      <Link 
        to="/help" 
        className="group px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-150 flex items-center gap-2 dark:text-white dark:hover:bg-gray-700 dark:hover:text-indigo-400"
      >
        <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
        Hjälp
      </Link>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50/20 dark:bg-gray-900 transition-colors duration-200">
      <header className="border-b bg-white/80 backdrop-blur-md dark:bg-gray-800 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="flex h-14 items-center px-4 gap-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-xl sm:text-2xl group">
            <Sparkles className="w-5 h-5 text-indigo-600 group-hover:rotate-12 transition-transform" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Vårdschema</span>
            <span className="text-xs sm:text-sm text-gray-500 font-normal ml-2">• Karolinska</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 flex-1">
            <NavLinks />
          </nav>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger className="md:hidden ml-auto">
              <Menu className="h-6 w-6 dark:text-white hover:text-indigo-600 transition-colors" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] dark:bg-gray-800 dark:text-white">
              <div className="flex flex-col gap-2 pt-6">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-9 w-9 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all"
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-yellow-500 transition-all hover:rotate-180" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700 transition-all hover:-rotate-12" />
            )}
          </Button>

          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-all hidden md:block dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-700"
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
