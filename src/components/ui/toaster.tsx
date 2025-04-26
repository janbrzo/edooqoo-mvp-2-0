
import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { AlertTriangle, Check, Info, X } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();
  
  const getIcon = (variant?: string) => {
    switch (variant) {
      case "success":
        return <Check className="h-4 w-4 text-green-500" />;
      case "error":
      case "destructive":
        return <X className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        ...props
      }) {
        // Determine if this is an error toast
        const isError = variant === 'destructive' || variant === 'error';
        
        return (
          <Toast 
            key={id} 
            className="bg-white shadow-lg rounded-lg group min-h-[36px] w-full px-[16px] py-[12px]"
            // Increasing the width of error toasts for better readability
            style={{ 
              maxWidth: isError ? '36rem' : '24rem',
              width: isError ? 'calc(100vw - 2rem)' : undefined
            }}
          >
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 pt-0.5">
                {getIcon(variant)}
              </div>
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle className="font-semibold text-sm text-gray-900 py-0">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-xs text-gray-600 break-words max-h-[300px] overflow-y-auto">
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
