
import React from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Calendar, Users, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: Calendar, label: "Schema", path: "/schedule" },
  { icon: Users, label: "Katalog", path: "/directory" },
  { icon: Settings, label: "Inställningar", path: "/settings" },
];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-indigo-50 to-purple-50">
        <Sidebar>
          <div className="p-4 border-b">
            <h1 className="text-xl font-semibold text-primary">VårdSchema</h1>
          </div>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton asChild>
                        <a href={item.path} className="flex items-center gap-3 px-4 py-2 text-secondary hover:bg-primary hover:bg-opacity-10 rounded-lg transition-all duration-200">
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleSignOut}>
                      <div className="flex items-center gap-3 px-4 py-2 text-secondary hover:bg-primary hover:bg-opacity-10 rounded-lg transition-all duration-200">
                        <LogOut className="w-5 h-5" />
                        <span>Logga ut</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 p-8 animate-fadeIn">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};
