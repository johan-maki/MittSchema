import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { healthService, HealthStatus } from "@/services/healthService";

export const SystemStatus = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const status = await healthService.checkSchedulerHealth();
      setHealth(status);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Failed to check health:', error);
      setHealth({
        isHealthy: false,
        database: false,
        api: false,
        message: 'Failed to check system status',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (isHealthy: boolean) => {
    if (isHealthy) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (isHealthy: boolean) => {
    return (
      <Badge variant={isHealthy ? "default" : "destructive"}>
        {isHealthy ? "Healthy" : "Unhealthy"}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Status</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkHealth}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !health ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            <span className="text-sm">Checking system status...</span>
          </div>
        ) : health ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Status</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(health.isHealthy)}
                {getStatusBadge(health.isHealthy)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Scheduler API</span>
                {getStatusIcon(health.api)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                {getStatusIcon(health.database)}
              </div>
            </div>
            
            {health.version && (
              <div className="text-xs text-gray-500">
                Version: {health.version}
              </div>
            )}
            
            {health.message && !health.isHealthy && (
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                <span className="text-xs text-gray-600">{health.message}</span>
              </div>
            )}
            
            {lastChecked && (
              <div className="text-xs text-gray-500">
                Last checked: {lastChecked.toLocaleTimeString()}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">Unable to check status</div>
        )}
      </CardContent>
    </Card>
  );
};
