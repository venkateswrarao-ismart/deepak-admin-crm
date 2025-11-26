"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { CardFooter } from "@/components/ui/card"

export default function NewDriverPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [vehicleType, setVehicleType] = useState("")
  const [capacity, setCapacity] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "driver",
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user?.id) throw new Error("Failed to create user.");

    const userId = authData.user.id;

    // 2. Insert Profile Data
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      role: "driver",
      full_name: fullName,
      email: email,
      // vehicle_id will be updated later
    });

    if (profileError) throw profileError;

    // 3. Create Vehicle Entry
    const { data: vehicleData, error: vehicleError } = await supabase
      .from("vehicles")
      .insert({
        registration_number: registrationNumber,
        vehicle_type: vehicleType,
        capacity: Number.parseFloat(capacity),
        driver_id: userId, // Set driver_id immediately
      })
      .select("vehicle_id")
      .single();

    if (vehicleError) throw vehicleError;

    const vehicleId = vehicleData?.vehicle_id;

    // 4. Update Profile with Vehicle ID
    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({ vehicle_id: vehicleId })
      .eq("id", userId);

    if (updateProfileError) throw updateProfileError;

    // Success
    toast({
      title: "Driver created",
      description: "Driver account has been created successfully.",
    });

    router.push("/dashboard/drivers");
    router.refresh();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Register Driver</CardTitle>
          <CardDescription>Create a new driver account with vehicle details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="driver@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="123-456-7890"
                // value={phone}
                // onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Vehicle Registration Number</Label>
              <Input
                id="registrationNumber"
                type="text"
                placeholder="KA01AB1234"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Input
                id="vehicleType"
                type="text"
                placeholder="Truck, Van, Bike"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Vehicle Capacity (in tons)</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="2.5"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary-foreground" />
                  Creating...
                </>
              ) : (
                "Create Driver"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
