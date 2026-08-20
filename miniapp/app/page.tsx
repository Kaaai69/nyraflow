import { BriefFlow } from "@/components/brief/BriefFlow";

export const dynamic = "force-dynamic";

// Вход в мини-апп — сразу бриф, без промежуточного экрана-обещания.
export default function HomePage() {
  return <BriefFlow />;
}
