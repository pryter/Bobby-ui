// Single source of truth for the products shown on the landing page carousel
// and the /products/[slug] pages. Plain data only (no JSX) so server components
// can read it for metadata and static params.

export type ProductStatus = "Live" | "Beta" | "Archived"

export type ProductLink = {
  label: string
  href: string
  external?: boolean
}

// Real product imagery lives in /public/products/<slug>/. Until a product has
// an `image`, cards and pages fall back to its illustrated scene (ProductArt).
export type ProductImage = {
  src: string // e.g. "/products/ucelot/cover.png" — also the poster when there's a video
  alt: string
  video?: string // optional short muted loop (mp4) that plays in place of the still
  focus?: string // which part to keep when a slot crops it (CSS object-position), default centre
}

export type Product = {
  slug: string
  name: string
  shortName: string
  status: ProductStatus
  accent: string // matches the hero tile palette
  tagline: string // one line — cards, metadata
  summary: string // a short paragraph — expanded card, product page hero
  features: {
    title: string
    short: string // a few words — carousel card
    desc: string // a sentence — product page
  }[]
  steps?: { title: string; desc: string }[] // "How it works" on the product page
  image?: ProductImage // cover — carousel card + product page hero (5:4)
  gallery?: ProductImage[] // extra screenshots on the product page (16:10)
  primary?: ProductLink
  secondary?: ProductLink
}

export const UCELOT_URL = "https://ucelot.com"

