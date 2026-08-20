import { redirect } from "next/navigation";
import { isConsoleAuthenticated } from "@/lib/console-auth";

export default async function ConsoleIndex() {
  redirect((await isConsoleAuthenticated()) ? "/console/overview" : "/console/login");
}
