"use client"
import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import OrganizerSidebar from '@/components/sidebar/organizerSidebar'
import type { AuthUser } from '@/types/organizer'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<AuthUser | null>(null)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)

    useEffect(() => {
        const checkUserRole = async () => {
            const token = window.localStorage.getItem("token")

            if(!token) {
                router.replace("/error/401")
                return
            }

            try {
                const profile = await apiFetch<AuthUser>("/auth/me", {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                })

                const isOrganizerOnlyRoute = 
                pathname.startsWith("/dashboard/events") ||
                pathname.startsWith("/dashboard/vouchers") ||
                pathname.startsWith("/dashboard/attendee-list") ||
                pathname.startsWith("dashboard/reviews")

                if(profile.role !== "ORGANIZER" && isOrganizerOnlyRoute) {
                    router.replace("/error/403")
                    return
                }

                setUser(profile)
            } catch (error) {
                router.replace("/error/401")
            } finally {
                setIsCheckingAuth(false)
            }
        }
        checkUserRole()
    }, [pathname, router])

    if (isCheckingAuth) {
        return (
            <div className='min-h-screen bg-[#faf8f4] flex items-center justify-center text-sm text-neutral-500'>
                Verifying dashboard access ...
            </div>
        )
    }

    if(!user) return null

  return (
    <div className='min-h-screen bg-[#faf8f4] text-neutral-800 font-sans flex flex-col'>
        <div className='flex-1 w-full p-4 md:p-8'>
            <div className='max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start'>
                {user.role === "ORGANIZER" && <OrganizerSidebar />}
                <div className='flex-1 w-full'>{children}</div>
            </div>
        </div>
    </div>
  )
}
