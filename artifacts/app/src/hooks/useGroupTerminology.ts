import { getGroupTerminology, type GroupTerminology } from "@/lib/groupTypeConfig";

export function useGroupTerminology(groupType?: string | null): GroupTerminology {
  return getGroupTerminology(groupType);
}
