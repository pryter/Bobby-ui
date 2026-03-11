"use client"
import {
  ArchiveBoxIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  KeyIcon,
  ServerStackIcon,
} from "@heroicons/react/24/outline"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import classnames from "classnames"
import { useMemo, type FC, type ForwardRefExoticComponent, type SVGProps } from "react"
import { createClient } from "@/lib/supabase/client"
import { TierBadge } from "@/components/Badge/TierBadge"

interface UserData {
  email: string
  fullName: string
  avatarUrl: string
}

interface MenuItemProps {
  Icon: ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref">>
  title: string
  id: string
}

const MenuItem: FC<MenuItemProps> = ({ Icon, title, id }) => {
  const pathname = usePathname()
  const href = useMemo(() => {
    return id === "" ? "/dashboard" : `/dashboard/${id}`
  }, [id])

  const isHighlighted = useMemo(() => {
    return id === "" ? pathname === "/dashboard" : pathname.startsWith(`/dashboard/${id}`)
  }, [id, pathname])

  return (
    <Link href={href}>
      <motion.div
        className={classnames(
          "mt-2 flex w-full cursor-pointer items-center space-x-4 rounded-full px-4 py-2 transition-colors",
          isHighlighted
            ? "bg-gray-900 text-white shadow-lg"
            : "hover:bg-gray-600 hover:bg-opacity-20"
        )}
      >
        <Icon stroke="currentColor" strokeWidth={2.3} className="h-6 w-6 shrink-0" />
        <h2 className="h-[24px] overflow-hidden font-medium">{title}</h2>
      </motion.div>
    </Link>
  )
}

export default function DashboardSidebar({ userData }: { userData: UserData }) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/account")
  }

  return (
    <motion.div
      initial={{ padding: "1.5rem 2rem" }}
      className="relative flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-pink-300 via-purple-300 to-indigo-400"
      style={{ padding: "1.5rem 2rem" }}
    >
      <div className="absolute left-0 top-0 z-[0] h-full w-full bg-white bg-opacity-90" />
      <div className="z-[1] flex flex-row items-center">
        <h1 className="relative text-xl font-bold text-gray-800">Bobby</h1>
        <TierBadge variant="pro" />
      </div>
      <div className="relative z-[1] mt-6 flex h-full w-[240px] grow flex-col justify-between">
        <div>
          <MenuItem Icon={HomeIcon} title="Home" id="" />
          <MenuItem Icon={FolderIcon} title="Projects" id="project" />
          <h2 className="mt-6 text-sm font-medium text-gray-500">Monitoring</h2>
          <MenuItem Icon={CommandLineIcon} title="Log Manager" id="log" />
          <MenuItem Icon={ArchiveBoxIcon} title="Artifacts" id="artifacts" />
          <h2 className="mt-6 text-sm font-medium text-gray-500">Build settings</h2>
          <MenuItem Icon={KeyIcon} title="Secrets" id="secrets" />
          <MenuItem Icon={ServerStackIcon} title="Workers" id="workers" />
        </div>
        <div>
          <MenuItem Icon={DocumentTextIcon} title="Account" id="account" />
          <MenuItem Icon={Cog6ToothIcon} title="Preferences" id="setting" />
          <div className="relative mt-4 flex flex-row rounded-xl bg-gray-900 pl-4 text-white">
            <div className="flex h-full flex-row items-center py-3">
              <div
                style={{
                  backgroundImage: `url('${userData.avatarUrl}')`,
                  backgroundSize: "contain",
                }}
                className="h-10 w-10 shrink-0 rounded-full bg-white"
              />
              <div className="ml-2 w-[146px]">
                <h3 className="truncate text-sm font-medium">{userData.fullName}</h3>
                <h4 className="truncate text-xs text-gray-300">{userData.email}</h4>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-1 flex cursor-pointer items-center rounded-r-xl pl-1 pr-2 transition-colors hover:bg-white hover:text-gray-900"
            >
              <ArrowRightOnRectangleIcon stroke="currentColor" strokeWidth={2.8} className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
