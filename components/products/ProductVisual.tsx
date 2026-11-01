import Image from "next/image"
import PixelMotif from "@/components/PixelMotif"
import ProductArt from "@/components/products/ProductArt"
import LoopVideo from "@/components/products/LoopVideo"
import { PRODUCTS, type Product, type ProductImage } from "@/lib/products"

// The product's picture inside a tinted, rounded panel. Uses the real cover
// image (or its looping video) when the product has one; otherwise the
// illustrated scene on top of the pixel motif. `className` sets the panel's
// size and radius.
export default function ProductVisual({
  product, zoom = 1, sizes, priority, className = "", image,
}: {
  product: Product
  zoom?: number // illustration scale — ignored for images
  sizes: string // next/image sizes hint for the slot this panel fills
  priority?: boolean
  className?: string
  image?: ProductImage // override (e.g. a gallery shot); defaults to the cover
}) {
  const img = image ?? product.image
  return (
    <div
      className={"relative flex items-center justify-center overflow-hidden " + className}
      style={{ background: `${product.accent}14` }}
    >
      {img?.video ? (
        <LoopVideo src={img.video} poster={img.src} label={img.alt} className="absolute inset-0 h-full w-full object-cover" />
      ) : img ? (
        <Image src={img.src} alt={img.alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <>
          <PixelMotif color={product.accent} index={PRODUCTS.indexOf(product)} className="opacity-90" />
          <div className="relative" style={{ zoom }}>
            <ProductArt slug={product.slug} />
          </div>
        </>
      )}
    </div>
  )
}
