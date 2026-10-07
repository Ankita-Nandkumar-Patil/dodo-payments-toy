"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useState,
} from "react";

import PaymentToyCanvas from "./PaymentToyCanvas";

import {
  initialPaymentState,
  paymentReducer,
} from "./paymentToy.reducer";

import type {
  PaymentMethod,
  PaymentToyProps,
} from "./paymentToy.types";

const methods: PaymentMethod[] = [
  "card",
  "upi",
  "wallet",
];

const methodLabels: Record<PaymentMethod, string> = {
  card: "Card",
  upi: "UPI",
  wallet: "Wallet",
};

const stateCopy = {
  idle: {
    title: "Hold to pay",
    subtitle: "Release to cancel",
  },
  charging: {
    title: "Processing payment",
    subtitle: "Keep holding...",
  },
  cancelled: {
    title: "Payment cancelled",
    subtitle: "Hold again to retry",
  },
  success: {
    title: "Payment complete",
    subtitle: "Your payment was successful",
  },
  failed: {
    title: "Payment failed",
    subtitle: "Try again or use another method",
  },
} as const;

export default function PaymentToy({
  amount = 499,
  defaultMethod = "card",
  onPaymentComplete,
}: PaymentToyProps) {
  const [paymentState, dispatch] = useReducer(
    paymentReducer,
    initialPaymentState
  );

  const [method, setMethod] =
    useState<PaymentMethod>(defaultMethod);

  const [simulateFailure, setSimulateFailure] =
    useState(false);

  const handleChargeStart = useCallback(() => {
    dispatch({
      type: "START_CHARGE",
    });
  }, []);

  const handleChargeCancel = useCallback(() => {
    dispatch({
      type: "CANCEL",
    });
  }, []);

  const handleChargeComplete = useCallback(() => {
    dispatch({
      type: simulateFailure ? "FAIL" : "COMPLETE",
    });
  }, [simulateFailure]);

  useEffect(() => {
    if (paymentState.status === "cancelled") {
      const timeout = window.setTimeout(() => {
        dispatch({ type: "RESET" });
      }, 900);

      return () => window.clearTimeout(timeout);
    }

    if (paymentState.status === "success") {
      onPaymentComplete?.(method);

      const timeout = window.setTimeout(() => {
        dispatch({ type: "RESET" });
      }, 1800);

      return () => window.clearTimeout(timeout);
    }

    if (paymentState.status === "failed") {
      const timeout = window.setTimeout(() => {
        dispatch({ type: "RESET" });
      }, 1600);

      return () => window.clearTimeout(timeout);
    }
  }, [
    paymentState.status,
    method,
    onPaymentComplete,
  ]);

  const canChangeMethod =
    paymentState.status === "idle";

  const currentCopy =
    stateCopy[paymentState.status];

  return (
    <div className="payment-toy">
      <header className="checkout-header">
        <div className="checkout-header__brand">
          DODO
        </div>

        <div className="checkout-header__secure">
          <span className="checkout-header__check">
            ✓
          </span>
          Secure checkout
        </div>
      </header>

      <main className="checkout">
        <section className="checkout__payment">
          <div className="checkout__heading">
            <div>
              <span className="checkout__eyebrow">
                Payment
              </span>

              <h1>Complete your payment</h1>

              <p>
                Choose how you'd like to pay.
              </p>
            </div>

            <strong className="checkout__mobile-amount">
              ₹{amount}
            </strong>
          </div>

          <div
            className="payment-methods"
            role="tablist"
            aria-label="Payment method"
          >
            {methods.map((paymentMethod) => {
              const active =
                paymentMethod === method;

              return (
                <button
                  key={paymentMethod}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  disabled={!canChangeMethod}
                  className={`payment-method ${
                    active ? "is-active" : ""
                  }`}
                  onClick={() =>
                    setMethod(paymentMethod)
                  }
                >
                  <span className="payment-method__icon">
                    {paymentMethod === "card" && "▣"}
                    {paymentMethod === "upi" && "⌁"}
                    {paymentMethod === "wallet" && "▱"}
                  </span>

                  {methodLabels[paymentMethod]}
                </button>
              );
            })}
          </div>

          <div
            className={`payment-stage payment-stage--${paymentState.status}`}
          >
            <PaymentToyCanvas
              method={method}
              status={paymentState.status}
              onChargeStart={handleChargeStart}
              onChargeCancel={handleChargeCancel}
              onChargeComplete={handleChargeComplete}
            />

            <div className="payment-stage__overlay">
              <span className="payment-stage__method">
                {method === "card" && "CARD PAYMENT"}
                {method === "upi" && "UPI PAYMENT"}
                {method === "wallet" && "WALLET PAYMENT"}
              </span>

              <strong className="payment-stage__amount">
                ₹{amount}
              </strong>

              <span className="payment-stage__status">
                {currentCopy.title}
              </span>

              <span className="payment-stage__subtitle">
                {currentCopy.subtitle}
              </span>
            </div>

            <div className="payment-stage__progress">
              <span
                className={
                  paymentState.status === "charging"
                    ? "is-running"
                    : ""
                }
              />
            </div>
          </div>

          <div className="payment-details">
            {method === "card" && (
              <>
                <div className="payment-details__field payment-details__field--full">
                  <label>Card number</label>

                  <div className="payment-details__input">
                    <span>
                      •••• •••• •••• 4242
                    </span>

                    <span className="payment-details__brand">
                      VISA
                    </span>
                  </div>
                </div>

                <div className="payment-details__row">
                  <div className="payment-details__field">
                    <label>Expiry date</label>

                    <div className="payment-details__input">
                      12 / 28
                    </div>
                  </div>

                  <div className="payment-details__field">
                    <label>Security code</label>

                    <div className="payment-details__input">
                      •••
                    </div>
                  </div>
                </div>
              </>
            )}

            {method === "upi" && (
              <div className="payment-details__field payment-details__field--full">
                <label>UPI ID</label>

                <div className="payment-details__input">
                  ankita@upi
                </div>
              </div>
            )}

            {method === "wallet" && (
              <div className="wallet-options">
                <div className="wallet-option is-selected">
                  <span>◉</span>
                  Preferred wallet
                </div>

                <div className="wallet-option">
                  <span>+</span>
                  Add another wallet
                </div>
              </div>
            )}
          </div>

          <div className="payment-instruction">
            <div>
              <strong>{currentCopy.title}</strong>

              <span>{currentCopy.subtitle}</span>
            </div>

            <strong className="payment-instruction__amount">
              ₹{amount}
            </strong>
          </div>

          <button
            type="button"
            disabled={!canChangeMethod}
            className={`failure-toggle ${
              simulateFailure ? "is-active" : ""
            }`}
            onClick={() =>
              setSimulateFailure((value) => !value)
            }
          >
            <span className="failure-toggle__dot" />

            {simulateFailure
              ? "Failure simulation on"
              : "Demo failure state"}
          </button>
        </section>

        <aside className="checkout__summary">
          <div className="summary__header">
            <span className="checkout__eyebrow">
              Your order
            </span>

            <span className="summary__secure">
              Secure
            </span>
          </div>

          <div className="summary__product">
            <div className="summary__product-icon">
              D
            </div>

            <div>
              <strong>Pro Plan</strong>
              <span>One-time purchase</span>
            </div>
          </div>

          <div className="summary__divider" />

          <div className="summary__line">
            <span>Subtotal</span>
            <span>₹{amount}</span>
          </div>

          <div className="summary__line">
            <span>Tax</span>
            <span>₹0</span>
          </div>

          <div className="summary__divider" />

          <div className="summary__total">
            <span>Total</span>
            <strong>₹{amount}</strong>
          </div>

          <div className="summary__footer">
            <span className="summary__check">
              ✓
            </span>

            <span>
              Secure payment powered by Dodo Payments
            </span>
          </div>
        </aside>
      </main>

      <footer className="checkout-footer">
        <span>Payments secured by Dodo</span>
        <span>Privacy</span>
        <span>Terms</span>
      </footer>
    </div>
  );
}