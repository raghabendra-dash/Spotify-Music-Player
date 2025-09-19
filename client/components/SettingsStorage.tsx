import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { HardDrive, Trash2 } from "lucide-react";

export default function SettingsStorage() {
  const [cacheSize, setCacheSize] = useState("Calculating...");

  const calculateCacheSize = () => {
    const mockSize = (Math.random() * (250 - 50) + 50).toFixed(2);
    setCacheSize(`${mockSize} MB`);
  };

  useEffect(() => {
    calculateCacheSize();
  }, []);

  const handleClearCache = () => {
    // This is a simulation. A real implementation would clear specific
    // local storage keys, clear an IndexedDB database, etc.
    toast.info("Clearing cache...");
    setTimeout(() => {
      try {
        // Example: localStorage.removeItem('some_cache_key');
        setCacheSize("0.00 MB");
        toast.success("Cache cleared successfully!");
      } catch (err) {
        console.error("Failed to clear cache:", err);
        toast.error("Failed to clear cache.");
      }
    }, 1500);
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-3 text-white">
        Storage Management
      </h3>
      <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-white flex items-center">
              <HardDrive className="w-4 h-4 mr-2" />
              Cache Size
            </h4>
            <p className="text-sm text-gray-400 mt-1">
              This is the amount of space used for temporary song data and
              images.
            </p>
          </div>
          <p className="text-lg font-semibold text-green-400">{cacheSize}</p>
        </div>

        <Button
          variant="outline"
          onClick={handleClearCache}
          className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full justify-center"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Cache
        </Button>
      </div>
    </div>
  );
}
