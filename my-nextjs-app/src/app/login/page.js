"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { useEffect, useState, useRef } from "react"

export default function LoginPage() {
    const { data: session, status } = useSession()
    const [djangoToken, setDjangoToken] = useState(null)
    const hasSentToken = useRef(false) // ✅ prevent duplicate calls

    useEffect(() => {
        const sendTokenToDjango = async () => {
            if (session?.accessToken && !hasSentToken.current) {
                hasSentToken.current = true // mark as sent
                console.log("✅ Google login success, got accessToken:", session.accessToken)

                try {
                    console.log("➡️ Sending token to Django /api/auth/social/login/")
                    const res = await fetch("http://localhost:8000/api/auth/social/login/", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ access_token: session.accessToken }),
                    })

                    console.log("🔍 Django response status:", res.status)

                    let data
                    try {
                        data = await res.json()
                        console.log("📦 Raw Django response JSON:", data)
                    } catch (jsonErr) {
                        console.error("⚠️ Failed to parse Django JSON:", jsonErr)
                        return
                    }

                    if (data.access && data.refresh) {
                        console.log("✅ Django returned JWT tokens:", data)
                        localStorage.setItem("djangoAccess", data.access)
                        localStorage.setItem("djangoRefresh", data.refresh)
                        setDjangoToken(data.access)
                    } else if (data.key) {
                        console.log("✅ Django returned session token:", data)
                        localStorage.setItem("djangoKey", data.key)
                        setDjangoToken(data.key)
                    } else {
                        console.error("❌ Django login failed, unexpected response:", data)
                    }

                } catch (err) {
                    console.error("🚨 Error talking to Django:", err)
                }
            } else {
                if (!session?.accessToken) {
                    console.log("ℹ️ No Google session.accessToken yet...")
                } else {
                    console.log("⏭️ Skipping duplicate Django call")
                }
            }
        }

        sendTokenToDjango()
    }, [session])

    console.log("🔍 Session status:", status)
    console.log("📦 Current session:", session)

    if (session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold">Welcome, {session.user?.name}</h1>
                <p>{session.user?.email}</p>

                {djangoToken ? (
                    <p className="mt-2 text-green-600">✅ Django JWT saved</p>
                ) : (
                    <p className="mt-2 text-red-600">⚠️ Waiting for Django token...</p>
                )}

                <button
                    onClick={() => {
                        console.log("👋 Signing out...")
                        hasSentToken.current = false // reset on logout
                        signOut()
                    }}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
                >
                    Sign Out
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Login</h1>
            <button
                onClick={() => {
                    console.log("🟢 Starting Google login...")
                    signIn("google")
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded"
            >
                Sign in with Google
            </button>
        </div>
    )
}
