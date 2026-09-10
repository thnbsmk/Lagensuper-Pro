import {
  Bot,
  Boxes,
  Brain,
  FileClock,
  Gauge,
  House,
  Settings,
  Wrench,
} from 'lucide-react'

export const navItems = [
  { label: 'Home', href: '/', icon: House },
  { label: 'Chat', href: '/chat', icon: Bot },
  { label: 'Projects', href: '/projects', icon: Boxes },
  { label: 'Memory', href: '/memory', icon: Brain },
  { label: 'Tools', href: '/tools', icon: Wrench },
  { label: 'Runtime', href: '/runtime', icon: Gauge },
  { label: 'Audit', href: '/audit', icon: FileClock },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const
