"use client"

import { useEffect, useState, useRef } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { RealtimeChannel } from "@supabase/supabase-js"

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

type UserProfile = {
  id: string
  role: "admin" | "manager" | "customer"
  full_name: string | null
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

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null)

  // Get user from localStorage
  const getUserFromLocalStorage = (): { id: string; role?: string } | null => {
    if (typeof window === "undefined") return null

    try {
      const authDataString = localStorage.getItem("sb-sqpgtmpbfmtaivbfsjuy-auth-token")
      if (!authDataString) return null

      const authData: StoredAuthData = JSON.parse(authDataString)

      if (!authData.user || !authData.user.id) return null

      // Check if user has role in user_metadata
      const role =
        authData.user.user_metadata?.role || (authData.user.role === "authenticated" ? "admin" : authData.user.role)

      return {
        id: authData.user.id,
        role: role,
      }
    } catch (error) {
      console.error("Error parsing auth data from localStorage:", error)
      return null
    }
  }

  const playNotificationSound = () => {
    try {
      if (!notificationSoundRef.current) {
        notificationSoundRef.current = new Audio("/notification-sound.mp3")
      }

      // Reset the audio to the beginning if it's already playing
      notificationSoundRef.current.currentTime = 0

      // Play the sound
      notificationSoundRef.current.play().catch((error) => {
        // Handle any autoplay restrictions or other errors silently
        console.log("Could not play notification sound:", error)
      })
    } catch (error) {
      console.error("Error playing notification sound:", error)
    }
  }

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase.from("profiles").select("id, role, full_name").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data as UserProfile
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true)

      // Get user from localStorage
      const localUser = getUserFromLocalStorage()

      if (!localUser) {
        setLoading(false)
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
      let query = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20)

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

    // Setup subscription
    const setupSubscription = async () => {
      try {
        // Get user from localStorage
        const localUser = getUserFromLocalStorage()

        if (!localUser) return

        // Check if user is admin directly from localStorage or fetch profile if needed
        let userIsAdmin = localUser.role === "admin"

        // If role not in localStorage, fetch from profile
        if (localUser.role === undefined) {
          const userProfile = await fetchUserProfile(localUser.id)
          userIsAdmin = userProfile?.role === "admin" || false
        }

        // Create subscription filter based on role
        const filter = userIsAdmin
          ? undefined // No filter for admins - they see all notifications
          : `user_id=eq.${localUser.id}` // Filter by user_id for non-admins

        // Remove any existing channel before creating a new one
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current)
        }

        const channel = supabase
          .channel("notifications-changes")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: filter,
            },
            (payload) => {
              setNotifications((prev) => [payload.new as Notification, ...prev])
              playNotificationSound() // Play sound when new notification arrives
            },
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log("Subscribed to notifications channel")
            }
          })

        channelRef.current = channel
      } catch (error) {
        console.error("Error setting up subscription:", error)
      }
    }

    setupSubscription()

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Initialize audio element
    if (typeof window !== "undefined") {
      notificationSoundRef.current = new Audio("/notification-sound.mp3")
      // Preload the audio file
      notificationSoundRef.current.load()
    }

    return () => {
      // Clean up audio resources
      if (notificationSoundRef.current) {
        notificationSoundRef.current.pause()
        notificationSoundRef.current = null
      }
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

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
      router.refresh()
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
      router.refresh()
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id)

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

    setOpen(false)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    return date.toLocaleDateString()
  }

  const getTypeStyles = (type: string) => {
    switch (type.toLowerCase()) {
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">
            Notifications {isAdmin && <span className="text-xs text-muted-foreground ml-1">(Admin View)</span>}
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex flex-col gap-1 px-4 py-3 cursor-pointer hover:bg-muted/50",
                    !notification.is_read && "bg-muted/30",
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{notification.title}</h4>
                    <span className="text-xs text-muted-foreground">{formatTime(notification.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", getTypeStyles(notification.type))}>
                      {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                    </span>
                    {isAdmin && notification.user_id && notification.user_id !== userId && (
                      <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-0.5 rounded-full">
                        User
                      </span>
                    )}
                    {!notification.is_read && (
                      <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          )}
        </div>
        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => router.push("/dashboard/notifications")}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
