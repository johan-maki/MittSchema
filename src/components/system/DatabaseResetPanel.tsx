import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Database, RefreshCw, CheckCircle } from "lucide-react";
import { resetDatabaseWithSimplifiedData } from "@/utils/databaseReset";
import { useToast } from "@/components/ui/use-toast";

export const DatabaseResetPanel = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    setIsResetting(true);
    setResetComplete(false);

    try {
      const result = await resetDatabaseWithSimplifiedData();
      
      if (result.success) {
        setResetComplete(true);
        toast({
          title: "Database Reset Successful! ✅",
          description: result.message,
          duration: 5000,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Reset failed:', error);
      toast({
        title: "Reset Failed ❌",
        description: "Could not reset database. Check console for details.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2 text-red-800">
          <Database className="h-6 w-6" />
          <span>Database Reset</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">⚠️ This will:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Delete ALL existing employees</li>
                <li>Delete ALL existing shifts</li>
                <li>Insert 6 new simplified employees</li>
                <li>All employees: Sjuksköterska, Akutmottagning, 1 år</li>
              </ul>
            </div>
          </div>
        </div>

        {resetComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                Reset Complete! Refresh the page to see changes.
              </span>
            </div>
          </div>
        )}

        <Button
          onClick={handleReset}
          disabled={isResetting}
          className={`w-full ${
            isResetting 
              ? 'bg-gray-400' 
              : resetComplete 
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          } text-white`}
        >
          {isResetting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Resetting Database...
            </>
          ) : resetComplete ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Reset Complete!
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Reset Database
            </>
          )}
        </Button>

        <p className="text-xs text-gray-600 text-center">
          Perfect for preparing Gurobi integration with simplified data
        </p>
      </CardContent>
    </Card>
  );
};
