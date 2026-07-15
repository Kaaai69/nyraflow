import type { Metadata } from "next";
import LegalDocumentPage from "../../components/legal/LegalDocumentPage";
import { termsDocument } from "../../content/legal";

export const metadata: Metadata = {
  title: "Договор-оферта — nyraflow",
  description: "Условия оказания услуг и выполнения работ Nyraflow.",
};

export default function TermsPage() {
  return <LegalDocumentPage document={termsDocument} />;
}
