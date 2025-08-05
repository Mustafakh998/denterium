import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Eye, Package, DollarSign, Calendar, AlertTriangle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  brand: string;
  model: string;
  sku: string;
  unit_price: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  currency: string;
  is_active: boolean;
  expiry_date: string;
  manufacture_date: string;
  warranty_months: number;
  specifications: any;
  images: string[];
  created_at: string;
  updated_at: string;
  category?: { name: string };
}

interface ProductDetailsProps {
  product: Product;
  trigger?: React.ReactNode;
}

export default function ProductDetails({ product, trigger }: ProductDetailsProps) {
  const [open, setOpen] = useState(false);

  const getStockStatus = () => {
    if (product.stock_quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const, color: 'text-red-600' };
    if (product.stock_quantity <= product.min_stock_level) return { label: 'Low Stock', variant: 'secondary' as const, color: 'text-orange-600' };
    return { label: 'In Stock', variant: 'default' as const, color: 'text-green-600' };
  };

  const getExpiryStatus = () => {
    if (!product.expiry_date) return null;
    
    const expiry = new Date(product.expiry_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { label: 'Expired', variant: 'destructive' as const, color: 'text-red-600' };
    if (daysUntilExpiry <= 30) return { label: `Expires in ${daysUntilExpiry} days`, variant: 'secondary' as const, color: 'text-orange-600' };
    return { label: 'Good', variant: 'default' as const, color: 'text-green-600' };
  };

  const stockStatus = getStockStatus();
  const expiryStatus = getExpiryStatus();

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <Eye className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </DialogTitle>
          <DialogDescription>
            Complete information about {product.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{product.name}</h2>
              {product.brand && (
                <p className="text-muted-foreground">{product.brand}</p>
              )}
              {product.category && (
                <Badge variant="outline" className="mt-1">
                  {product.category.name}
                </Badge>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold flex items-center gap-1">
                <DollarSign className="h-5 w-5" />
                {product.unit_price} {product.currency}
              </div>
              <Badge variant={product.is_active ? "default" : "secondary"}>
                {product.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Stock Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant={stockStatus.variant} className="w-fit">
                    {stockStatus.label}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    <p>Current: {product.stock_quantity}</p>
                    <p>Min Level: {product.min_stock_level}</p>
                    {product.max_stock_level && (
                      <p>Max Level: {product.max_stock_level}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {product.expiry_date && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Expiry Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expiryStatus && (
                      <Badge variant={expiryStatus.variant} className="w-fit">
                        {expiryStatus.label}
                      </Badge>
                    )}
                    <div className="text-sm text-muted-foreground">
                      <p>Expires: {new Date(product.expiry_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Product Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  {product.sku && <p><strong>SKU:</strong> {product.sku}</p>}
                  {product.model && <p><strong>Model:</strong> {product.model}</p>}
                  {product.warranty_months && (
                    <p><strong>Warranty:</strong> {product.warranty_months} months</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium">{key}:</span>
                      <span className="text-muted-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dates & History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{new Date(product.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>{new Date(product.updated_at).toLocaleDateString()}</span>
                </div>
                {product.manufacture_date && (
                  <div className="flex justify-between">
                    <span>Manufactured:</span>
                    <span>{new Date(product.manufacture_date).toLocaleDateString()}</span>
                  </div>
                )}
                {product.expiry_date && (
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span>{new Date(product.expiry_date).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {product.stock_quantity <= product.min_stock_level && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Low stock level</span>
                  </div>
                )}
                
                {expiryStatus && expiryStatus.variant !== 'default' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">
                      {expiryStatus.variant === 'destructive' ? 'Product expired' : 'Expiring soon'}
                    </span>
                  </div>
                )}

                {!product.is_active && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Product inactive</span>
                  </div>
                )}

                {product.stock_quantity <= product.min_stock_level || 
                 (expiryStatus && expiryStatus.variant !== 'default') || 
                 !product.is_active ? null : (
                  <p className="text-sm text-muted-foreground">No alerts</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Images */}
          {product.images && product.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {product.images.map((image, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <img 
                        src={image} 
                        alt={`${product.name} ${index + 1}`}
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}