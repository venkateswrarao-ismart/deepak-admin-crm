import { createSupabaseServerClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, ArrowLeft, Phone, Mail, Building, Tag, User } from "lucide-react"
import Link from "next/link"
import { StatusUpdateForm } from "../_components/status-update-form"

interface ShopOwnerViewPageProps {
  params: {
    id: string
  }
}

export default async function ShopOwnerViewPage({ params }: ShopOwnerViewPageProps) {
  const supabase = createSupabaseServerClient()

  // Fetch the registration
  const { data: registration } = await supabase
    .from("shop_owner_registrations")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!registration) {
    notFound()
  }

  // Fetch shop address
  const { data: shopAddress } = await supabase
    .from("shop_addresses")
    .select("*")
    .eq("registration_id", params.id)
    .single()

  // Fetch owner identifications
  const { data: identifications } = await supabase
    .from("owner_identifications")
    .select("*")
    .eq("registration_id", params.id)

  // Fetch bank accounts
  const { data: bankAccounts } = await supabase.from("owner_bank_accounts").select("*").eq("registration_id", params.id)

  // Fetch documents
  const { data: documents } = await supabase.from("shop_owner_documents").select("*").eq("registration_id", params.id)

  // Fetch sales officer name if available
  let salesOfficerName = "Not Assigned"
  if (registration.sales_officer_id) {
    const { data: salesOfficer } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", registration.sales_officer_id)
      .single()

    if (salesOfficer) {
      salesOfficerName = salesOfficer.full_name || "Unknown"
    }
  }

  // Fetch approver name if available
  let approverName = ""
  if (registration.approved_by) {
    const { data: approver } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", registration.approved_by)
      .single()

    if (approver) {
      approverName = approver.full_name || "Unknown"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>
      case "under_review":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Under Review</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/shop-owners">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Shop Owner Registration</h1>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(registration.status)}
          <div className="text-sm text-muted-foreground">Submitted on {formatDate(registration.submitted_at)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="business">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="business">Business Details</TabsTrigger>
              <TabsTrigger value="owner">Owner Details</TabsTrigger>
              <TabsTrigger value="documents">Identity Documents</TabsTrigger>
              <TabsTrigger value="banking">Banking</TabsTrigger>
            </TabsList>

            <TabsContent value="business" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Shop Name</h3>
                      <p className="text-lg font-medium">{registration.shop_name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Display Name</h3>
                      <p className="text-lg">{registration.shop_display_name || "Same as shop name"}</p>
                    </div>
                  </div>

                  {shopAddress && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                      <p className="text-base">
                        {shopAddress.address_line1}
                        {shopAddress.address_line2 ? `, ${shopAddress.address_line2}` : ""}
                        {shopAddress.landmark ? `, ${shopAddress.landmark}` : ""}
                        <br />
                        {shopAddress.city}, {shopAddress.state}, {shopAddress.pincode}
                        {shopAddress.country ? `, ${shopAddress.country}` : ""}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Business Type</h3>
                      <p className="text-base flex items-center">
                        <Building className="h-4 w-4 mr-1 text-muted-foreground" />
                        {registration.merchant_segment}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Sub-segment</h3>
                      <p className="text-base flex items-center">
                        <Tag className="h-4 w-4 mr-1 text-muted-foreground" />
                        {registration.merchant_sub_segment || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Sales Officer</h3>
                      <p className="text-base">{salesOfficerName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Contact Number</h3>
                      <p className="text-base flex items-center">
                        <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                        {registration.shop_phone}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                      <p className="text-base flex items-center">
                        <Mail className="h-4 w-4 mr-1 text-muted-foreground" />
                        {registration.shop_email || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">GSTIN</h3>
                      <p className="text-base">{registration.shop_gstin || "Not provided"}</p>
                    </div>
                  </div>

                  {registration.pan_number && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">PAN Number</h3>
                      <p className="text-base">{registration.pan_number}</p>
                    </div>
                  )}

                  {registration.shop_website && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Website</h3>
                      <p className="text-base">
                        <a
                          href={registration.shop_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {registration.shop_website}
                        </a>
                      </p>
                    </div>
                  )}

                  {registration.document_url && (
                    <div className="border rounded-md p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Business Document</h3>
                      <div className="flex justify-between items-center">
                        <p className="text-sm">Main business document</p>
                        <a
                          href={registration.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Document
                        </a>
                      </div>
                      <div className="mt-2 border rounded overflow-hidden">
                        {registration.document_url.toLowerCase().endsWith(".pdf") ? (
                          <div className="h-40 flex items-center justify-center bg-gray-50">
                            <p className="text-sm text-muted-foreground">PDF document preview not available</p>
                          </div>
                        ) : (
                          <div className="relative h-40 bg-gray-50">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Loading document preview...</p>
                            </div>
                            <img
                              src={registration.document_url || "/placeholder.svg"}
                              alt="Business document"
                              className="w-full h-full object-contain relative z-10"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="owner" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Owner Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Owner Name</h3>
                      <p className="text-lg font-medium flex items-center">
                        <User className="h-4 w-4 mr-1 text-muted-foreground" />
                        {registration.owner_name}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Contact Number</h3>
                      <p className="text-lg flex items-center">
                        <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                        {registration.owner_phone || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p className="text-base flex items-center">
                      <Mail className="h-4 w-4 mr-1 text-muted-foreground" />
                      {registration.owner_email || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Identity Documents</h3>
                    <p className="text-base">
                      Please see the Identity Documents tab for detailed information about the owner's identification
                      documents.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Identity Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {identifications && identifications.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {identifications.map((id) => (
                        <div key={id.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium capitalize">{id.id_type} ID</h4>
                              {id.id_number && <p className="text-sm text-muted-foreground">Number: {id.id_number}</p>}
                              {id.issuing_country && (
                                <p className="text-sm text-muted-foreground">Issuing Country: {id.issuing_country}</p>
                              )}
                              {id.expiry_date && (
                                <p className="text-sm text-muted-foreground">
                                  Expires: {new Date(id.expiry_date).toLocaleDateString()}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground mt-1">
                                {id.is_verified ? (
                                  <span className="text-green-600">Verified</span>
                                ) : (
                                  <span className="text-yellow-600">Not verified</span>
                                )}
                              </p>
                            </div>
                            {id.id_image_url && (
                              <a
                                href={id.id_image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View Document
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No identity documents found for this registration</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banking" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Banking Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {bankAccounts && bankAccounts.length > 0 ? (
                    <div className="space-y-4">
                      {bankAccounts.map((account) => (
                        <div key={account.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div>
                                <h4 className="font-medium">{account.bank_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Branch: {account.branch_name || "Not specified"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm">Account Holder: {account.account_holder_name}</p>
                                <p className="text-sm">Account Number: {account.account_number}</p>
                                <p className="text-sm">IFSC Code: {account.ifsc_code}</p>
                                <p className="text-sm">Account Type: {account.account_type}</p>
                              </div>
                              <div>
                                {account.is_primary && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    Primary Account
                                  </Badge>
                                )}
                                {account.is_verified ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-2">
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-yellow-50 text-yellow-700 border-yellow-200 ml-2"
                                  >
                                    Not Verified
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              {account.cancelled_cheque_url && (
                                <a
                                  href={account.cancelled_cheque_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center"
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  View Cancelled Cheque
                                </a>
                              )}
                              {account.bank_statement_url && (
                                <a
                                  href={account.bank_statement_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center"
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  View Bank Statement
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No banking details provided</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <StatusUpdateForm
            registrationId={registration.id}
            currentStatus={registration.status}
            rejectionReason={registration.rejection_reason}
          />

          {registration.status === "rejected" && registration.rejection_reason && (
            <Card className="mt-4 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-700 text-base">Rejection Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{registration.rejection_reason}</p>
              </CardContent>
            </Card>
          )}

          {registration.status === "approved" && registration.approved_at && (
            <Card className="mt-4 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-700 text-base">Approval Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Approved on: {formatDate(registration.approved_at)}</p>
                {approverName && <p className="text-sm mt-1">Approved by: {approverName}</p>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Link href="/dashboard/shop-owners">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Registrations
          </Button>
        </Link>
      </div>
    </div>
  )
}
