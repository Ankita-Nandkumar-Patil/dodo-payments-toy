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

export default function PaymentToy({
  amount = 499,
  defaultMethod = "card",
  onPaymentComplete,
}: PaymentToyProps) {
  const [paymentState, dispatch] =
    useReducer(
      paymentReducer,
      initialPaymentState
    );

  const [method, setMethod] =
    useState<PaymentMethod>(
      defaultMethod
    );

  const handleChargeStart =
    useCallback(() => {
      dispatch({
        type: "START_CHARGE",
      });
    }, []);

  const handleChargeCancel =
    useCallback(() => {
      dispatch({
        type: "CANCEL",
      });
    }, []);

  const handleChargeComplete =
    useCallback(() => {
      dispatch({
        type: "COMPLETE",
      });
    }, []);

  useEffect(() => {
    if (
      paymentState.status ===
      "cancelled"
    ) {
      const timeout = window.setTimeout(
        () => {
          dispatch({
            type: "RESET",
          });
        },
        500
      );

      return () => {
        window.clearTimeout(timeout);
      };
    }

    if (
      paymentState.status ===
      "success"
    ) {
      onPaymentComplete?.(method);

      const timeout = window.setTimeout(
        () => {
          dispatch({
            type: "RESET",
          });
        },
        1400
      );

      return () => {
        window.clearTimeout(timeout);
      };
    }

    if (
      paymentState.status ===
      "failed"
    ) {
      const timeout = window.setTimeout(
        () => {
          dispatch({
            type: "RESET",
          });
        },
        800
      );

      return () => {
        window.clearTimeout(timeout);
      };
    }
  }, [
    paymentState.status,
    method,
    onPaymentComplete,
  ]);

  const canChangeMethod =
    paymentState.status === "idle";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <PaymentToyCanvas
        method={method}
        onChargeStart={
          handleChargeStart
        }
        onChargeCancel={
          handleChargeCancel
        }
        onChargeComplete={
          handleChargeComplete
        }
      />

      {/* Temporary method controls */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          zIndex: 10,
          display: "flex",
          gap: 8,
          transform:
            "translateX(-50%)",
        }}
      >
        {methods.map(
          (paymentMethod) => {
            const active =
              paymentMethod ===
              method;

            return (
              <button
                key={paymentMethod}
                type="button"
                disabled={!canChangeMethod}
                onClick={() =>
                  setMethod(
                    paymentMethod
                  )
                }
                style={{
                  padding:
                    "8px 14px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 999,
                  background: active
                    ? "rgba(255,255,255,0.16)"
                    : "rgba(255,255,255,0.05)",
                  color: active
                    ? "#fff"
                    : "rgba(255,255,255,0.5)",
                  cursor:
                    canChangeMethod
                      ? "pointer"
                      : "default",
                  fontSize: 12,
                  textTransform:
                    "capitalize",
                  backdropFilter:
                    "blur(10px)",
                }}
              >
                {paymentMethod}
              </button>
            );
          }
        )}
      </div>

      {/* Temporary development state */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          padding: "8px 12px",
          borderRadius: 999,
          background:
            "rgba(255,255,255,0.08)",
          color: "white",
          fontFamily:
            "system-ui, sans-serif",
          fontSize: 12,
          backdropFilter:
            "blur(10px)",
        }}
      >
        {paymentState.status}
      </div>

      {/* Temporary development amount */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10,
          color:
            "rgba(255,255,255,0.5)",
          fontFamily:
            "system-ui, sans-serif",
          fontSize: 12,
        }}
      >
        ₹{amount}
      </div>
    </div>
  );
}