import { DatabaseEntry } from "../types/DatabaseTypes";
import { SecurityTab as ModularSecurityTab } from "./security/SecurityTab";

// Define props interface to match GeneralTab pattern
interface SecurityTabProps {
  selectedDatabase: DatabaseEntry;
}

export function SecurityTab({ selectedDatabase }: SecurityTabProps) {
  return <ModularSecurityTab selectedDatabase={selectedDatabase} />;
}
