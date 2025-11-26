import { createSupabaseServerClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, Plus, Edit, Trash2, Check, Store } from "lucide-react"
import Link from "next/link"

interface CustomerViewPageProps {
  params: {
    id: string
  }
}

interface UserAddress {
  id: string
  user_id: string
  address_type: string | null
  is_default: boolean | null
  name: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  phone: string | null
  landmark: string | null
  created_at: string | null
  updated_at: string | null
  latitude: number | null
  longitude: number | null
}

export default async function CustomerViewPage({ params }: CustomerViewPageProps) {
  const supabase = createSupabaseServerClient()

  try {
    // Fetch the customer profile
    const { data: customer, error: customerError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", params.id)
      .eq("role", "customer")
      .single()

    if (customerError || !customer) {
      console.error("Error fetching customer:", customerError)
      notFound()
    }

    // Fetch user addresses
    const { data: addresses, error: addressesError } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", params.id)
      .order("is_default", { ascending: false })

    if (addressesError) {
      console.error("Error fetching addresses:", addressesError)
    }

    const userAddresses = addresses || []

    // Fetch orders for this customer
    let orders = []
    let orderCount = 0

    try {
      const { data: orderData, count } = await supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("customer_id", params.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (orderData) orders = orderData
      if (count !== null) orderCount = count
    } catch (orderError) {
      console.error("Error fetching orders:", orderError)
    }

    const formatDate = (dateString: string | null) => {
      if (!dateString) return "Not available"
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    const formatFullAddress = (address: UserAddress) => {
      const parts = [
        address.address_line1,
        address.address_line2,
        address.landmark ? `Landmark: ${address.landmark}` : null,
        [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
        address.country,
      ].filter(Boolean)

      return parts.join(", ")
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/customers">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Customer Profile</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Customer Information</CardTitle>
                  <Link href={`/dashboard/customers/${params.id}/edit`}>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-600">
                    {customer.full_name ? customer.full_name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{customer.full_name || "Unnamed Customer"}</h2>
                    <p className="text-sm text-muted-foreground">Customer ID: {customer.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    {customer.email ? (
                      <p className="text-base flex items-center mt-1">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                          {customer.email}
                        </a>
                      </p>
                    ) : (
                      <p className="text-base text-muted-foreground mt-1">No email provided</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                    {customer.phone ? (
                      <p className="text-base flex items-center mt-1">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                          {customer.phone}
                        </a>
                      </p>
                    ) : (
                      <p className="text-base text-muted-foreground mt-1">No phone number provided</p>
                    )}
                  </div>
                </div>

                {customer.shop_name && (
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-muted-foreground">Shop Name</h3>
                      <Link href={`/dashboard/customers/${params.id}/edit`}>
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                    <p className="text-base flex items-center mt-1">
                      <Store className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{customer.shop_name}</span>
                    </p>
                  </div>
                )}

                {customer.address && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Primary Address</h3>
                    <p className="text-base flex items-start mt-1">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-1" />
                      <span>{customer.address}</span>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Registered On</h3>
                    <p className="text-base flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {formatDate(customer.created_at)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                    <p className="text-base flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {formatDate(customer.updated_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Addresses Section */}
           
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Customer Addresses</CardTitle>
                  <CardDescription>Manage customer delivery addresses</CardDescription>
                </div>
                <Link href={`/dashboard/customers/${params.id}/addresses/new`}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {userAddresses.length > 0 ? (
                  <div className="space-y-4">
                    {userAddresses.map((address) => (
                      <div key={address.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className="font-medium">{address.name || "Unnamed Address"}</div>
                            {address.address_type && (
                              <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                {address.address_type}
                              </span>
                            )}
                            {address.is_default && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center">
                                <Check className="h-3 w-3 mr-1" />
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Link href={`/dashboard/customers/${params.id}/addresses/${address.id}/edit`}>
                              <Button variant="outline" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/dashboard/customers/${params.id}/addresses/${address.id}/delete`}>
                              <Button variant="outline" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </Link>
                            {!address.is_default && (
                              <Link href={`/dashboard/customers/${params.id}/addresses/${address.id}/set-default`}>
                                <Button variant="outline" size="sm">
                                  Set as Default
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                            <span>{formatFullAddress(address)}</span>
                          </div>
                          {address.phone && (
                            <div className="flex items-center mt-1">
                              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{address.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto text-gray-300" />
                    <h3 className="mt-2 text-lg font-medium">No addresses found</h3>
                    <p className="mt-1 text-sm text-gray-500">This customer hasn't added any addresses yet.</p>
                    <div className="mt-6">
                      <Link href={`/dashboard/customers/${params.id}/addresses/new`}>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Address
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {orders && orders.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between border-b pb-4">
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{order.total_amount}</p>
                          <p
                            className={`text-sm ${
                              order.status === "completed"
                                ? "text-green-600"
                                : order.status === "cancelled"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                            }`}
                          >
                            {order.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {orderCount > 5 && (
                    <div className="mt-4 text-center">
                      <Link href={`/dashboard/orders?customer=${params.id}`}>
                        <Button variant="outline">View All {orderCount} Orders</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Customer Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-b pb-4">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{orderCount || 0}</p>
                </div>

                <div className="border-b pb-4">
                  <p className="text-sm text-muted-foreground">Saved Addresses</p>
                  <p className="text-2xl font-bold">{userAddresses.length}</p>
                </div>

                <div className="border-b pb-4">
                  <p className="text-sm text-muted-foreground">Account Status</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-2">Quick Actions</p>
                  <div className="space-y-2">
                    <Link href={`/dashboard/customers/${params.id}/edit`}>
                      <Button variant="outline" className="w-full justify-start">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    </Link>
                    {customer.email && (
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href={`mailto:${customer.email}`}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </Link>
                      </Button>
                    )}
                    {customer.phone && (
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href={`tel:${customer.phone}`}>
                          <Phone className="mr-2 h-4 w-4" />
                          Call Customer
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-between">
          <Link href="/dashboard/customers">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Button>
          </Link>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in customer view page:", error)
    notFound()
  }
}
