"use client";

import { useState } from "react";

import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";
import { MotionHeading } from "../ScrollRevealSection";

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
    <section id="contact" className="py-section-mobile md:py-section-desktop bg-transparent text-white">
      <SectionContainer>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-12 items-start">
          {/* Left Column: Large Open Offer & Info */}
          <header className="lg:col-span-5 lg:pr-6">
            <MotionHeading>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-white/50">
                Начать сотрудничество
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl leading-tight">
                {content.title}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-white/70">
                {content.description}
              </p>
            </MotionHeading>

            <div className="mt-10 p-6 rounded-[16px] border border-white/14 bg-[#0E0F12]/90 backdrop-blur-md shadow-xl">
              <p className="text-sm font-bold text-white uppercase tracking-wider">
                Быстрый ответ
              </p>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                Обсудим задачу, рассчитаем примерный бюджет и подготовим план реализации в течение рабочего дня.
              </p>
            </div>
          </header>

          {/* Right Column: Destination Inverted Warm Light Object (#F0EFEA) */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="rounded-[22px] border border-[#101114]/20 bg-[#F0EFEA] text-[#101114] p-8 md:p-12 shadow-2xl"
            >
              <div>
                <label htmlFor="contact-name" className="block text-sm font-semibold text-[#101114] mb-2">
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
                  className="w-full rounded-xl border border-[#101114]/20 bg-white px-4 py-3.5 text-[#101114] placeholder-[#101114]/40 focus:border-[#101114] focus:outline-none focus:ring-1 focus:ring-[#101114]/30 transition-all text-base shadow-sm"
                />
              </div>
              <div className="mt-6">
                <label htmlFor="contact-channel" className="block text-sm font-semibold text-[#101114] mb-2">
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
                  className="w-full rounded-xl border border-[#101114]/20 bg-white px-4 py-3.5 text-[#101114] placeholder-[#101114]/40 focus:border-[#101114] focus:outline-none focus:ring-1 focus:ring-[#101114]/30 transition-all text-base shadow-sm"
                />
              </div>
              <div className="mt-6">
                <label htmlFor="contact-message" className="block text-sm font-semibold text-[#101114] mb-2">
                  {messageLabel}
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  required
                  maxLength={4000}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-[#101114]/20 bg-white px-4 py-3.5 text-[#101114] placeholder-[#101114]/40 focus:border-[#101114] focus:outline-none focus:ring-1 focus:ring-[#101114]/30 transition-all text-base resize-y shadow-sm"
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
                className="mt-8 flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-[#101114] font-semibold text-white shadow-xl transition-all hover:bg-black hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Отправляем…" : content.cta}
              </button>

              <p
                id="contact-form-status"
                aria-live="polite"
                className="mt-4 text-sm leading-relaxed"
              >
                {status === "success" ? (
                  <span className="text-[#101114] font-semibold">
                    Заявка отправлена — свяжемся с вами в ближайшее время.
                  </span>
                ) : status === "error" ? (
                  <span className="font-semibold text-[#D93838]">{errorMessage}</span>
                ) : (
                  <span className="text-[#101114]/65">
                    Обычно отвечаем в течение рабочего дня.
                  </span>
                )}
              </p>

              <p className="mt-4 text-xs leading-relaxed text-[#101114]/55">
                Отправляя форму, вы принимаете условия{" "}
                <a href="/terms" className="underline hover:text-[#101114]">договора-оферты</a> и подтверждаете ознакомление с{" "}
                <a href="/privacy" className="underline hover:text-[#101114]">политикой обработки персональных данных</a>.
              </p>
            </form>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
