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
  Plus, 
  Edit, 
  Trash2, 
  Package,
  Eye,
  EyeOff,
  DollarSign
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Product {
  id: number
  type: 'single_pick' | 'package' | 'subscription'
  name: string
  description: string | null
  price_cents: number
  currency: string
  duration_days: number | null
  is_active: boolean
  created_at: string
}

export default function AdminProductsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    type: 'single_pick' as 'single_pick' | 'package' | 'subscription',
    name: '',
    description: '',
    price_cents: '',
    currency: 'USD',
    duration_days: '',
    is_active: true
  })

  const fetchProducts = async () => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
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
      fetchProducts()
    }
  }, [user, loading, router])

  // Redirect if not authenticated
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

  const resetForm = () => {
    setFormData({
      type: 'single_pick',
      name: '',
      description: '',
      price_cents: '',
      currency: 'USD',
      duration_days: '',
      is_active: true
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const productData = {
        type: formData.type,
        name: formData.name,
        description: formData.description || null,
        price_cents: parseInt(formData.price_cents) || 0,
        currency: formData.currency,
        duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
        is_active: formData.is_active
      }

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct)

        if (error) throw error
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert(productData)

        if (error) throw error
      }

      resetForm()
      setEditingProduct(null)
      setShowCreateForm(false)
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error guardando producto')
    }
  }

  const handleEdit = (product: Product) => {
    setFormData({
      type: product.type,
      name: product.name,
      description: product.description || '',
      price_cents: product.price_cents.toString(),
      currency: product.currency,
      duration_days: product.duration_days?.toString() || '',
      is_active: product.is_active
    })
    setEditingProduct(product.id)
    setShowCreateForm(true)
  }

  const handleToggleActive = async (productId: number, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !isActive })
        .eq('id', productId)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Error toggling product status:', error)
      alert('Error actualizando estado del producto')
    }
  }

  const handleDelete = async (productId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error eliminando producto')
    }
  }

  const ProductCard = ({ product }: { product: Product }) => {
    return (
      <Card className={`${!product.is_active ? 'opacity-60' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">
                {product.name}
              </CardTitle>
              <CardDescription className="mt-1">
                {product.description}
              </CardDescription>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <Badge variant={
                product.type === 'single_pick' ? 'default' :
                product.type === 'package' ? 'secondary' : 'outline'
              }>
                {product.type === 'single_pick' ? 'Pick Individual' :
                 product.type === 'package' ? 'Paquete' : 'Suscripción'}
              </Badge>
              
              <Badge variant={product.is_active ? 'default' : 'destructive'}>
                {product.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Precio:</span>
                <p className="text-xl font-bold">
                  {formatCurrency(product.price_cents, product.currency)}
                </p>
              </div>
              
              {product.duration_days && (
                <div>
                  <span className="text-muted-foreground">Duración:</span>
                  <p className="font-medium">{product.duration_days} días</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleEdit(product)}
              >
                <Edit size={14} className="mr-1" />
                Editar
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleToggleActive(product.id, product.is_active)}
              >
                {product.is_active ? (
                  <>
                    <EyeOff size={14} className="mr-1" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <Eye size={14} className="mr-1" />
                    Activar
                  </>
                )}
              </Button>
              
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => handleDelete(product.id)}
              >
                <Trash2 size={14} className="mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ProductForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        </CardTitle>
        <CardDescription>
          {editingProduct 
            ? 'Actualiza la información del producto'
            : 'Crea un nuevo producto para vender'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Tipo de Producto</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                type: e.target.value as any 
              }))}
              className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
              required
            >
              <option value="single_pick">Pick Individual</option>
              <option value="package">Paquete de Picks</option>
              <option value="subscription">Suscripción Mensual</option>
            </select>
          </div>

          <div>
            <Label htmlFor="name">Nombre del Producto</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                name: e.target.value 
              }))}
              placeholder="Ej: Fija Premium, Paquete Semanal"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                description: e.target.value 
              }))}
              placeholder="Describe qué incluye este producto..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_cents">Precio (USD)</Label>
              <Input
                id="price_cents"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_cents ? (parseInt(formData.price_cents) / 100).toFixed(2) : ''}
                onChange={(e) => {
                  const dollars = parseFloat(e.target.value) || 0
                  setFormData(prev => ({ 
                    ...prev, 
                    price_cents: Math.round(dollars * 100).toString()
                  }))
                }}
                placeholder="5.00"
                className="mt-1"
                required
              />
            </div>

            {formData.type === 'subscription' && (
              <div>
                <Label htmlFor="duration_days">Duración (días)</Label>
                <Input
                  id="duration_days"
                  type="number"
                  min="1"
                  value={formData.duration_days}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    duration_days: e.target.value 
                  }))}
                  placeholder="30"
                  className="mt-1"
                  required={formData.type === 'subscription'}
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                is_active: e.target.checked 
              }))}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_active">Producto activo</Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit">
              {editingProduct ? 'Actualizar' : 'Crear'} Producto
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowCreateForm(false)
                setEditingProduct(null)
                resetForm()
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Productos</h1>
          <p className="text-muted-foreground">
            Gestiona los productos disponibles para venta
          </p>
        </div>
        
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus size={16} className="mr-2" />
            Nuevo Producto
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="mb-8">
          <ProductForm />
        </div>
      )}

      {/* Products List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No hay productos</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer producto para comenzar a vender
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus size={16} className="mr-2" />
              Crear Producto
            </Button>
          </div>
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  )
}