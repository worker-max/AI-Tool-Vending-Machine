import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConsoleWelcome } from "@/components/ConsoleWelcome";
import { brand } from "@/lib/brand.config";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        className="topbar"
        style={{ maxWidth: 1280, margin: "0 auto", padding: "10px 32px", width: "100%" }}
      >
        <div>
          <span className="dot"></span> SYSTEM ONLINE — V1.0
        </div>
        <div>{brand.unitNumber} · DISPENSE INTELLIGENCE</div>
        <div>
          {new Date().toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          }).replace(/\//g, " — ")}
        </div>
      </div>
      <Header />
      <main style={{ flex: 1, maxWidth: 1280, margin: "0 auto", padding: "48px 32px", width: "100%" }}>
        {children}
      </main>
      <Footer />
      {brand.features.consoleWelcome && <ConsoleWelcome />}
    </div>
  );
}
