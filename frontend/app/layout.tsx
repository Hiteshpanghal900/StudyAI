import "./globals.css";

export const metadata = {
  title: "AI Document Intelligence",
  description: "An AI-powered document intelligence application built with Streamlit.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}