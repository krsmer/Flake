import "./globals.css";

export const metadata = {
  title: "No-Flake Booking",
  description: "Deposit-based booking MVP"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
