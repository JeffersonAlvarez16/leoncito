'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Home, 
  TrendingUp, 
  User, 
  Settings, 
  Menu,
  X,
  Upload,
  BarChart3,
  DollarSign,
  Package,
  ChevronLeft,
  LogOut,
  Layers,
  Users
} from 'lucide-react'

export function Navigation() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isAdmin = profile?.role === 'admin' || profile?.role === 'tipster'
  
  const publicRoutes = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/feed', label: 'Feed', icon: TrendingUp },
  ]

  const userRoutes = [
    { href: '/profile', label: 'Perfil', icon: User },
  ]

  const adminRoutes = [
    { 
      label: 'Gestión de Apuestas', 
      routes: [
        { href: '/admin/upload', label: 'Subir', icon: Upload },
        { href: '/admin/manage-bets', label: 'Individuales', icon: TrendingUp },
        { href: '/admin/multiple-bets', label: 'Múltiples', icon: Layers },
        { href: '/admin/bets', label: 'Mis Apuestas', icon: Settings },
      ]
    },
    { 
      label: 'Negocio', 
      routes: [
        { href: '/admin/products', label: 'Productos', icon: Package },
        { href: '/admin/purchases', label: 'Compras', icon: DollarSign },
        { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      ]
    },
    { 
      label: 'Administración', 
      routes: [
        { href: '/admin/users', label: 'Usuarios', icon: Users },
        { href: '/admin/security', label: 'Seguridad', icon: Settings },
      ]
    }
  ]

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      } else {
        setIsCollapsed(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const SidebarNavLink = ({ href, label, icon: Icon }: { href: string, label: string, icon: any }) => {
    const active = isActiveRoute(href)
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          isCollapsed && "justify-center px-2"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Icon size={20} className="flex-shrink-0" />
        {!isCollapsed && <span>{label}</span>}
      </Link>
    )
  }

  // Hide navigation on auth page
  if (pathname === '/auth') {
    return null
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed left-0 top-0 h-screen bg-background border-r transition-all duration-300 ease-in-out z-50",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/" className={cn("flex items-center space-x-2", isCollapsed && "justify-center")}>
            <TrendingUp className="h-8 w-8 text-primary" />
            {!isCollapsed && <span className="font-bold text-xl">ApuestasPro</span>}
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newState = !isCollapsed
              setIsCollapsed(newState)
              // Emit custom event for layout adjustment
              window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: newState }))
            }}
            className={cn("h-8 w-8 p-0", isCollapsed && "absolute -right-3 bg-background border shadow-sm rounded-full")}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Public Routes */}
          <div className="space-y-2">
            {!isCollapsed && <h6 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">General</h6>}
            {publicRoutes.map((route) => (
              <SidebarNavLink key={route.href} {...route} />
            ))}
            
            {user && userRoutes.map((route) => (
              <SidebarNavLink key={route.href} {...route} />
            ))}
          </div>

          {/* Admin Routes */}
          {user && isAdmin && (
            <>
              {adminRoutes.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-2">
                  {!isCollapsed && (
                    <h6 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                      {section.label}
                    </h6>
                  )}
                  {section.routes.map((route) => (
                    <SidebarNavLink key={route.href} {...route} />
                  ))}
                </div>
              ))}
            </>
          )}
        </div>

        {/* User Section */}
        {user && (
          <div className="border-t p-4">
            <div className={cn("space-y-2", isCollapsed && "flex flex-col items-center")}>
              {!isCollapsed && (
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Usuario</p>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className={cn(
                  "w-full justify-start text-muted-foreground hover:text-foreground",
                  isCollapsed && "w-auto px-2"
                )}
              >
                <LogOut size={16} className="mr-2" />
                {!isCollapsed && "Cerrar Sesión"}
              </Button>
            </div>
          </div>
        )}

        {/* Login Button for non-users */}
        {!user && (
          <div className="border-t p-4">
            <Button 
              className={cn("w-full", isCollapsed && "w-auto px-3")}
              onClick={() => router.push('/auth')}
            >
              {isCollapsed ? <User size={16} /> : "Iniciar Sesión"}
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Navigation */}
      <nav className="md:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6" />
            <span className="font-bold">ApuestasPro</span>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
        
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute top-14 left-0 right-0 bg-background border-b shadow-lg max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Public Routes */}
              <div className="space-y-2">
                <h6 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">General</h6>
                {publicRoutes.map((route) => (
                  <SidebarNavLink key={route.href} {...route} />
                ))}
                {user && userRoutes.map((route) => (
                  <SidebarNavLink key={route.href} {...route} />
                ))}
              </div>

              {/* Admin Routes */}
              {user && isAdmin && (
                <>
                  {adminRoutes.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="space-y-2">
                      <h6 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {section.label}
                      </h6>
                      {section.routes.map((route) => (
                        <SidebarNavLink key={route.href} {...route} />
                      ))}
                    </div>
                  ))}
                </>
              )}

              {/* User Section */}
              {user ? (
                <div className="border-t pt-4 space-y-2">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Usuario</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                  >
                    <LogOut size={16} className="mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <Button 
                    className="w-full"
                    onClick={() => {
                      router.push('/auth')
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    Iniciar Sesión
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t">
          <div className="flex items-center justify-around px-2 py-2">
            <Link
              href="/feed"
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-colors",
                isActiveRoute('/feed') ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <TrendingUp size={20} />
              <span className="text-xs">Feed</span>
            </Link>
            
            {isAdmin && (
              <Link
                href="/admin/bets"
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-colors",
                  isActiveRoute('/admin') ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Settings size={20} />
                <span className="text-xs">Admin</span>
              </Link>
            )}
            
            <Link
              href="/profile"
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-colors",
                isActiveRoute('/profile') ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <User size={20} />
              <span className="text-xs">Perfil</span>
            </Link>
          </div>
        </nav>
      )}
      
    </>
  )
}