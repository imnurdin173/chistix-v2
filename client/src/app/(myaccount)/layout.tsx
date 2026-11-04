"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import Navbar from "@/components/menubar/navbar";
import Footer from "@/components/menubar/footer";
import SidebarMyAccount from "@/components/sidebar/sidebarMyAccount";

export default function MyAccountLayout({children}: {children: React.ReactNode}) {
    const {user, loading} = useAuth();
    const router = useRouter();

    useEffect(() => {
if(!loading && !user) router.replace("/login");
    }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="">
      

      <main className="  p-6 md:p-8  ">
        <div className="container mx-auto flex flex-col md:flex-row md:items-start max-w-8xl items-center gap-4 px-4 mt-5">
        <SidebarMyAccount />
        {children}

        </div>
      </main>
      
    </div>
  );
}
