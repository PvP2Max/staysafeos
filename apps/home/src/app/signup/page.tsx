import { redirect } from "next/navigation";

export default function SignupPage() {
  // Redirect to login - org creation happens from dashboard
  redirect("/login");
}
