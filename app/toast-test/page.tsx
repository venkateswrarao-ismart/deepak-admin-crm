"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import toast from "react-hot-toast"

export default function ToastTestPage() {
  const { toast: shadcnToast } = useToast()
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev])
  }

  const testShadcnToast = () => {
    addLog("Testing shadcn/ui toast...")
    try {
      shadcnToast({
        title: "Shadcn Toast Test",
        description: "This is a test of the shadcn/ui toast system",
      })
      addLog("shadcn/ui toast function called successfully")
    } catch (error) {
      addLog(`Error with shadcn/ui toast: ${error}`)
      console.error("Toast error:", error)
    }
  }

  const testHotToast = () => {
    addLog("Testing react-hot-toast...")
    try {
      toast.success("This is a test of react-hot-toast")
      addLog("react-hot-toast called successfully")
    } catch (error) {
      addLog(`Error with react-hot-toast: ${error}`)
      console.error("Hot toast error:", error)
    }
  }

  const testErrorToast = () => {
    addLog("Testing error toast...")
    try {
      shadcnToast({
        title: "Error Toast Test",
        description: "This is a test of the error toast",
        variant: "destructive",
      })
      addLog("Error toast function called successfully")
    } catch (error) {
      addLog(`Error with error toast: ${error}`)
      console.error("Error toast error:", error)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Toast Testing Page</CardTitle>
          <CardDescription>Use this page to test different toast notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button onClick={testShadcnToast}>Test Shadcn/UI Toast</Button>
            <Button onClick={testHotToast} variant="secondary">
              Test React Hot Toast
            </Button>
            <Button onClick={testErrorToast} variant="destructive">
              Test Error Toast
            </Button>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium mb-2">Debug Logs:</h3>
            <div className="bg-muted p-4 rounded-md h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No logs yet. Try testing a toast notification.</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="text-sm mb-1 font-mono">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => setLogs([])}>
            Clear Logs
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
