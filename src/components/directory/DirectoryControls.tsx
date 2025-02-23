
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { AddProfileDialog } from "@/components/directory/AddProfileDialog";
import { useDirectory } from "@/contexts/DirectoryContext";

export function DirectoryControls() {
  const { departmentFilter, setDepartmentFilter, searchQuery, setSearchQuery } = useDirectory();

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Input
          placeholder="Sök personal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-[300px]"
        />
        <Select
          value={departmentFilter}
          onValueChange={setDepartmentFilter}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Alla avdelningar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla avdelningar</SelectItem>
            <SelectItem value="Emergency">Akuten</SelectItem>
            <SelectItem value="Surgery">Kirurgi</SelectItem>
            <SelectItem value="Pediatrics">Barnsjukvård</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto">
            <UserPlus className="w-4 h-4 mr-2" />
            Lägg till personal
          </Button>
        </DialogTrigger>
        <DialogContent>
          <AddProfileDialog />
        </DialogContent>
      </Dialog>
    </div>
  );
}
