export type PaymentState =
  | "idle"
  | "charging"
  | "success"
  | "cancelled"
  | "failed";

export type PaymentEvent =
  | {
      type: "START_CHARGE";
    }
  | {
      type: "CANCEL";
    }
  | {
      type: "COMPLETE";
    }
  | {
      type: "FAIL";
    }
  | {
      type: "RESET";
    };

export type PaymentStateValue = {
  status: PaymentState;
};

export const initialPaymentState: PaymentStateValue = {
  status: "idle",
};

export function paymentReducer(
  state: PaymentStateValue,
  event: PaymentEvent
): PaymentStateValue {
  switch (event.type) {
    case "START_CHARGE": {
      if (state.status !== "idle") {
        return state;
      }

      return {
        status: "charging",
      };
    }

    case "CANCEL": {
      if (state.status !== "charging") {
        return state;
      }

      return {
        status: "cancelled",
      };
    }

    case "COMPLETE": {
      if (state.status !== "charging") {
        return state;
      }

      return {
        status: "success",
      };
    }

    case "FAIL": {
      if (state.status !== "charging") {
        return state;
      }

      return {
        status: "failed",
      };
    }

    case "RESET": {
      return initialPaymentState;
    }

    default: {
      return state;
    }
  }
}