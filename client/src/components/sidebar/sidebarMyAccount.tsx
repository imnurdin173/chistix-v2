"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleUser,    
  KeyRound,   
} from "lucide-react";

export default function SidebarMyAccount() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Profile", href: "/profile", icon: CircleUser },
    { name: "Change Password", href: "/change-password", icon: KeyRound },

    
  ];

  return (
    <aside className="flex flex-col w-full md:w-64 mt-0 bg-white rounded-2xl shadow-xs border border-neutral-100 shrink-0">
      <nav className="m-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                isActive
                  ? "text-[#BB4D00] font-semibold bg-[#FFF5ED] border border-[#BB4D00]/15"
                  : "text-neutral-900 hover:text-[#BB4D00] hover:bg-[#FFF5ED]/60"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors duration-200 ${
                  isActive
                    ? "text-[#BB4D00]"
                    : "text-neutral-900 group-hover:text-[#BB4D00]"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}