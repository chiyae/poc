"use client"

import * as React from "react"
import { useAuth } from "@/context/auth-provider"
import { useSettings } from "@/context/settings-provider"
import { useRouter } from "next/navigation"

export function InactivityMonitor() {
    const { user, logout } = useAuth()
    const { settings } = useSettings()
    const router = useRouter()

    // Convert minutes to milliseconds
    const timeoutMs = (settings?.sessionTimeout || 30) * 60 * 1000

    const timerRef = React.useRef<NodeJS.Timeout | null>(null)

    const resetTimer = React.useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }

        if (user) {
            timerRef.current = setTimeout(async () => {
                console.log("Inactivity timeout reached. Logging out.")
                await logout()
                router.push("/login?reason=inactivity")
            }, timeoutMs)
        }
    }, [user, logout, router, timeoutMs])

    React.useEffect(() => {
        // If no user, don't start the monitor
        if (!user) {
            if (timerRef.current) clearTimeout(timerRef.current)
            return
        }

        const events = [
            "mousedown",
            "mousemove",
            "keypress",
            "scroll",
            "touchstart",
            "click",
        ]

        const handleActivity = () => {
            resetTimer()
        }

        // Add event listeners
        events.forEach((event) => {
            window.addEventListener(event, handleActivity)
        })

        // Initial timer start
        resetTimer()

        // Cleanup
        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity)
            })
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [user, resetTimer])

    return null // This component doesn't render anything
}
