"use client";

import PaymentToyCanvas from "./PaymentToyCanvas";

export type PaymentMethod = "card" | "upi" | "wallet";

export type PaymentToyProps = {
  amount?: number;
  defaultMethod?: PaymentMethod;
  onPaymentComplete?: (method: PaymentMethod) => void;
};

export default function PaymentToy({
  amount = 499,
  defaultMethod = "card",
  onPaymentComplete,
}: PaymentToyProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <PaymentToyCanvas />
    </div>
  );
}