import { redirect } from "next/navigation"

// The product list lives on the landing page.
export default function ProductsIndex() {
  redirect("/#products")
}
