import "./globals.css";

export const metadata = {
  title: "Family Florist - Driver Management",
  description: "Delivery driver management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}