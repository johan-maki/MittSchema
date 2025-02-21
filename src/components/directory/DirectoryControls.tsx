
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const DirectoryControls = () => {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between">
        <Input
          className="max-w-xs"
          placeholder="Sök personal..."
          type="search"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Filter
          </Button>
          <Button variant="outline" size="sm">
            Visa
          </Button>
        </div>
      </div>
    </div>
  );
};