export const PRODUCTS: Product[] = [
  {
    slug: "ucelot",
    name: "Ucelot",
    shortName: "Ucelot",
    status: "Live",
    accent: "#1db954",
    tagline: "Understands your codebase and documents, and answers with sources.",
    summary:
      "Ucelot reads your repositories and documents. Questions, issues and reviews come back with the files, lines and pages that matter.",
    features: [
      { title: "Knows your repo", short: "Understands your code, nothing to install.", desc: "Connect a Git repository and Ucelot builds an understanding of it in an isolated workspace. Nothing to install." },
      { title: "Answers with sources", short: "Every answer points to where it came from.", desc: "Ask about your code or documents and every answer points back to where it came from." },
      { title: "Grounded issues", short: "Issues cite the files and lines that matter.", desc: "Issues arrive citing the exact files and lines worth investigating." },
      { title: "A readable backlog", short: "Duplicate reports get linked, not piled up.", desc: "Spots when a new report duplicates one you already have, and links the two." },
    ],
    steps: [
      { title: "Connect a repository", desc: "Link a Git repo. There's nothing to install and no agent to run on your machines." },
      { title: "Ucelot reads it", desc: "Your code and documents are analysed in an isolated workspace, and kept current as they change." },
      { title: "Work from grounded answers", desc: "Ask questions and open issues that cite the exact files, lines and pages worth looking at." },
    ],
    image: {
      src: "/products/ucelot/cover.jpg",
      video: "/products/ucelot/timeline-loop.mp4",
      focus: "12% 50%", // the plan's first weeks, where the drops start
      alt: "Ucelot's planning timeline: issues drop onto a shared timeline week by week, then the timeline slides on as new work lands on later dates",
    },
    primary: { label: "Open Ucelot", href: UCELOT_URL, external: true },
    secondary: { label: "Ucelot docs", href: `${UCELOT_URL}/docs`, external: true },
  },
  {
    slug: "component-zoo",
    name: "Component Zoo",
    shortName: "Component Zoo",
    status: "Live",
    accent: "#7c3aed",
    tagline: "A live canvas for your React components.",
    summary:
      "Your real components run as live nodes on a freeform canvas. Plug data into their props and see each state straight away, without clicking through the app or starting a backend.",
    features: [
      { title: "Finds your components", short: "Every export shows up with its prop types.", desc: "Point it at a project and every exported component shows up, with its prop types." },
      { title: "Typed prop ports", short: "Drag data into a prop, see it re-render.", desc: "Each prop becomes a port. Drag data in and the component re-renders live." },
      { title: "Data from anywhere", short: "JSON, CSV or JavaScript, reused anywhere.", desc: "Create data from JSON, CSV or JavaScript, and reuse it across components." },
      { title: "Pages and collages", short: "One component per page, or many side by side.", desc: "Lay out one component per page or many side by side. Everything saves as you go." },
    ],
    steps: [
      { title: "Point it at a project", desc: "The Zoo finds every exported component and reads its prop types." },
      { title: "Wire in data", desc: "Create data from JSON, CSV or JavaScript and drag it straight into props." },
      { title: "Compose and review", desc: "Arrange components into pages or collages. Everything saves as you go." },
    ],
    image: {
      src: "/products/component-zoo/cover.jpg",
      video: "/products/component-zoo/studio-loop.mp4",
      alt: "Component Zoo studio with three collaborators: one drags a Sparkline across the stage, one recolours the Revenue card from its wiring node, and their selections show as coloured outlines",
    },
    gallery: [
      { src: "/products/component-zoo/studio.png", alt: "The full Component Zoo studio: page browser, stage, wiring graph and the inspector showing a StatCard's ports and resolved props" },
    ],
    primary: { label: "Open Component Zoo", href: "https://zoo.bobby.host", external: true },
  },
  {
    slug: "conversation-engine",
    name: "Interactive Smart Conversation Engine",
    shortName: "Conversation Engine",
    status: "Beta",
    accent: "#2563eb",
    tagline: "Real-time conversation that replies quickly and keeps track of context.",
    summary:
      "A conversation engine that keeps up with people. It replies quickly, remembers what was said, and is easy to talk to.",
    features: [
      { title: "Fast", short: "Replies arrive in time to keep things flowing.", desc: "Responses arrive quickly enough to keep a conversation flowing." },
      { title: "Smart", short: "Draws on the right knowledge and context.", desc: "Answers draw on the right knowledge and the context of the conversation." },
      { title: "Interactive", short: "Follows the whole back-and-forth.", desc: "Follows the whole back-and-forth instead of treating each question on its own." },
    ],
  },
  {
    slug: "bobby-ci",
    name: "Bobby CI",
    shortName: "Bobby CI",
    status: "Archived",
    accent: "#f5a623",
    tagline: "Self-hosted build pipelines. One command, no YAML.",
    summary:
      "Turn any machine into a build runner with a single command — no ports, no proxies. Compose pipelines on a visual canvas and keep every build on your own infrastructure.",
    features: [
      { title: "Zero config", short: "One command, even behind NAT or a VPN.", desc: "One command and you're live, even behind NAT or a VPN. No port forwarding." },
      { title: "No-code pipelines", short: "Snap stages together on a visual canvas.", desc: "Snap build, test and deploy stages together on a visual canvas." },
      { title: "Self-hosted", short: "Builds run isolated on your own machine.", desc: "Every step runs isolated on your own machine. Your code never leaves it." },
      { title: "Integrations", short: "GitHub or GitLab, building on every push.", desc: "Connect GitHub or GitLab and build on every push." },
    ],
    steps: [
      { title: "Run one command", desc: "Turn any machine into a build runner — no ports, no proxies, no firewall rules." },
      { title: "Build a pipeline", desc: "Snap build, test and deploy stages together on the visual canvas." },
      { title: "Push to ship", desc: "Every push runs your pipeline on your own infrastructure, start to finish." },
    ],
    primary: { label: "Read more", href: "/docs/archived/bobby-ci" },
    secondary: { label: "Open dashboard", href: "/dashboard" },
  },
]

// Archived products keep their page (old links still work) but are left out of
// the carousel, the timeline and "More from the lab".
export const ACTIVE_PRODUCTS = PRODUCTS.filter((p) => p.status !== "Archived")

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug)
}
