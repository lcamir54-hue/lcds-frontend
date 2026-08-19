import { redirect } from "next/navigation";

/** Home remains `/knowledge`; root always forwards there when authenticated. */
export default function HomePage() {
  redirect("/knowledge");
}
