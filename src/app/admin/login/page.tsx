import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/require-admin";
import LoginForm from "./LoginForm";
import styles from "./login.module.scss";

export default async function AdminLoginPage() {
  const admin = await getAdminSession();

  if (admin) {
    redirect("/admin");
  }

  return (
    <main className={styles.page} dir="rtl" lang="he">
      <LoginForm />
    </main>
  );
}
