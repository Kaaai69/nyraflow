import { homeContent } from "../../content/home";

import { SectionContainer } from "./Layout";

export default function ContactSection() {
  const content = homeContent.contact;
  const [nameLabel, contactLabel, messageLabel] = content.fields;

  return (
    <section id="contact" className="py-20 md:py-28">
      <SectionContainer>
        <div className="grid gap-12 rounded-[28px] bg-surface-blue px-6 py-12 md:px-12 md:py-16 lg:grid-cols-12 lg:gap-8 lg:px-16 lg:py-20">
          <header className="lg:col-span-6 lg:pr-10">
            <h2 className="text-balance text-[clamp(2.375rem,4.7vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
              {content.title}
            </h2>
            <p className="mt-7 max-w-[55ch] text-lg leading-relaxed text-text-secondary md:text-xl">
              {content.description}
            </p>
          </header>

          <form className="rounded-[20px] border border-line bg-surface p-6 md:p-8 lg:col-span-6">
            <div>
              <label htmlFor="contact-name" className="form-label">
                {nameLabel}
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
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
                className="form-field resize-y"
              />
            </div>
            <button type="button" className="button-primary mt-7 w-full justify-center">
              {content.cta}
            </button>
          </form>
        </div>
      </SectionContainer>
    </section>
  );
}
