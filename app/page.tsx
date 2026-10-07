import PaymentToy from "./src/components/payment-toy/PaymentToy";

export default function Home() {
  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <PaymentToy />
    </main>
  );
}