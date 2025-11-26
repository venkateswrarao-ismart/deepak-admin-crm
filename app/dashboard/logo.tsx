import Image from "next/image"

export default function Logo() {
  return (
    <Image
      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Applogo-removebg-preview-50F3D8bblCAnwaucpOJFvgaO5m9F7X.png"
      alt="iSmart - Add to Cart, Save your Wallet"
      width={160}
      style={{ height: "auto" }}
      priority
    />
  )
}
