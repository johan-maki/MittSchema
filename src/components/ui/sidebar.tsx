
import { NavLink } from "react-router-dom";
import { Calendar, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function Sidebar() {
  return (
    <nav className="flex gap-4 md:flex-col p-4 min-w-52 bg-white/50 backdrop-blur-sm border-r">
      <NavLink
        to="/schedule"
        className={({ isActive }) =>
          cn(
            buttonVariants({ variant: "ghost" }),
            "justify-start gap-2",
            isActive && "bg-muted"
          )
        }
      >
        <Calendar className="h-4 w-4" />
        Schema
      </NavLink>
      <NavLink
        to="/directory"
        className={({ isActive }) =>
          cn(
            buttonVariants({ variant: "ghost" }),
            "justify-start gap-2",
            isActive && "bg-muted"
          )
        }
      >
        <Users className="h-4 w-4" />
        Katalog
      </NavLink>
      <NavLink
        to="/employee"
        className={({ isActive }) =>
          cn(
            buttonVariants({ variant: "ghost" }),
            "justify-start gap-2",
            isActive && "bg-muted"
          )
        }
      >
        <User className="h-4 w-4" />
        Min profil
      </NavLink>
    </nav>
  );
}
