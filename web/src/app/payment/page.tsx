import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment",
};

export default function PaymentPage() {
  return <h1 className="text-2xl font-semibold text-slate-700">Payment</h1>;
}
