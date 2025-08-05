import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  Clock,
  Plus,
  Edit,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  unit_price: number;
  currency: string;
  expiry_date: string;
  is_active: boolean;
  category: { name: string } | null;
}

export default function InventoryManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!supplierData) return;

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(name)
        `)
        .eq('supplier_id', supplierData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock_level);
  const expiredProducts = products.filter(p => 
    p.expiry_date && new Date(p.expiry_date) < new Date()
  );
  const expiringSoon = products.filter(p => 
    p.expiry_date && 
    new Date(p.expiry_date) > new Date() &&
    new Date(p.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (product.stock_quantity <= product.min_stock_level) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const getExpiryStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { label: 'Expired', variant: 'destructive' as const };
    if (daysUntilExpiry <= 30) return { label: `Expires in ${daysUntilExpiry} days`, variant: 'secondary' as const };
    return { label: 'Good', variant: 'default' as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <p className="text-muted-foreground">Monitor your product inventory and stock levels</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {lowStockProducts.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>{lowStockProducts.length}</strong> products have low stock levels
            </AlertDescription>
          </Alert>
        )}
        
        {expiredProducts.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>{expiredProducts.length}</strong> products have expired
            </AlertDescription>
          </Alert>
        )}
        
        {expiringSoon.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>{expiringSoon.length}</strong> products expire within 30 days
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Products ({products.length})</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock ({lowStockProducts.length})</TabsTrigger>
          <TabsTrigger value="expiring">Expiring ({expiringSoon.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredProducts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                All Products
              </CardTitle>
              <CardDescription>Complete inventory overview</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductTable products={products} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Low Stock Products
              </CardTitle>
              <CardDescription>Products that need restocking</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductTable products={lowStockProducts} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Products Expiring Soon
              </CardTitle>
              <CardDescription>Products expiring within 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductTable products={expiringSoon} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Expired Products
              </CardTitle>
              <CardDescription>Products that have expired</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductTable products={expiredProducts} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProductTable({ products }: { products: Product[] }) {
  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (product.stock_quantity <= product.min_stock_level) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const getExpiryStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { label: 'Expired', variant: 'destructive' as const };
    if (daysUntilExpiry <= 30) return { label: `Expires in ${daysUntilExpiry} days`, variant: 'secondary' as const };
    return { label: 'Good', variant: 'default' as const };
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const stockStatus = getStockStatus(product);
          const expiryStatus = product.expiry_date ? getExpiryStatus(product.expiry_date) : null;
          
          return (
            <TableRow key={product.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.category?.name}
                  </p>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">{product.sku}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">{product.stock_quantity}</p>
                  <p className="text-xs text-muted-foreground">
                    Min: {product.min_stock_level}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {product.unit_price} {product.currency}
              </TableCell>
              <TableCell>
                {product.expiry_date ? (
                  <div className="space-y-1">
                    <p className="text-sm">{new Date(product.expiry_date).toLocaleDateString()}</p>
                    {expiryStatus && (
                      <Badge variant={expiryStatus.variant} className="text-xs">
                        {expiryStatus.label}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={stockStatus.variant}>
                  {stockStatus.label}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}