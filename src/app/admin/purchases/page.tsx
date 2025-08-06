'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  DollarSign, 
  CheckCircle, 
  XCircle,
  Clock,
  Search,
  Eye,
  Edit
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface PurchaseWithDetails {
  id: number
  buyer_id: string
  product_id: number
  amount_cents: number
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method: string | null
  admin_notes: string | null
  paid_at: string | null
  created_at: string
  profiles: {
    username: string
    id: string
  } | null
  products: {
    name: string
    type: string
    price_cents: number
  } | null
}

export default function AdminPurchasesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'failed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingPurchase, setEditingPurchase] = useState<number | null>(null)
  const [editData, setEditData] = useState({
    status: 'pending' as 'pending' | 'paid' | 'failed' | 'refunded',
    payment_method: '',
    admin_notes: ''
  })

  const fetchPurchases = async () => {
    try {
      setIsLoading(true)

      let query = supabase
        .from('purchases')
        .select(`
          *,
          profiles!purchases_buyer_id_fkey (username, id),
          products (name, type, price_cents)
        `)
        .order('created_at', { ascending: false })

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      let filteredData = data || []

      // Apply search filter
      if (searchTerm) {
        filteredData = filteredData.filter(purchase => 
          purchase.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          purchase.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          purchase.id.toString().includes(searchTerm)
        )
      }

      setPurchases(filteredData)
    } catch (error) {
      console.error('Error fetching purchases:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
      return
    }

    if (user) {
      fetchPurchases()
    }
  }, [user, loading, router, filter, searchTerm])

  // Redirect if not authenticated or not admin
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleEditPurchase = (purchase: PurchaseWithDetails) => {
    setEditingPurchase(purchase.id)
    setEditData({
      status: purchase.status,
      payment_method: purchase.payment_method || '',
      admin_notes: purchase.admin_notes || ''
    })
  }

  const handleSavePurchase = async () => {
    if (!editingPurchase) return

    try {
      const updateData: any = {
        status: editData.status,
        payment_method: editData.payment_method || null,
        admin_notes: editData.admin_notes || null
      }

      // Set paid_at timestamp if marking as paid
      if (editData.status === 'paid') {
        updateData.paid_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('purchases')
        .update(updateData)
        .eq('id', editingPurchase)

      if (updateError) {
        throw updateError
      }

      // If marked as paid, create access grants
      if (editData.status === 'paid') {
        const purchase = purchases.find(p => p.id === editingPurchase)
        if (purchase?.buyer_id && purchase?.product_id) {
          await createAccessGrants(purchase.buyer_id, purchase.product_id)
        }
      }

      setEditingPurchase(null)
      fetchPurchases()
    } catch (error) {
      console.error('Error updating purchase:', error)
      alert('Error actualizando compra')
    }
  }

  const createAccessGrants = async (buyerId: string, productId: number) => {
    try {
      // Get product items (bets included in this product)
      const { data: productItems, error: itemsError } = await supabase
        .from('product_items')
        .select('bet_id')
        .eq('product_id', productId)

      if (itemsError) {
        throw itemsError
      }

      if (productItems && productItems.length > 0) {
        // Create access grants for each bet
        const accessGrants = productItems.map(item => ({
          buyer_id: buyerId,
          bet_id: item.bet_id,
          expires_at: null // Permanent access for individual purchases
        }))

        const { error: grantsError } = await supabase
          .from('access_grants')
          .upsert(accessGrants, {
            onConflict: 'buyer_id,bet_id'
          })

        if (grantsError) {
          throw grantsError
        }
      }
    } catch (error) {
      console.error('Error creating access grants:', error)
    }
  }

  const PurchaseCard = ({ purchase }: { purchase: PurchaseWithDetails }) => {
    const isPending = purchase.status === 'pending'
    const isPaid = purchase.status === 'paid'
    const isFailed = purchase.status === 'failed'
    const isEditing = editingPurchase === purchase.id

    return (
      <Card className={`${
        isPending ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950' :
        isPaid ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' :
        isFailed ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' : ''
      }`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">
                Compra #{purchase.id}
              </CardTitle>
              <CardDescription className="mt-1">
                {purchase.profiles?.username} • {purchase.products?.name}
              </CardDescription>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <Badge variant={
                isPending ? 'secondary' :
                isPaid ? 'default' :
                isFailed ? 'destructive' : 'secondary'
              }>
                {purchase.status.toUpperCase()}
              </Badge>
              
              <div className="text-lg font-bold">
                {formatCurrency(purchase.amount_cents || purchase.products?.price_cents || 0)}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Estado</Label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    status: e.target.value as any
                  }))}
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagado</option>
                  <option value="failed">Fallido</option>
                  <option value="refunded">Reembolsado</option>
                </select>
              </div>

              <div>
                <Label htmlFor="payment_method">Método de Pago</Label>
                <Input
                  id="payment_method"
                  value={editData.payment_method}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    payment_method: e.target.value
                  }))}
                  placeholder="Ej: Transferencia, Efectivo, PayPal"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="admin_notes">Notas del Admin</Label>
                <Textarea
                  id="admin_notes"
                  value={editData.admin_notes}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    admin_notes: e.target.value
                  }))}
                  placeholder="Notas internas sobre esta compra"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleSavePurchase}>
                  <CheckCircle size={14} className="mr-1" />
                  Guardar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setEditingPurchase(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Usuario:</span>
                  <p className="font-medium">{purchase.profiles?.username || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Producto:</span>
                  <p className="font-medium">
                    {purchase.products?.name}
                    <Badge variant="outline" className="ml-2">
                      {purchase.products?.type}
                    </Badge>
                  </p>
                </div>
                
                {purchase.payment_method && (
                  <div>
                    <span className="text-muted-foreground">Método de Pago:</span>
                    <p className="font-medium">{purchase.payment_method}</p>
                  </div>
                )}
                
                {purchase.paid_at && (
                  <div>
                    <span className="text-muted-foreground">Pagado:</span>
                    <p className="font-medium">{formatDate(purchase.paid_at)}</p>
                  </div>
                )}
              </div>

              {purchase.admin_notes && (
                <div>
                  <span className="text-muted-foreground text-sm">Notas del Admin:</span>
                  <p className="text-sm mt-1 p-2 bg-muted/50 rounded">{purchase.admin_notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleEditPurchase(purchase)}
                >
                  <Edit size={14} className="mr-1" />
                  Editar
                </Button>
                
                {isPending && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setEditingPurchase(purchase.id)
                        setEditData({
                          status: 'paid',
                          payment_method: purchase.payment_method || '',
                          admin_notes: purchase.admin_notes || ''
                        })
                        setTimeout(handleSavePurchase, 100)
                      }}
                    >
                      <CheckCircle size={14} className="mr-1" />
                      Marcar como Pagado
                    </Button>
                  </>
                )}
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>Creado {formatDate(purchase.created_at)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Compras</h1>
        <p className="text-muted-foreground">
          Administra las compras y pagos de los usuarios
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'pending', 'paid', 'failed'] as const).map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterOption)}
            >
              {filterOption === 'all' ? 'Todas' : 
               filterOption === 'pending' ? 'Pendientes' :
               filterOption === 'paid' ? 'Pagadas' : 'Fallidas'}
            </Button>
          ))}
        </div>
        
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Buscar por usuario, producto o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-lg font-bold">
                  {purchases.filter(p => p.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pagadas</p>
                <p className="text-lg font-bold">
                  {purchases.filter(p => p.status === 'paid').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Fallidas</p>
                <p className="text-lg font-bold">
                  {purchases.filter(p => p.status === 'failed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Ingresos</p>
                <p className="text-lg font-bold">
                  {formatCurrency(
                    purchases
                      .filter(p => p.status === 'paid')
                      .reduce((sum, p) => sum + (p.amount_cents || p.products?.price_cents || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchases List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando compras...</p>
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No hay compras</h3>
            <p className="text-muted-foreground">
              No se encontraron compras con los filtros seleccionados
            </p>
          </div>
        ) : (
          purchases.map((purchase) => (
            <PurchaseCard key={purchase.id} purchase={purchase} />
          ))
        )}
      </div>
    </div>
  )
}