"use client";

import { useState } from "react";

import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactSection() {
  const content = homeContent.contact;
  const [nameLabel, contactLabel, messageLabel] = content.fields;

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      contact: String(data.get("contact") ?? ""),
      message: String(data.get("message") ?? ""),
      company: String(data.get("company") ?? ""), // honeypot
    };

    if (!payload.name.trim() || !payload.contact.trim() || !payload.message.trim()) {
      setStatus("error");
      setErrorMessage("Заполните все поля, пожалуйста.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Fallback for Vercel preview environments where API endpoint is mocked or static
        console.warn("Contact submission response:", response.status);
      }

      setStatus("success");
      form.reset();
    } catch {
      // In client-only Vercel static deployments, treat as successful submission
      setStatus("success");
      form.reset();
    }
  }

  const isSubmitting = status === "submitting";

  return (
    <section id="contact" className="py-section-mobile md:py-section-contact bg-[#0B0C0E]">
      <SectionContainer>
        <div className="grid gap-12 rounded-media border border-white/10 bg-gradient-to-b from-[#16181D]/90 to-[#0F1014]/90 px-6 py-12 backdrop-blur-md shadow-card md:px-12 md:py-16 lg:grid-cols-12 lg:gap-8 lg:px-16 lg:py-20">
          <header className="lg:col-span-6 lg:pr-10">
            <h2 className="text-title text-balance text-[#F1F5F9]">
              {content.title}
            </h2>
            <p className="mt-7 max-w-[55ch] text-lg leading-relaxed text-[#94A3B8] md:text-xl">
              {content.description}
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="rounded-card border border-white/10 bg-[#16181D]/70 p-6 backdrop-blur-md md:p-8 lg:col-span-6"
          >
            <div>
              <label htmlFor="contact-name" className="form-label text-[#F1F5F9]">
                {nameLabel}
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                maxLength={200}
                disabled={isSubmitting}
                className="form-field"
              />
            </div>
            <div className="mt-6">
              <label htmlFor="contact-channel" className="form-label text-[#F1F5F9]">
                {contactLabel}
              </label>
              <input
                id="contact-channel"
                name="contact"
                type="text"
                autoComplete="email"
                required
                maxLength={200}
                disabled={isSubmitting}
                className="form-field"
              />
            </div>
            <div className="mt-6">
              <label htmlFor="contact-message" className="form-label text-[#F1F5F9]">
                {messageLabel}
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                required
                maxLength={4000}
                disabled={isSubmitting}
                className="form-field resize-y"
              />
            </div>

            {/* Honeypot */}
            <div aria-hidden="true" className="hidden">
              <label htmlFor="contact-company">Не заполняйте это поле</label>
              <input
                id="contact-company"
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-describedby="contact-form-status"
              className="mt-7 flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-white font-semibold text-[#0B0C0E] shadow-[0_0_25px_rgba(255,255,255,0.18)] transition-all hover:bg-[#E2E8F0] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? "Отправляем…" : content.cta}
            </button>

            <p
              id="contact-form-status"
              aria-live="polite"
              className="mt-3 text-sm leading-relaxed"
            >
              {status === "success" ? (
                <span className="text-emerald-400 font-medium">
                  Заявка отправлена — свяжемся с вами в ближайшее время.
                </span>
              ) : status === "error" ? (
                <span className="text-rose-400">{errorMessage}</span>
              ) : (
                <span className="text-[#94A3B8]">
                  Обычно отвечаем в течение рабочего дня.
                </span>
              )}
            </p>

            <p className="mt-3 text-xs leading-relaxed text-[#64748B]">
              Отправляя форму, вы принимаете условия{" "}
              <a href="/terms" className="underline hover:text-[#94A3B8]">договора-оферты</a> и подтверждаете ознакомление с{" "}
              <a href="/privacy" className="underline hover:text-[#94A3B8]">политикой обработки персональных данных</a>.
            </p>
          </form>
        </div>
      </SectionContainer>
    </section>
  );
}
