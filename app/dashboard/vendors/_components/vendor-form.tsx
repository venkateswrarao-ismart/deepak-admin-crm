"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { FileText, Upload, Check, X, CheckIcon, Copy } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Vendor {
  id: string
  name: string
  address: string | null
  contact_number: string | null
  email: string | null
  trade_license: string | null
  gst_number: string | null
  fssai_license: string | null
  gst_file_url: string | null
  fssai_file_url: string | null
  aadhar_file_url: string | null
  pan_file_url: string | null
  bank_account_number: string | null
  bank_name: string | null
  bank_ifsc: string | null
  is_active: boolean | null
  articles: string[] | null
  vendor_type: string | null
  password?: string | null
  product_source_type: string | null
}

interface VendorFormProps {
  vendor?: Vendor
}

export function VendorForm({ vendor }: VendorFormProps) {
  const [name, setName] = useState(vendor?.name || "")
  const [address, setAddress] = useState(vendor?.address || "")
  const [productSource, setProductSource] = useState(vendor?.product_source_type || "")
  const [contactNumber, setContactNumber] = useState(vendor?.contact_number || "")
  const [email, setEmail] = useState(vendor?.email || "")
  const [tradeLicense, setTradeLicense] = useState(vendor?.trade_license || "")
  const [gstNumber, setGstNumber] = useState(vendor?.gst_number || "")
  const [fssaiLicense, setFssaiLicense] = useState(vendor?.fssai_license || "")
  const [gstFileUrl, setGstFileUrl] = useState(vendor?.gst_file_url || "")
  const [fssaiFileUrl, setFssaiFileUrl] = useState(vendor?.fssai_file_url || "")
  const [aadharFileUrl, setAadharFileUrl] = useState(vendor?.aadhar_file_url || "")
  const [panFileUrl, setPanFileUrl] = useState(vendor?.pan_file_url || "")
  const [bankAccountNumber, setBankAccountNumber] = useState(vendor?.bank_account_number || "")
  const [bankName, setBankName] = useState(vendor?.bank_name || "")
  const [bankIfsc, setBankIfsc] = useState(vendor?.bank_ifsc || "")
  const [isActive, setIsActive] = useState(vendor?.is_active !== false) // Default to true
  const [loading, setLoading] = useState(false)
  const [selectedArticles, setSelectedArticles] = useState<string[]>(vendor?.articles || [])
  const [availableArticles, setAvailableArticles] = useState<{ id: string; name: string; article_id: string }[]>([])
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [vendorType, setVendorType] = useState(vendor?.vendor_type || "")
  const [articleSearchQuery, setArticleSearchQuery] = useState("")
  const [password, setPassword] = useState(vendor?.password || generateRandomPassword())

  // File upload states
  const [uploadingGst, setUploadingGst] = useState(false)
  const [uploadingFssai, setUploadingFssai] = useState(false)
  const [uploadingAadhar, setUploadingAadhar] = useState(false)
  const [uploadingPan, setUploadingPan] = useState(false)

  // Generate random 8-digit password
  function generateRandomPassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let password = ""

    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length)
      password += chars[randomIndex]
    }

    return password
  }

  // Validate required fields
  const isFormValid = () => {
    return name.trim() !== "" && contactNumber.trim() !== "" && email.trim() !== "" && gstNumber.trim() !== ""
  }

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  // Fetch articles for dropdown
  useEffect(() => {
    async function fetchArticles() {
      setLoadingArticles(true)
      try {
        // Fetch all available products with unique article_ids
        const { data } = await supabase
          .from("products")
          .select("id, name, article_id")
          .not("article_id", "is", null)
          .order("name")

        if (data) {
          // Filter to get unique article_ids
          const uniqueArticles = Array.from(new Map(data.map((item) => [item.article_id, item])).values())

          setAvailableArticles(uniqueArticles)

          // If editing an existing vendor, fetch their associated articles
          if (vendor?.id) {
            const { data: vendorArticles, error: vendorArticlesError } = await supabase
              .from("vendor_articlestwo")
              .select("article_id")
              .eq("vendor_id", vendor.id)

            if (vendorArticlesError) {
              console.error("Error fetching vendor articles:", vendorArticlesError)
            } else if (vendorArticles && vendorArticles.length > 0) {
              // Extract article IDs and set them as selected
              const vendorArticleIds = vendorArticles.map((va) => va.article_id)
              setSelectedArticles(vendorArticleIds)
              console.log("Pre-selected articles:", vendorArticleIds)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching articles:", error)
      } finally {
        setLoadingArticles(false)
      }
    }

    fetchArticles()
  }, [vendor?.id])

  const toggleArticleSelection = (articleId: string) => {
    if (selectedArticles.includes(articleId)) {
      setSelectedArticles(selectedArticles.filter((id) => id !== articleId))
    } else {
      setSelectedArticles([...selectedArticles, articleId])
    }
  }

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "gst" | "fssai" | "aadhar" | "pan",
    setFileUrl: (url: string) => void,
    setUploading: (loading: boolean) => void,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `vendors/${fileType}/${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`

      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage.from("productsimages").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) throw error

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("productsimages").getPublicUrl(fileName)

      // Set the URL to the appropriate state
      setFileUrl(publicUrl)

      // Reset the file input
      e.target.value = ""

      toast({
        title: "File uploaded",
        description: `The ${fileType.toUpperCase()} file has been uploaded successfully.`,
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Password has been copied to clipboard",
    })
  }

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   setLoading(true)

  //   try {
  //     const vendorData = {
  //       name,
  //       address: address || null,
  //       contact_number: contactNumber || null,
  //       email: email || null,
  //       trade_license: tradeLicense || null,
  //       gst_number: gstNumber || null,
  //       fssai_license: fssaiLicense || null,
  //       gst_file_url: gstFileUrl || null,
  //       fssai_file_url: fssaiFileUrl || null,
  //       aadhar_file_url: aadharFileUrl || null,
  //       pan_file_url: panFileUrl || null,
  //       bank_account_number: bankAccountNumber || null,
  //       bank_name: bankName || null,
  //       bank_ifsc: bankIfsc || null,
  //       is_active: isActive,
  //       vendor_type: vendorType || null,
  //       password: password || generateRandomPassword(), // Ensure password is set
  //     }

  //     let data

  //     if (vendor) {
  //       // Update existing vendor
  //       const { error } = await supabase.from("vendors").update(vendorData).eq("id", vendor.id).select("id")

  //       if (error) throw error

  //       toast({
  //         title: "Vendor updated",
  //         description: "The vendor has been updated successfully.",
  //       })
  //     } else {

  //       const { data: sessionData, error: sessionError } = await supabase.auth.signUp({
  //     email: vendorData?.email,
  //     password: vendorData.password,
  //   })
  //       // Create new vendor
  //       const { data: insertData, error } = await supabase.from("vendors").insert(vendorData).select("id")
  //       data = insertData

  //       if (error) throw error

  //       toast({
  //         title: "Vendor created",
  //         description: "The vendor has been created successfully.",
  //       })
  //     }

  //     // After saving vendor data, handle article relationships
  //     if (selectedArticles.length > 0) {
  //       // First delete existing relationships
  //       if (vendor) {
  //         await supabase.from("vendor_articlestwo").delete().eq("vendor_id", vendor.id)
  //       }

  //       // Then insert new relationships
  //       const vendorId = vendor ? vendor.id : data[0].id
  //       const articleRelationships = selectedArticles.map((articleId) => ({
  //         vendor_id: vendorId,
  //         article_id: articleId,
  //       }))

  //       const { error: relationshipError } = await supabase.from("vendor_articlestwo").insert(articleRelationships)
  //       if (relationshipError) {
  //         console.error("Error saving article relationships:", relationshipError)
  //         toast({
  //           title: "Warning",
  //           description: "Vendor saved but there was an issue linking articles.",
  //           variant: "warning",
  //         })
  //       }
  //     }

  //     router.push("/dashboard/vendors")
  //     router.refresh()
  //   } catch (error: any) {
  //     toast({
  //       title: "Error",
  //       description: error.message,
  //       variant: "destructive",
  //     })
  //   } finally {
  //     setLoading(false)
  //   }
  // }



const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    const finalPassword = password || generateRandomPassword()

    const vendorData = {
      name,
      address: address || null,
      contact_number: contactNumber || null,
      email: email || null,
      trade_license: tradeLicense || null,
      gst_number: gstNumber || null,
      fssai_license: fssaiLicense || null,
      gst_file_url: gstFileUrl || null,
      fssai_file_url: fssaiFileUrl || null,
      aadhar_file_url: aadharFileUrl || null,
      pan_file_url: panFileUrl || null,
      bank_account_number: bankAccountNumber || null,
      bank_name: bankName || null,
      bank_ifsc: bankIfsc || null,
      is_active: isActive,
      vendor_type: vendorType || null,
      product_source_type: ["ISV", "ESV", "Warehouse"].includes(productSource) ? productSource : "Warehouse",
      password: finalPassword,
    }

    let data

    if (vendor) {
      // Update existing vendor
      const { error } = await supabase.from("vendors").update(vendorData).eq("id", vendor.id).select("id")

      if (error) throw error

      toast({
        title: "Vendor updated",
        description: "The vendor has been updated successfully.",
      })
    } else {
      // Create vendor via API
      const res = await fetch("https://v0-next-js-and-supabase-app.vercel.app/api/create-vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorData),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to create vendor")
      data = result.data

      toast({
        title: "Vendor created",
        description: "The vendor has been created successfully.",
      })

      // 📩 Send onboarding email
      if (email) {
        await fetch("https://v0-next-js-and-supabase-app.vercel.app/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            message: `Hello ${name},\n\nCongratulations! You have been successfully onboarded as a vendor on iSmart.\n\nYour login password is: ${finalPassword}\n\nPlease keep this information safe.\n\nThank you,\niSmart Team.`,
          }),
        })
      }
    }

    // 🔁 Handle vendor-article relationships
    const vendorId = vendor ? vendor.id : data[0].id

    if (selectedArticles.length > 0) {
      if (vendor) {
        const { data: existingArticles } = await supabase
          .from("vendor_articlestwo")
          .select("article_id, stock, price")
          .eq("vendor_id", vendor.id)

        const existingArticlesMap = new Map(
          existingArticles?.map((item) => [item.article_id, { stock: item.stock, price: item.price }]) || []
        )

        await supabase.from("vendor_articlestwo").delete().eq("vendor_id", vendor.id)

        const articleRelationships = selectedArticles.map((articleId) => {
          const existing = existingArticlesMap.get(articleId)
          return {
            vendor_id: vendorId,
            article_id: articleId,
            stock: existing?.stock || 0,
            price: existing?.price || 0,
          }
        })

        const { error: relationshipError } = await supabase
          .from("vendor_articlestwo")
          .insert(articleRelationships)

        if (relationshipError) {
          console.error("Error saving article relationships:", relationshipError)
          toast({
            title: "Warning",
            description: "Vendor saved but there was an issue linking articles.",
            variant: "warning",
          })
        }
      } else {
        const articleRelationships = selectedArticles.map((articleId) => ({
          vendor_id: vendorId,
          article_id: articleId,
          stock: 0,
          price: 0,
        }))

        const { error: relationshipError } = await supabase
          .from("vendor_articlestwo")
          .insert(articleRelationships)

        if (relationshipError) {
          console.error("Error saving article relationships:", relationshipError)
          toast({
            title: "Warning",
            description: "Vendor saved but there was an issue linking articles.",
            variant: "warning",
          })
        }
      }
    }

    router.push("/dashboard/vendors")
    router.refresh()
  } catch (error: any) {
    // toast({
    //   title: "Error",
    //   description: error.message,
    //   variant: "destructive",
    // })
  } finally {
    setLoading(false)
  }
}


  // Helper to render file status
  const renderFileStatus = (fileUrl: string, uploading: boolean) => {
    if (uploading)
      return (
        <span className="text-sm text-muted-foreground flex items-center">
          <Upload className="h-4 w-4 mr-1 animate-pulse" /> Uploading...
        </span>
      )
    if (fileUrl)
      return (
        <span className="text-sm text-green-600 flex items-center">
          <Check className="h-4 w-4 mr-1" /> File uploaded
        </span>
      )
    return null
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="banking">Banking Details</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Contact Number</Label>
                <Input id="contact" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="flex items-center gap-2">
                <Input id="password" type="text" value={password} readOnly className="bg-muted cursor-default" />
                <Button type="button" variant="outline" size="sm" onClick={() => copyToClipboard(password)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPassword = generateRandomPassword()
                    setPassword(newPassword)
                    toast({
                      title: "New password generated",
                      description: "The password has been regenerated.",
                    })
                  }}
                >
                  Regenerate
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This is the vendor's login password. It cannot be edited manually.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-type">Vendor Type</Label>
              <Select value={vendorType} onValueChange={setVendorType}>
                <SelectTrigger id="vendor-type">
                  <SelectValue placeholder="Select vendor type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="Miller">Miller</SelectItem>
                  <SelectItem value="C & F">C & F</SelectItem>
                  <SelectItem value="Super stockist">Super stockist</SelectItem>
                  <SelectItem value="Trader">Trader</SelectItem>
                  <SelectItem value="Distributor">Distributor</SelectItem>
                  <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Product Source Type</h3>
              <select
                value={productSource}
                onChange={(e) => setProductSource(e.target.value)}
                className="text-lg border border-input rounded-md px-3 py-2 w-full bg-background"
              >
                <option value="Warehouse">Warehouse</option>
                <option value="ISV">ISV</option>
                <option value="ESV">ESV</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="is-active">Active</Label>
            </div>
          </TabsContent>

          {/* Rest of the form remains the same */}

          <TabsContent value="documents" className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trade-license">Trade License</Label>
                <Input id="trade-license" value={tradeLicense} onChange={(e) => setTradeLicense(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gst-number">GST Number</Label>
                <Input id="gst-number" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fssai-license">FSSAI License</Label>
              <Input id="fssai-license" value={fssaiLicense} onChange={(e) => setFssaiLicense(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gst-file">GST File</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <Input
                      id="gst-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, "gst", setGstFileUrl, setUploadingGst)}
                      className="flex-1"
                      disabled={uploadingGst}
                    />
                  </div>
                  {renderFileStatus(gstFileUrl, uploadingGst)}
                  {gstFileUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={gstFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 flex items-center"
                      >
                        <FileText className="h-4 w-4 mr-1" /> View file
                      </a>
                      <button
                        type="button"
                        onClick={() => setGstFileUrl("")}
                        className="text-sm text-red-600 flex items-center"
                      >
                        <X className="h-4 w-4 mr-1" /> Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fssai-file">FSSAI File</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <Input
                      id="fssai-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, "fssai", setFssaiFileUrl, setUploadingFssai)}
                      className="flex-1"
                      disabled={uploadingFssai}
                    />
                  </div>
                  {renderFileStatus(fssaiFileUrl, uploadingFssai)}
                  {fssaiFileUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={fssaiFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 flex items-center"
                      >
                        <FileText className="h-4 w-4 mr-1" /> View file
                      </a>
                      <button
                        type="button"
                        onClick={() => setFssaiFileUrl("")}
                        className="text-sm text-red-600 flex items-center"
                      >
                        <X className="h-4 w-4 mr-1" /> Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aadhar-file">Aadhar File</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <Input
                      id="aadhar-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, "aadhar", setAadharFileUrl, setUploadingAadhar)}
                      className="flex-1"
                      disabled={uploadingAadhar}
                    />
                  </div>
                  {renderFileStatus(aadharFileUrl, uploadingAadhar)}
                  {aadharFileUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={aadharFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 flex items-center"
                      >
                        <FileText className="h-4 w-4 mr-1" /> View file
                      </a>
                      <button
                        type="button"
                        onClick={() => setAadharFileUrl("")}
                        className="text-sm text-red-600 flex items-center"
                      >
                        <X className="h-4 w-4 mr-1" /> Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pan-file">PAN File</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <Input
                      id="pan-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, "pan", setPanFileUrl, setUploadingPan)}
                      className="flex-1"
                      disabled={uploadingPan}
                    />
                  </div>
                  {renderFileStatus(panFileUrl, uploadingPan)}
                  {panFileUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={panFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 flex items-center"
                      >
                        <FileText className="h-4 w-4 mr-1" /> View file
                      </a>
                      <button
                        type="button"
                        onClick={() => setPanFileUrl("")}
                        className="text-sm text-red-600 flex items-center"
                      >
                        <X className="h-4 w-4 mr-1" /> Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="banking" className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank-account">Bank Account Number</Label>
              <Input
                id="bank-account"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank-name">Bank Name</Label>
                <Input id="bank-name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank-ifsc">IFSC Code</Label>
                <Input id="bank-ifsc" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="articles" className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Associated Articles</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select the articles that this vendor supplies. This will help filter articles when creating purchase
                orders.
              </p>

              {loadingArticles ? (
                <div className="text-center py-4">Loading articles...</div>
              ) : availableArticles.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Search articles..."
                      value={articleSearchQuery}
                      onChange={(e) => setArticleSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedArticles(availableArticles.map((a) => a.article_id))}
                      className="bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#DBEAFE] border-[#BFDBFE]"
                    >
                      Select All
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedArticles([])}>
                      Clear
                    </Button>
                  </div>
                  <div className="border rounded-md p-2 max-h-[300px] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {availableArticles
                        .filter(
                          (article) =>
                            article.name.toLowerCase().includes(articleSearchQuery.toLowerCase()) ||
                            (article.article_id &&
                              article.article_id.toLowerCase().includes(articleSearchQuery.toLowerCase())),
                        )
                        .map((article) => (
                          <div
                            key={article.id}
                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted ${
                              selectedArticles.includes(article.article_id) ? "bg-muted" : ""
                            }`}
                            onClick={() => toggleArticleSelection(article.article_id)}
                          >
                            <div
                              className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                                selectedArticles.includes(article.article_id)
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-primary"
                              }`}
                            >
                              {selectedArticles.includes(article.article_id) && <CheckIcon className="h-3 w-3" />}
                            </div>
                            <span>
                              {article.name}{" "}
                              <span className="text-xs text-muted-foreground">({article.article_id})</span>
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">No articles available</div>
              )}

              <div className="mt-2">
                <p className="text-sm font-medium">Selected: {selectedArticles.length} articles</p>
              </div>
            </div>
          </TabsContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/vendors")}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingGst || uploadingFssai || uploadingAadhar || uploadingPan || !isFormValid()}
            >
              {loading ? "Saving..." : vendor ? "Update Vendor" : "Create Vendor"}
            </Button>
          </CardFooter>
        </Tabs>
      </Card>
    </form>
  )
}
