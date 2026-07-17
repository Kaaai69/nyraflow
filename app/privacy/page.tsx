import type { Metadata } from "next";
import LegalDocumentPage from "../../components/legal/LegalDocumentPage";
import { privacyDocument } from "../../content/legal";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных — nyraflow",
  description:
    "Порядок обработки и защиты персональных данных на сайте Nyraflow.",
};

export default function PrivacyPage() {
  return <LegalDocumentPage document={privacyDocument} />;
}
