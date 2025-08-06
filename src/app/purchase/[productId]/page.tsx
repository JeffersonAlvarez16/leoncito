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
  CreditCard,
  Clock,
  CheckCircle,
  ArrowLeft,
  Package
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
}

interface PurchaseRequest {
  product_id: number
  amount_cents: number
  payment_method: string
  user_notes: string
}

export default function PurchasePage({ 
  params 
}: { 
  params: Promise<{ productId: string }> 
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [purchaseStep, setPurchaseStep] = useState<'details' | 'payment' | 'submitted'>('details')
  const [formData, setFormData] = useState({
    payment_method: '',
    user_notes: ''
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
      return
    }

    const fetchProduct = async () => {
      try {
        setIsLoading(true)
        const resolvedParams = await params
        
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', resolvedParams.productId)
          .eq('is_active', true)
          .single()

        if (error) {
          throw error
        }

        setProduct(data)
      } catch (error) {
        console.error('Error fetching product:', error)
        router.push('/feed')
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchProduct()
    }
  }, [params, router, user, loading])

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

  const handleSubmitPurchase = async () => {
    if (!product) return

    try {
      setIsSubmitting(true)

      const purchaseData: PurchaseRequest = {
        product_id: product.id,
        amount_cents: product.price_cents,
        payment_method: formData.payment_method,
        user_notes: formData.user_notes
      }

      const { error } = await supabase
        .from('purchases')
        .insert({
          buyer_id: user.id,
          ...purchaseData,
          status: 'pending'
        })

      if (error) {
        throw error
      }

      setPurchaseStep('submitted')
    } catch (error) {
      console.error('Error submitting purchase:', error)
      alert('Error enviando solicitud de compra')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Producto no encontrado</h2>
          <p className="text-muted-foreground mb-4">
            El producto que buscas no existe o no está disponible
          </p>
          <Button onClick={() => router.push('/feed')}>
            Volver al Feed
          </Button>
        </div>
      </div>
    )
  }

  if (purchaseStep === 'submitted') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-600 dark:text-green-400 mb-4" />
            <CardTitle className="text-xl text-green-900 dark:text-green-100">
              Solicitud de Compra Enviada
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              Tu solicitud ha sido enviada exitosamente
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            <div className="space-y-4">
              <p className="text-sm">
                Hemos recibido tu solicitud para comprar <strong>{product.name}</strong>.
                Un administrador revisará tu solicitud y se contactará contigo para 
                coordinar el pago.
              </p>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Detalles de tu solicitud:</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Producto:</strong> {product.name}</p>
                  <p><strong>Precio:</strong> {formatCurrency(product.price_cents)}</p>
                  <p><strong>Método de pago preferido:</strong> {formData.payment_method || 'No especificado'}</p>
                  {formData.user_notes && (
                    <p><strong>Notas:</strong> {formData.user_notes}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={() => router.push('/feed')}>
                  Volver al Feed
                </Button>
                <Button variant="outline" onClick={() => router.push('/profile/purchases')}>
                  Ver Mis Compras
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft size={16} className="mr-2" />
          Volver
        </Button>
      </div>

      <div className="space-y-6">
        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package size={20} />
              Detalles del Producto
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{product.name}</h3>
                  {product.description && (
                    <p className="text-muted-foreground mt-1">{product.description}</p>
                  )}
                </div>
                <Badge variant={
                  product.type === 'single_pick' ? 'default' :
                  product.type === 'package' ? 'secondary' : 'outline'
                }>
                  {product.type === 'single_pick' ? 'Pick Individual' :
                   product.type === 'package' ? 'Paquete' : 'Suscripción'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-lg font-medium">Precio Total:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(product.price_cents)}
                </span>
              </div>

              {product.duration_days && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={16} />
                  <span>Duración: {product.duration_days} días</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Purchase Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Información de Compra
            </CardTitle>
            <CardDescription>
              Completa los detalles para procesar tu compra. Un administrador se contactará contigo.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="payment_method">
                  Método de Pago Preferido <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="payment_method"
                  value={formData.payment_method}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    payment_method: e.target.value
                  }))}
                  placeholder="Ej: Transferencia bancaria, PayPal, Efectivo"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Indica tu método de pago preferido. El admin te contactará para coordinar.
                </p>
              </div>

              <div>
                <Label htmlFor="user_notes">
                  Notas Adicionales <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  id="user_notes"
                  value={formData.user_notes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    user_notes: e.target.value
                  }))}
                  placeholder="Agrega cualquier información adicional..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium mb-2">¿Cómo funciona?</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>1. Envías tu solicitud de compra</li>
                  <li>2. Un administrador revisa y se contacta contigo</li>
                  <li>3. Coordinan el pago según tu método preferido</li>
                  <li>4. Una vez confirmado el pago, obtienes acceso inmediato</li>
                </ul>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleSubmitPurchase}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Enviando Solicitud...
                  </div>
                ) : (
                  <>
                    <DollarSign size={16} className="mr-2" />
                    Solicitar Compra por {formatCurrency(product.price_cents)}
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Al solicitar la compra, aceptas que un administrador se contacte contigo 
                para coordinar el pago de manera segura.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}