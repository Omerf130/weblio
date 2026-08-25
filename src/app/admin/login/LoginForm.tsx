"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/lib/auth/actions";
import styles from "./login.module.scss";

const initialState: LoginActionState = {};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <div className={styles.card}>
      <div className={styles.logo}>
        <span className={styles.logoMark} aria-hidden />
        <span className={styles.logoText}>
          <em>web</em>lio
        </span>
      </div>

      <h1 className={styles.title}>כניסה לפאנל הניהול</h1>
      <p className={styles.subtitle}>הזינו את פרטי ההתחברות שלכם</p>

      <form className={styles.form} action={formAction}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            אימייל
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={styles.input}
            disabled={isPending}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            סיסמה
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className={styles.input}
            disabled={isPending}
            required
          />
        </div>

        {state.error ? (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        ) : null}

        <button type="submit" className={styles.button} disabled={isPending}>
          {isPending ? "מתחבר..." : "התחברות"}
        </button>
      </form>
    </div>
  );
}
