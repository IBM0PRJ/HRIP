import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default function RootPage() {
  const cookieStore = cookies();
  
  if (cookieStore.has("analyst_session")) {
    redirect("/analyst");
  }
  
  if (cookieStore.has("emp_session")) {
    redirect("/dashboard");
  }
  
  redirect("/login");
}
