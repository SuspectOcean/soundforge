import { type FormEvent } from "react";

export async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const data = Object.fromEntries(formData);
  const res = await fetch("/api/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}
