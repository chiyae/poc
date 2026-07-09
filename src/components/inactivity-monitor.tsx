"use client"

import * as React from "react"
import { useAuth } from "@/context/auth-provider"
import { useSettings } from "@/context/settings-provider"
import { useRouter } from "next/navigation"
import { keepSessionAlive } from "@/app/auth-actions"

export function InactivityMonitor() {
    const { user, logout } = useAuth()
    const { settings } = useSettings()
    const router = useRouter()

    // Convert minutes to milliseconds
    const timeoutMs = (settings?.sessionTimeout || 30) * 60 * 1000
    const pingIntervalMs = Math.min(2 * 60 * 1000, timeoutMs / 2)

    const timerRef = React.useRef<NodeJS.Timeout | null>(null)
    const lastPingRef = React.useRef<number>(0)

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

            // Keep the server-side session alive if client is active
            const now = Date.now()
            if (now - lastPingRef.current > pingIntervalMs) {
                lastPingRef.current = now
                keepSessionAlive().then((isValid) => {
                    if (!isValid) {
                        logout()
                        router.push("/login?reason=inactivity")
                    }
                }).catch((err) => {
                    console.error("Failed to ping session:", err)
                })
            }
        }
    }, [user, logout, router, timeoutMs, pingIntervalMs])

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
