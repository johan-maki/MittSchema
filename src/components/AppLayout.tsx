
import React from "react";
import { Link } from "react-router-dom";
import { Bell, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Calendar, Users, MessageSquare, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: Calendar, label: "Schema", path: "/schedule" },
  { icon: Users, label: "Personal", path: "/directory" },
  { icon: MessageSquare, label: "Meddelanden", path: "/messages" },
];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-xl">
            <span className="text-primary">Vårdschema</span>
            <span className="text-red-500">*</span>
          </Link>
          <nav className="flex items-center space-x-6 ml-6">
            <Link to="/schedule" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Schema
            </Link>
            <Link to="/directory" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Personal
            </Link>
            <Link to="/messages" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Meddelanden
            </Link>
            <Link to="/month-view" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Månadsvy
            </Link>
          </nav>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarFallback>V</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-[#F8F9FA] p-8 animate-fadeIn">
        {children}
      </main>
    </div>
  );
};
