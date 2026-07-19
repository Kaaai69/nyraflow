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
        throw new Error(`status ${response.status}`);
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage(
        "Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram.",
      );
    }
  }

  const isSubmitting = status === "submitting";

  return (
    <section id="contact" className="py-section-mobile md:py-section-contact">
      <SectionContainer>
        <div className="grid gap-12 rounded-media bg-surface-blue px-6 py-12 md:px-12 md:py-16 lg:grid-cols-12 lg:gap-8 lg:px-16 lg:py-20">
          <header className="lg:col-span-6 lg:pr-10">
            <h2 className="text-title text-balance">
              {content.title}
            </h2>
            <p className="mt-7 max-w-[55ch] text-lg leading-relaxed text-text-secondary md:text-xl">
              {content.description}
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="rounded-card border border-line bg-surface p-6 md:p-8 lg:col-span-6"
          >
            <div>
              <label htmlFor="contact-name" className="form-label">
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
              <label htmlFor="contact-channel" className="form-label">
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
              <label htmlFor="contact-message" className="form-label">
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

            {/* Honeypot: hidden from users, catches bots that fill every field. */}
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
              className="button-primary mt-7 w-full justify-center"
            >
              {isSubmitting ? "Отправляем…" : content.cta}
            </button>

            <p
              id="contact-form-status"
              aria-live="polite"
              className="mt-3 text-sm leading-relaxed"
            >
              {status === "success" ? (
                <span className="text-text-primary">
                  Заявка отправлена — свяжемся с вами в ближайшее время.
                </span>
              ) : status === "error" ? (
                <span className="text-red-600">{errorMessage}</span>
              ) : (
                <span className="text-text-secondary">
                  Обычно отвечаем в течение рабочего дня.
                </span>
              )}
            </p>

            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              Отправляя форму, вы принимаете условия{" "}
              <a href="/terms">договора-оферты</a> и подтверждаете ознакомление с{" "}
              <a href="/privacy">политикой обработки персональных данных</a>.
            </p>
          </form>
        </div>
      </SectionContainer>
    </section>
  );
}
