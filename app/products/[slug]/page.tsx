import { notFound } from "next/navigation"
import ProductView from "@/components/products/ProductView"
import UcelotShowcase from "@/components/products/ucelot/UcelotShowcase"
import { PRODUCTS, getProduct } from "@/lib/products"

export const dynamicParams = false

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) return { title: "Bobby" }
  return {
    title: `${product.name} — Bobby`,
    description: product.tagline,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!getProduct(slug)) notFound()
  // Products with a bespoke showcase page; the rest use the shared template.
  if (slug === "ucelot") return <UcelotShowcase />
  return <ProductView slug={slug} />
}
