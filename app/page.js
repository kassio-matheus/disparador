import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Form from "./form";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");

  if (!token) redirect("/login");

  try {
    const user = JSON.parse(token?.value);

    if (user && user.senha) {
    } else {
      redirect("/login");
    }
  } catch {
    redirect("/login");
  }

  return <Form />;
}
