import { redirect } from "next/navigation";

export default function LegacyConsoleSchedulePage() {
  redirect("/console/overview");
}
