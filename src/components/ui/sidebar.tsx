
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export interface MenuItem {
  name: string;
  href: string;
  isActive: boolean;
}

interface SidebarProps {
  menuItems: MenuItem[];
  mobileMenuItems: MenuItem[];
}

export const Sidebar = ({ menuItems, mobileMenuItems }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-1 min-h-0 bg-purple-100 dark:bg-purple-900">
          <div className="flex items-center h-14 px-4 bg-purple-200 dark:bg-purple-800">
            <span className="text-lg font-semibold text-purple-800 dark:text-purple-100">
              Vårdschema
            </span>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    item.isActive
                      ? "bg-purple-300 text-purple-900 dark:bg-purple-700 dark:text-purple-100"
                      : "text-purple-700 hover:bg-purple-200 dark:text-purple-200 dark:hover:bg-purple-800"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 z-20 pt-3 pl-3">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-60" onClick={() => setIsOpen(false)} />
      )}

      {/* Mobile menu panel */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-60 bg-white dark:bg-gray-800 shadow-xl transform transition-transform ease-in-out duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4 bg-purple-200 dark:bg-purple-800">
          <span className="text-lg font-semibold text-purple-800 dark:text-purple-100">
            Vårdschema
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md text-purple-600 hover:text-purple-900 dark:text-purple-200 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {mobileMenuItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.isActive
                    ? "bg-purple-300 text-purple-900 dark:bg-purple-700 dark:text-purple-100"
                    : "text-purple-700 hover:bg-purple-200 dark:text-purple-200 dark:hover:bg-purple-800"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};
