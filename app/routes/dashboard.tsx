import {
  ArchiveBoxIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  KeyIcon,
  ServerStackIcon
} from "@heroicons/react/24/outline"
import type { LoaderFunctionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { Outlet, useNavigate } from "@remix-run/react"
import { getServerSB } from "@server-lib/supabase"
import classnames from "classnames"
import type { FC, ForwardRefExoticComponent, SVGProps } from "react"
import { useEffect } from "react"

import { useCurtain } from "@/hooks/useCurtain"
import { useSupabase } from "@/root"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [sb] = await getServerSB(request)
  const {
    data: { session }
  } = await sb.auth.getSession()

  if (!session) {
    return redirect("/account")
  }

  return json({})
}

interface MenuItemProps {
  Icon: ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref">>
  title: string
  selected?: boolean
  id: string
}
const MenuItem: FC<MenuItemProps> = ({ Icon, title, id, selected = false }) => {
  return (
    <div
      className={classnames(
        "mt-2 flex w-full cursor-pointer items-center space-x-4 rounded-full px-4 py-2 transition-colors",
        selected
          ? "bg-gray-900 text-white shadow-lg"
          : "hover:bg-gray-600 hover:bg-opacity-20"
      )}
    >
      <Icon stroke="currentColor" strokeWidth={2.3} className="h-6 w-6" />
      <h2 className="font-medium">{title}</h2>
    </div>
  )
}
export default function Dashboard() {
  const supabase = useSupabase()
  const navigate = useNavigate()
  const [l, curtain] = useCurtain()

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((e, s) => {
      if (!s) {
        navigate("/account")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="relative flex min-h-screen flex-row items-start text-gray-800">
      {curtain}
      <div className="relative flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-pink-300 via-purple-300 to-indigo-400 px-8 py-6">
        <div className="absolute left-0 top-0 z-[0] h-full w-full bg-white bg-opacity-90" />
        <h1 className="relative z-[1] text-xl font-bold text-gray-800">
          Bobby
        </h1>
        <div className="relative z-[1] mt-6 flex h-full w-[240px] grow flex-col justify-between">
          <div>
            <MenuItem
              Icon={HomeIcon}
              title={"Home"}
              id={"home"}
              selected={true}
            />
            <MenuItem Icon={FolderIcon} title={"Projects"} id={"project"} />
            <h2 className="mt-6 text-sm font-medium text-gray-500">
              Monitoring
            </h2>
            <MenuItem Icon={CommandLineIcon} title={"Log Manager"} id={"log"} />
            <MenuItem
              Icon={ArchiveBoxIcon}
              title={"Artifacts"}
              id={"artifacts"}
            />
            <h2 className="mt-6 text-sm font-medium text-gray-500">
              Build settings
            </h2>
            <MenuItem Icon={KeyIcon} title={"Secrets"} id={"secrets"} />
            <MenuItem Icon={ServerStackIcon} title={"Workers"} id={"workers"} />
          </div>
          <div className="">
            <MenuItem
              Icon={DocumentTextIcon}
              title={"Account"}
              id={"account"}
            />
            <MenuItem
              Icon={Cog6ToothIcon}
              title={"Preferences"}
              id={"setting"}
            />
            <div className="relative mt-4 flex flex-row rounded-xl bg-gray-900 pl-4 text-white">
              <div className="flex h-full flex-row items-center py-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-white" />
                <div className="ml-2 h-full w-[146px]">
                  <h3 className="truncate text-sm font-medium">
                    Phongpak Tengpipat
                  </h3>
                  <h4 className="truncate text-xs">peterphongpak@gmail.com</h4>
                </div>
              </div>
              <button
                onClick={() => {
                  supabase.auth.signOut()
                  l(true)
                }}
                className="ml-1 flex cursor-pointer items-center rounded-r-xl pl-1 pr-2 transition-colors hover:bg-white hover:text-gray-900"
              >
                <ArrowRightOnRectangleIcon
                  stroke="currentColor"
                  strokeWidth={2.8}
                  className="h-4 w-4"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
