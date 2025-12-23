import { WifiOff, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ConnectionErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  variant?: "connection" | "config";
}

export const ConnectionError = ({
  title = "Connection Error",
  message = "Unable to connect to the server. Please check your internet connection and try again.",
  onRetry,
  showRetry = true,
  variant = "connection",
}: ConnectionErrorProps) => {
  const Icon = variant === "config" ? AlertTriangle : WifiOff;
  const iconBgColor = variant === "config" ? "bg-warning/10" : "bg-destructive/10";
  const iconColor = variant === "config" ? "text-warning" : "text-destructive";

  return (
    <Card className="p-8 text-center border-destructive/20">
      <div className="flex flex-col items-center gap-4">
        <div className={`w-14 h-14 rounded-full ${iconBgColor} flex items-center justify-center`}>
          <Icon className={`h-7 w-7 ${iconColor}`} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-muted-foreground text-sm max-w-md">{message}</p>
        </div>
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    </Card>
  );
};
