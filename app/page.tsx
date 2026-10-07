import "./globals.css";

import PaymentToy from "./src/components/payment-toy/PaymentToy";

export default function Home() {
  return (
    <main
      style={{
        width: "100%",
        minHeight: "100vh",
      }}
    >
      <PaymentToy />
    </main>
  );
}