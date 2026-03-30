import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vazant Consulting — Client Portal",
  description: "Securely manage your tax documents, track your return, and message Antonio.",
};

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      <style>{`
        .portal-root { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important; }
        .portal-root * { font-family: inherit; }
        .portal-root input, .portal-root button { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
      `}</style>
      <div className="portal-root">
        {children}
      </div>
    </>
  );
}
