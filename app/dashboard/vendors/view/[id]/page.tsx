// import { createSupabaseServerClient } from "@/lib/supabase"
// import { notFound } from "next/navigation"
// import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { FileText, ArrowLeft, Edit } from "lucide-react"
// import Link from "next/link"

// interface VendorViewPageProps {
//   params: {
//     id: string
//   }
// }

// export default async function VendorViewPage({ params }: VendorViewPageProps) {
//   const supabase = createSupabaseServerClient()

//   // Fetch the vendor
//   const { data: vendor } = await supabase.from("vendors").select("*").eq("id", params.id).single()

//   if (!vendor) {
//     notFound()
//   }

//   console.log("Vendor document URLs:", {
//     gst: vendor.gst_file_url,
//     fssai: vendor.fssai_file_url,
//     aadhar: vendor.aadhar_file_url,
//     pan: vendor.pan_file_url,
//   })

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <Link href="/dashboard/vendors">
//             <Button variant="outline" size="icon">
//               <ArrowLeft className="h-4 w-4" />
//             </Button>
//           </Link>
//           <h1 className="text-3xl font-bold">Vendor Details</h1>
//         </div>
//         <Link href={`/dashboard/vendors/${vendor.id}`}>
//           <Button>
//             <Edit className="mr-2 h-4 w-4" />
//             Edit Vendor
//           </Button>
//         </Link>
//       </div>

//       <Card>
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <CardTitle className="text-2xl">{vendor.name}</CardTitle>
//             <Badge variant={vendor.is_active ? "default" : "secondary"}>
//               {vendor.is_active ? "Active" : "Inactive"}
//             </Badge>
//           </div>
//           {vendor.vendor_code && <p className="text-muted-foreground">Code: {vendor.vendor_code}</p>}
//         </CardHeader>

//         <Tabs defaultValue="basic">
//           <TabsList className="px-6">
//             <TabsTrigger value="basic">Basic Information</TabsTrigger>
//             <TabsTrigger value="documents">Documents</TabsTrigger>
//             <TabsTrigger value="banking">Banking Details</TabsTrigger>
//           </TabsList>

//           <TabsContent value="basic" className="p-6 space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Number</h3>
//                 <p className="text-lg">{vendor.contact_number || "Not provided"}</p>
//               </div>

//               <div>
//                 <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
//                 <p className="text-lg">{vendor.email || "Not provided"}</p>
//               </div>

//               <div>
//                 <h3 className="text-sm font-medium text-muted-foreground mb-1">Vendor Type</h3>
//                 <p className="text-lg">{vendor.vendor_type || "Not specified"}</p>
//               </div>
//             </div>

//             <div>
//               <h3 className="text-sm font-medium text-muted-foreground mb-1">Address</h3>
//               <p className="text-lg">{vendor.address || "Not provided"}</p>
//             </div>
//           </TabsContent>

//           <TabsContent value="documents" className="p-6 space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <h3 className="text-sm font-medium text-muted-foreground mb-1">Trade License</h3>
//                 <p className="text-lg">{vendor.trade_license || "Not provided"}</p>
//               </div>

//               <div>
//                 <h3 className="text-sm font-medium text-muted-foreground mb-1">GST Number</h3>
//                 <p className="text-lg">{vendor.gst_number || "Not provided"}</p>
//               </div>
//             </div>

//             <div className="mb-4">
//               <h3 className="text-sm font-medium text-muted-foreground mb-1">FSSAI License</h3>
//               <p className="text-lg">{vendor.fssai_license || "Not provided"}</p>
//             </div>

//             <h3 className="font-medium text-lg mb-3">Documents</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-1 border rounded-md p-4">
//                 <h4 className="font-medium">GST Document</h4>
//                 <p className="text-sm text-muted-foreground mb-2">GST Number: {vendor.gst_number || "Not provided"}</p>
//                 {vendor.gst_file_url ? (
//                   <a
//                     href={vendor.gst_file_url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="flex items-center text-blue-600 hover:underline"
//                   >
//                     <FileText className="mr-2 h-4 w-4" />
//                     View GST Document
//                   </a>
//                 ) : (
//                   <p className="text-sm text-muted-foreground">No document uploaded</p>
//                 )}
//               </div>

//               <div className="space-y-1 border rounded-md p-4">
//                 <h4 className="font-medium">FSSAI Document</h4>
//                 <p className="text-sm text-muted-foreground mb-2">
//                   FSSAI License: {vendor.fssai_license || "Not provided"}
//                 </p>
//                 {vendor.fssai_file_url ? (
//                   <a
//                     href={vendor.fssai_file_url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="flex items-center text-blue-600 hover:underline"
//                   >
//                     <FileText className="mr-2 h-4 w-4" />
//                     View FSSAI Document
//                   </a>
//                 ) : (
//                   <p className="text-sm text-muted-foreground">No document uploaded</p>
//                 )}
//               </div>

//               <div className="space-y-1 border rounded-md p-4">
//                 <h4 className="font-medium">Aadhar Document</h4>
//                 {vendor.aadhar_file_url ? (
//                   <a
//                     href={vendor.aadhar_file_url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="flex items-center text-blue-600 hover:underline"
//                   >
//                     <FileText className="mr-2 h-4 w-4" />
//                     View Aadhar Document
//                   </a>
//                 ) : (
//                   <p className="text-sm text-muted-foreground">No document uploaded</p>
//                 )}
//               </div>

