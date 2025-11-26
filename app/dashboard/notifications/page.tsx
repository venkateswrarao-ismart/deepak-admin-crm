"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type Notification = {
  id: string
  user_id: string | null
  title: string
  message: string
  type: string
  reference_id: string | null
  reference_type: string | null
  is_read: boolean
  created_at: string
  updated_at: string
}

type StoredAuthData = {
  access_token: string
  expires_at: number
  expires_in: number
  refresh_token: string
  token_type: string
  user: {
    id: string
    aud: string
    role: string
    email?: string
    user_metadata?: {
      email?: string
      full_name?: string
      role?: string
    }
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Get user from localStorage
  const getUserFromLocalStorage = (): { id: string; role?: string } | null => {
    if (typeof window === "undefined") return null

    try {
      const authDataString = localStorage.getItem("sb-sqpgtmpbfmtaivbfsjuy-auth-token")
      if (!authDataString) return null

      const authData: StoredAuthData = JSON.parse(authDataString)

      if (!authData.user || !authData.user.id) return null

      // Check if user has role in user_metadata
      const role = authData.user.user_metadata?.role

      return {
        id: authData.user.id,
        role: role,
      }
    } catch (error) {
      console.error("Error parsing auth data from localStorage:", error)
      return null
    }
  }

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true)

      // Get user from localStorage
      const localUser = getUserFromLocalStorage()

      if (!localUser) {
        router.push("/login")
        return
      }

      setUserId(localUser.id)

      // Check if user is admin directly from localStorage or fetch profile if needed
      let userIsAdmin = localUser.role === "admin"

      // If role not in localStorage, fetch from profile
      if (localUser.role === undefined) {
        const userProfile = await fetchUserProfile(localUser.id)
        userIsAdmin = userProfile?.role === "admin" || false
      }

      setIsAdmin(userIsAdmin)

      // Query notifications based on role
      let query = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100)

      // If not admin, filter by user_id
      if (!userIsAdmin) {
        query = query.eq("user_id", localUser.id)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching notifications:", error)
        return
      }

      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const getTypeStyles = (type: string) => {
    switch (type.toLowerCase()) {
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "success":
        return "bg-green-100 text-green-800 border-green-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) {
        console.error("Error marking notification as read:", error)
        return
      }

      setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)

      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .in("id", unreadIds)

      if (error) {
        console.error("Error marking all notifications as read:", error)
        return
      }

      setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    // Navigate to the referenced item if applicable
    if (notification.reference_id && notification.reference_type) {
      switch (notification.reference_type) {
        case "order":
          router.push(`/dashboard/orders/${notification.reference_id}`)
          break
        case "product":
          router.push(`/dashboard/products/${notification.reference_id}`)
          break
        case "purchase_order":
          router.push(`/dashboard/purchase-orders/${notification.reference_id}`)
          break
        case "grn":
          router.push(`/dashboard/grn/${notification.reference_id}`)
          break
        // Add more cases as needed
        default:
          // Just mark as read without navigation
          break
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Notifications{" "}
            {isAdmin && <span className="text-sm font-normal text-muted-foreground ml-2">(Admin View)</span>}
          </h1>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        {notifications.length > 0 ? (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${!notification.is_read ? "bg-muted/30" : ""} cursor-pointer hover:bg-muted/20`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium">{notification.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getTypeStyles(notification.type)}>
                    {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                  </Badge>
                  {isAdmin && notification.user_id && notification.user_id !== userId && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                      User
                    </Badge>
                  )}
                  {!notification.is_read && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      New
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
