import { type ReactNode } from "react"

interface AccountNavItemProps {
  icon: ReactNode
  title: string
  active: boolean
  onClick: () => void
}

export function AccountNavItem({ icon, title, active, onClick }: AccountNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 w-full p-2 rounded-lg transition-all duration-200 ${
        active ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "text-gray-300 hover:bg-gray-700"
      }`}
    >
      {icon}
      <span>{title}</span>
    </button>
  )
}
