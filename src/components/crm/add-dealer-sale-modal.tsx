"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Receipt, CreditCard } from "lucide-react"
import { dealerSalesAPI } from "@/lib/supabase/dealer-sales"
import { supabase } from "@/lib/supabase/client"

interface AddDealerSaleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dealerId: string
  onSuccess: () => void
}

export function AddDealerSaleModal({ open, onOpenChange, dealerId, onSuccess }: AddDealerSaleModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [formData, setFormData] = useState({
    transaction_type: 'invoice' as 'invoice' | 'credit_memo',
    transaction_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    product_id: '',
    product_name: '',
    product_code: '',
    quantity: '',
    unit_price: '',
    amount: '',
    discount_amount: '',
    tax_amount: '',
    payment_status: 'pending',
    payment_date: '',
    due_date: '',
    notes: '',
  })

  useEffect(() => {
    if (open) {
      loadProducts()
      generateReferenceNumber()
    }
  }, [open])

  // Auto-calculate amount when quantity or price changes
  useEffect(() => {
    if (formData.quantity && formData.unit_price) {
      const qty = parseFloat(formData.quantity)
      const price = parseFloat(formData.unit_price)
      if (!isNaN(qty) && !isNaN(price)) {
        setFormData(prev => ({
          ...prev,
          amount: (qty * price).toFixed(2)
        }))
      }
    }
  }, [formData.quantity, formData.unit_price])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, product_name, product_code')
        .eq('is_active', true)
        .order('product_name')

      if (error) throw error
      setProducts(data || [])
    } catch (err: any) {
      console.error('Error loading products:', err)
    }
  }

  const generateReferenceNumber = () => {
    const prefix = formData.transaction_type === 'invoice' ? 'INV' : 'CM'
    const timestamp = Date.now().toString().slice(-8)
    setFormData(prev => ({
      ...prev,
      reference_number: `${prefix}-${timestamp}`
    }))
  }

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setFormData(prev => ({
        ...prev,
        product_id: productId,
        product_name: product.product_name,
        product_code: product.product_code || '',
      }))
    }
  }

  const handleTypeChange = (type: 'invoice' | 'credit_memo') => {
    setFormData(prev => ({
      ...prev,
      transaction_type: type
    }))
    generateReferenceNumber()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validation
      if (!formData.reference_number) throw new Error('Reference number is required')
      if (!formData.product_name) throw new Error('Product is required')
      if (!formData.quantity || parseFloat(formData.quantity) <= 0) throw new Error('Valid quantity is required')
      if (!formData.unit_price || parseFloat(formData.unit_price) < 0) throw new Error('Valid unit price is required')

      // Prepare data
      const saleData: any = {
        dealer_id: dealerId,
        product_id: formData.product_id || undefined,
        transaction_type: formData.transaction_type,
        transaction_date: formData.transaction_date,
        reference_number: formData.reference_number,
        product_name: formData.product_name,
        product_code: formData.product_code || undefined,
        quantity: parseFloat(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
        amount: parseFloat(formData.amount),
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : 0,
        tax_amount: formData.tax_amount ? parseFloat(formData.tax_amount) : 0,
        payment_status: formData.payment_status,
        payment_date: formData.payment_date || undefined,
        due_date: formData.due_date || undefined,
        notes: formData.notes || undefined,
      }

      const { error: createError } = await dealerSalesAPI.create(saleData)
      if (createError) throw new Error(createError.message)

      // Success
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (err: any) {
      setError(err.message || 'Failed to create sale')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      transaction_type: 'invoice',
      transaction_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      product_id: '',
      product_name: '',
      product_code: '',
      quantity: '',
      unit_price: '',
      amount: '',
      discount_amount: '',
      tax_amount: '',
      payment_status: 'pending',
      payment_date: '',
      due_date: '',
      notes: '',
    })
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Add Sale Transaction
          </DialogTitle>
          <DialogDescription>
            Create a new invoice or credit memo for this dealer
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 p-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Transaction Type */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleTypeChange('invoice')}
                className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                  formData.transaction_type === 'invoice'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Receipt className={`h-6 w-6 ${formData.transaction_type === 'invoice' ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-semibold">Invoice</div>
                  <div className="text-xs text-muted-foreground">Regular Sale</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('credit_memo')}
                className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                  formData.transaction_type === 'credit_memo'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className={`h-6 w-6 ${formData.transaction_type === 'credit_memo' ? 'text-red-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-semibold">Credit Memo</div>
                  <div className="text-xs text-muted-foreground">Return/Adjustment</div>
                </div>
              </button>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction_date">
                Transaction Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_number">
                Reference Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="INV-12345"
                required
              />
            </div>
          </div>

          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="product">
              Product <span className="text-red-500">*</span>
            </Label>
            <Select
              id="product"
              value={formData.product_id}
              onChange={(e) => handleProductChange(e.target.value)}
              required
            >
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.product_name} {product.product_code && `(${product.product_code})`}
                </option>
              ))}
            </Select>
            {formData.product_id === '' && (
              <p className="text-xs text-muted-foreground">
                Or enter product name manually below if not in list
              </p>
            )}
          </div>

          {/* Manual Product Entry (if no product selected) */}
          {!formData.product_id && (
            <div className="space-y-2">
              <Label htmlFor="product_name">
                Product Name (Manual Entry) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                placeholder="Enter product name"
                required
              />
            </div>
          )}

          {/* Quantity and Price */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="100"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_price">
                Unit Price (PKR) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                placeholder="500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount (PKR) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Auto-calculated"
                required
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          {/* Discount and Tax */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount_amount">Discount (PKR)</Label>
              <Input
                id="discount_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_amount">Tax (PKR)</Label>
              <Input
                id="tax_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.tax_amount}
                onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select
                id="payment_status"
                value={formData.payment_status}
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or comments..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Receipt className="mr-2 h-4 w-4" />
                  Create {formData.transaction_type === 'invoice' ? 'Invoice' : 'Credit Memo'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
