'use client'

import { AdminGuard } from '@/components/admin-guard'
import { Navigation } from '@/components/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminGuard fallbackPath="/feed">
      <div className="flex h-screen bg-gray-50">
        <Navigation />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  )
}