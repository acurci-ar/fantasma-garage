"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Input de contraseña con botón para mostrar/ocultar el texto ingresado.
 * Drop-in en lugar de `<input type="password" className={inputClasses} />`:
 * agrega padding a la derecha para el botón del ojo, todo lo demás
 * (className, id, name, required, minLength, autoComplete...) se reenvía
 * igual que un input nativo.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input ref={ref} type={visible ? "text" : "password"} className={cn(className, "pr-11")} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-foreground/40 transition-colors duration-220 hover:text-foreground/70"
      >
        {visible ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.88 5.09A9.77 9.77 0 0112 5c5 0 9 4 10 7-.42 1.3-1.35 2.9-2.68 4.24M6.53 6.53C4.6 7.86 3.14 9.68 2 12c1 3 5 7 10 7 1.35 0 2.61-.28 3.74-.76M10.58 10.58a2 2 0 002.83 2.83"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
});
