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
      className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 min-h-[44px] whitespace-nowrap ${
        active 
          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" 
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-sm md:text-base font-medium">{title}</span>
    </button>
  )
}
