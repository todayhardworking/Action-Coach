"use client";

import { ChangeEvent, InputHTMLAttributes, TextareaHTMLAttributes, useId, useState } from "react";
import styles from "./md3.module.css";

interface MD3TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  required?: boolean;
  name?: string;
  type?: string;
}

export function MD3TextField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  required,
  name,
  type = "text",
}: MD3TextFieldProps) {
  const id = useId();
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.trim().length > 0;

  const sharedProps = {
    id,
    name,
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    placeholder,
    required,
    className: styles.textFieldControl,
  };

  return (
    <label className={`${styles.textField} ${hasValue || isFocused ? styles.textFieldHasValue : ""}`} htmlFor={id}>
      {multiline ? (
        <textarea rows={4} {...(sharedProps as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input {...(sharedProps as InputHTMLAttributes<HTMLInputElement>)} type={type} className={styles.textFieldControl} />
      )}
      <span className={styles.textFieldLabel}>{label}</span>
    </label>
  );
}
