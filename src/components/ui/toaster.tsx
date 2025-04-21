
import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { Check, Info, X, AlertTriangle, Bell, BellOff } from "lucide-react";
import React from "react";

// Utility: choose icon based on toast.type or className
function getToastIcon(toast) {
  if (toast.className?.includes("success") || toast.variant === "success") return <Check className="text-green-600" size={20} />;
  if (toast.className?.includes("error") || toast.variant === "error") return <X className="text-red-600" size={20} />;
  if (toast.className?.includes("info") || toast.variant === "info") return <Info className="text-sky-600" size={20} />;
  if (toast.className?.includes("warn") || toast.variant === "warn" || toast.className?.includes("warning")) return <AlertTriangle className="text-yellow-500" size={20} />;
  if (toast.className?.includes("off")) return <BellOff className="text-gray-400" size={20} />;
  return <Bell className="text-purple-600" size={20} />;
}

export function Toaster() {
  const { toasts, close } = useToast();

  return <ToastProvider>
    {toasts.map(function ({
      id,
      title,
      description,
      action,
      className,
      ...props
    }) {
      // Modern/persistent, but 3s auto-dismiss unless hover
      const [hovered, setHovered] = React.useState(false);

      React.useEffect(() => {
        if (!hovered) {
          const timer = setTimeout(() => close(id), 3000);
          return () => clearTimeout(timer);
        }
      }, [hovered, id, close]);

      return (
        <Toast
          key={id}
          className={`modern-toast flex items-center px-5 py-3 mb-3 min-h-12 font-semibold text-[15px] shadow-2xl border border-gray-200 rounded-xl bg-white relative group 
            ${className || ""}`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          {...props}
        >
          <span className="mr-3 flex-shrink-0 flex items-center justify-center">{getToastIcon({ className, ...props })}</span>
          <div className="flex-1 flex flex-col justify-center">
            {title && <ToastTitle className="font-bold text-gray-900">{title}</ToastTitle>}
            {description && <ToastDescription className="text-gray-700 font-normal text-[15px]">{description}</ToastDescription>}
            {action}
          </div>
          <ToastClose className="ml-2 opacity-70 hover:opacity-100" />
        </Toast>
      );
    })}
    <ToastViewport />
  </ToastProvider>;
}