//               <div className="space-y-1 border rounded-md p-4">
//                 <h4 className="font-medium">PAN Document</h4>
//                 {vendor.pan_file_url ? (
//                   <a
//                     href={vendor.pan_file_url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="flex items-center text-blue-600 hover:underline"
//                   >
//                     <FileText className="mr-2 h-4 w-4" />
//                     View PAN Document
//                   </a>
//                 ) : (
//                   <p className="text-sm text-muted-foreground">No document uploaded</p>
//                 )}
//               </div>
//             </div>
//           </TabsContent>

//           <TabsContent value="banking" className="p-6 space-y-4">
//             <div>
//               <h3 className="text-sm font-medium text-muted-foreground mb-1">Bank Account Number</h3>
//               <p className="text-lg">{vendor.bank_account_number || "Not provided"}</p>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <h3 className="text-sm font-medium text-muted-foreground mb-1">Bank Name</h3>
//                 <p className="text-lg">{vendor.bank_name || "Not provided"}</p>
//               </div>

//               <div>
//                 <h3 className="text-sm font-medium text-muted-foreground mb-1">IFSC Code</h3>
//                 <p className="text-lg">{vendor.bank_ifsc || "Not provided"}</p>
//               </div>
//             </div>
//           </TabsContent>
//         </Tabs>

//         <CardFooter className="border-t p-6">
//           <Link href="/dashboard/vendors">
//             <Button variant="outline">
//               <ArrowLeft className="mr-2 h-4 w-4" />
//               Back to Vendors
//             </Button>
//           </Link>
//         </CardFooter>
//       </Card>
//     </div>
//   )
// }


import { createSupabaseServerClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"

interface VendorViewPageProps {
  params: {
    id: string
  }
}

export default async function VendorViewPage({ params }: VendorViewPageProps) {
  const supabase = createSupabaseServerClient()

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!vendor) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/vendors">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Vendor Details</h1>
        </div>
        <Link href={`/dashboard/vendors/${vendor.id}`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Vendor
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{vendor.name}</CardTitle>
            <Badge variant={vendor.is_active ? "default" : "secondary"}>
              {vendor.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {vendor.vendor_code && (
            <p className="text-muted-foreground">Code: {vendor.vendor_code}</p>
          )}
        </CardHeader>

        <Tabs defaultValue="basic">
          <TabsList className="px-6">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="banking">Banking Details</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Number</h3>
                <p className="text-lg">{vendor.contact_number || "Not provided"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                <p className="text-lg">{vendor.email || "Not provided"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Vendor Type</h3>
                <p className="text-lg">{vendor.vendor_type || "Not specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Product Source Type</h3>
                <p className="text-lg">{vendor.product_source_type || "Warehouse"}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Address</h3>
              <p className="text-lg">{vendor.address || "Not provided"}</p>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Trade License</h3>
                <p className="text-lg">{vendor.trade_license || "Not provided"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">GST Number</h3>
                <p className="text-lg">{vendor.gst_number || "Not provided"}</p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">FSSAI License</h3>
              <p className="text-lg">{vendor.fssai_license || "Not provided"}</p>
            </div>

            <h3 className="font-medium text-lg mb-3">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1 border rounded-md p-4">
                <h4 className="font-medium">GST Document</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  GST Number: {vendor.gst_number || "Not provided"}
                </p>
                {vendor.gst_file_url ? (
                  <a href={vendor.gst_file_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                    <FileText className="mr-2 h-4 w-4" />
                    View GST Document
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">No document uploaded</p>
                )}
              </div>

              <div className="space-y-1 border rounded-md p-4">
                <h4 className="font-medium">FSSAI Document</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  FSSAI License: {vendor.fssai_license || "Not provided"}
                </p>
                {vendor.fssai_file_url ? (
                  <a href={vendor.fssai_file_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                    <FileText className="mr-2 h-4 w-4" />
                    View FSSAI Document
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">No document uploaded</p>
                )}
              </div>

              <div className="space-y-1 border rounded-md p-4">
                <h4 className="font-medium">Aadhar Document</h4>
                {vendor.aadhar_file_url ? (
                  <a href={vendor.aadhar_file_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                    <FileText className="mr-2 h-4 w-4" />
                    View Aadhar Document
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">No document uploaded</p>
                )}
              </div>

              <div className="space-y-1 border rounded-md p-4">
                <h4 className="font-medium">PAN Document</h4>
                {vendor.pan_file_url ? (
                  <a href={vendor.pan_file_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                    <FileText className="mr-2 h-4 w-4" />
                    View PAN Document
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">No document uploaded</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="banking" className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Bank Account Number</h3>
              <p className="text-lg">{vendor.bank_account_number || "Not provided"}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Bank Name</h3>
                <p className="text-lg">{vendor.bank_name || "Not provided"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">IFSC Code</h3>
                <p className="text-lg">{vendor.bank_ifsc || "Not provided"}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <CardFooter className="border-t p-6">
          <Link href="/dashboard/vendors">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vendors
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
