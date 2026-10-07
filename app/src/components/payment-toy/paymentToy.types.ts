export type PaymentMethod =
  | "card"
  | "upi"
  | "wallet";

export type PaymentToyProps = {
  amount?: number;
  defaultMethod?: PaymentMethod;
  onPaymentComplete?: (
    method: PaymentMethod
  ) => void;
};