import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddProductFormProps {
  onProductAdded?: () => void;
  trigger?: React.ReactNode;
}

export default function AddProductForm({ onProductAdded, trigger }: AddProductFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    model: '',
    sku: '',
    barcode: '',
    unit_price: '',
    bulk_price: '',
    bulk_quantity: '',
    stock_quantity: '',
    min_stock_level: '',
    max_stock_level: '',
    expiry_date: '',
    manufacture_date: '',
    warranty_months: '',
    currency: 'USD',
    requires_prescription: false,
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      brand: '',
      model: '',
      sku: '',
      barcode: '',
      unit_price: '',
      bulk_price: '',
      bulk_quantity: '',
      stock_quantity: '',
      min_stock_level: '',
      max_stock_level: '',
      expiry_date: '',
      manufacture_date: '',
      warranty_months: '',
      currency: 'USD',
      requires_prescription: false,
      is_active: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.unit_price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // Get supplier ID
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!supplierData) {
        throw new Error('Supplier profile not found');
      }

      // Prepare data for insertion
      const productData = {
        supplier_id: supplierData.id,
        name: formData.name,
        description: formData.description || null,
        brand: formData.brand || null,
        model: formData.model || null,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        unit_price: parseFloat(formData.unit_price),
        bulk_price: formData.bulk_price ? parseFloat(formData.bulk_price) : null,
        bulk_quantity: formData.bulk_quantity ? parseInt(formData.bulk_quantity) : null,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0,
        min_stock_level: formData.min_stock_level ? parseInt(formData.min_stock_level) : 0,
        max_stock_level: formData.max_stock_level ? parseInt(formData.max_stock_level) : null,
        expiry_date: formData.expiry_date || null,
        manufacture_date: formData.manufacture_date || null,
        warranty_months: formData.warranty_months ? parseInt(formData.warranty_months) : null,
        currency: formData.currency,
        requires_prescription: formData.requires_prescription,
        is_active: formData.is_active
      };

      const { error } = await supabase
        .from('products')
        .insert(productData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product added successfully",
      });

      resetForm();
      setOpen(false);
      onProductAdded?.();
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add Product
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your inventory
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="Enter brand name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Enter model"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Enter SKU"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter product description"
                rows={3}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pricing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price *</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => handleInputChange('unit_price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk_price">Bulk Price</Label>
                <Input
                  id="bulk_price"
                  type="number"
                  step="0.01"
                  value={formData.bulk_price}
                  onChange={(e) => handleInputChange('bulk_price', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk_quantity">Bulk Quantity</Label>
                <Input
                  id="bulk_quantity"
                  type="number"
                  value={formData.bulk_quantity}
                  onChange={(e) => handleInputChange('bulk_quantity', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="USD">USD</option>
                <option value="IQD">IQD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* Inventory */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Inventory</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Stock Quantity</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_stock_level">Min Stock Level</Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  value={formData.min_stock_level}
                  onChange={(e) => handleInputChange('min_stock_level', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_stock_level">Max Stock Level</Label>
                <Input
                  id="max_stock_level"
                  type="number"
                  value={formData.max_stock_level}
                  onChange={(e) => handleInputChange('max_stock_level', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Dates & Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacture_date">Manufacture Date</Label>
                <Input
                  id="manufacture_date"
                  type="date"
                  value={formData.manufacture_date}
                  onChange={(e) => handleInputChange('manufacture_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warranty_months">Warranty (Months)</Label>
                <Input
                  id="warranty_months"
                  type="number"
                  value={formData.warranty_months}
                  onChange={(e) => handleInputChange('warranty_months', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  placeholder="Enter barcode"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_prescription"
                  checked={formData.requires_prescription}
                  onCheckedChange={(checked) => handleInputChange('requires_prescription', checked)}
                />
                <Label htmlFor="requires_prescription">Requires Prescription</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}