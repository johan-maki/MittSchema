
import { ShiftType, Shift } from "@/types/shift";

export type Role = {
  name: string;
  color: string;
  bgColor: string;
  department: string;
  shiftType: ShiftType;
};

export const ROLES: Role[] = [
  { 
    name: "Day shift", 
    color: "#6B7280", 
    bgColor: "#F3F4F6",
    department: "Vården",
    shiftType: "day"
  },
  { 
    name: "Evening shift", 
    color: "#DC2626", 
    bgColor: "#FEE2E2",
    department: "Vården",
    shiftType: "evening"
  },
  { 
    name: "Night shift", 
    color: "#7C3AED", 
    bgColor: "#EDE9FE",
    department: "Vården",
    shiftType: "night"
  }
];

export interface OverlappingShifts {
  shift: Shift;
  overlap: number;
  position: number;
}
