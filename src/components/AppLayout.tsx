
import React from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Calendar, Users, Bell, Settings, MessageSquare, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: Calendar, label: "Schema", path: "/schedule" },
  { icon: Users, label: "Personal", path: "/directory" },
  { icon: Bell, label: "Uppdateringar", path: "/updates" },
  { icon: MessageSquare, label: "Meddelanden", path: "/messages" },
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
      <div className="min-h-screen flex w-full bg-[#F8F9FA]">
        <Sidebar>
          <div className="p-4 border-b">
            <h1 className="text-xl font-semibold text-secondary">Vårdschema</h1>
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
