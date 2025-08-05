import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreditCard, Loader2, Smartphone, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FibPaymentDialogProps {
  planId: string;
  planName: string;
  price: number;
}

export function FibPaymentDialog({ planId, planName, price }: FibPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleFibPayment = async () => {
    try {
      setIsLoading(true);

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast({
          title: "خطأ في المصادقة",
          description: "يرجى تسجيل الدخول مرة أخرى",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('fib-payment', {
        body: {
          amount: price,
          plan: planId,
          description: `اشتراك خطة ${planName}`
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        console.error('FIB Payment Error:', error);
        toast({
          title: "خطأ في الدفع",
          description: "حدث خطأ أثناء إنشاء عملية الدفع. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        setPaymentData(data);
        toast({
          title: "تم إنشاء عملية الدفع",
          description: "يرجى إكمال الدفع باستخدام تطبيق بنك العراق الأول",
        });
      } else {
        toast({
          title: "خطأ في الدفع",
          description: data?.error || "حدث خطأ غير متوقع",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('FIB Payment Error:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppLink = (link: string) => {
    window.open(link, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          <CreditCard className="h-4 w-4 ml-2" />
          الدفع ببطاقة بنك العراق الأول
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>الدفع ببطاقة بنك العراق الأول</DialogTitle>
          <DialogDescription>
            ادفع بأمان باستخدام تطبيق بنك العراق الأول
          </DialogDescription>
        </DialogHeader>

        {!paymentData ? (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">المبلغ: {price.toLocaleString()} د.ع</p>
              <p className="text-sm text-muted-foreground">خطة {planName}</p>
            </div>

            <Button 
              onClick={handleFibPayment} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري إنشاء عملية الدفع...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 ml-2" />
                  إنشاء عملية الدفع
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">عملية الدفع جاهزة</h3>
              <p className="text-sm text-muted-foreground mb-4">
                استخدم إحدى الطرق التالية لإكمال الدفع:
              </p>
            </div>

            {/* QR Code */}
            {paymentData.qrCode && (
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">امسح الكود باستخدام تطبيق FIB:</p>
                <div className="flex justify-center">
                  <img 
                    src={paymentData.qrCode} 
                    alt="QR Code" 
                    className="w-32 h-32 border rounded"
                  />
                </div>
              </div>
            )}

            {/* Readable Code */}
            {paymentData.readableCode && (
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">أو أدخل الكود يدوياً:</p>
                <div className="bg-muted p-2 rounded font-mono text-center">
                  {paymentData.readableCode}
                </div>
              </div>
            )}

            {/* App Links */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-center">أو افتح التطبيق مباشرة:</p>
              
              {paymentData.personalAppLink && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleAppLink(paymentData.personalAppLink)}
                >
                  <Smartphone className="h-4 w-4 ml-2" />
                  FIB Personal
                </Button>
              )}

              {paymentData.businessAppLink && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleAppLink(paymentData.businessAppLink)}
                >
                  <Smartphone className="h-4 w-4 ml-2" />
                  FIB Business
                </Button>
              )}

              {paymentData.corporateAppLink && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleAppLink(paymentData.corporateAppLink)}
                >
                  <Smartphone className="h-4 w-4 ml-2" />
                  FIB Corporate
                </Button>
              )}
            </div>

            {/* Expiry Info */}
            {paymentData.validUntil && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  صالح حتى: {new Date(paymentData.validUntil).toLocaleString('ar-IQ')}
                </p>
              </div>
            )}

            <div className="text-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setPaymentData(null);
                  setIsOpen(false);
                }}
              >
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}