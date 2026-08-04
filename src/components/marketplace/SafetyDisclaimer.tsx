import { ShieldAlert } from "lucide-react";

interface Props {
  variant?: "banner" | "compact";
  className?: string;
}

/**
 * Fraud / safety notice. U⚡️Sportz Marketplace is in-person only —
 * no shipping, and no payments are handled by the app.
 */
const SafetyDisclaimer = ({ variant = "banner", className = "" }: Props) => {
  if (variant === "compact") {
    return (
      <p className={`text-xs text-muted-foreground ${className}`}>
        <span className="font-semibold text-foreground">In-person sales only.</span> Shipping is not
        allowed on or through this app. Never send money, deposits, gift cards, or payment app
        transfers before meeting. Meet in a safe, public place and inspect the item first.
      </p>
    );
  }

  return (
    <div
      className={`flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 ${className}`}
    >
      <ShieldAlert className="h-5 w-5 shrink-0 text-destructive" />
      <div className="space-y-1">
        <p className="text-sm font-semibold">Fraud notice — in-person deals only</p>
        <p className="text-xs text-muted-foreground">
          Shipping is not permitted on or through U⚡️Sportz, and we never process payments or hold
          funds. Do not send deposits, wire transfers, gift cards, or payment-app money to anyone
          who asks to ship an item — those requests are almost always scams. Meet in a safe, public
          place, inspect the item and any authentication in person, and exchange payment only at
          the meetup. Buyers and sellers deal at their own risk; U⚡️Sportz is not a party to any
          transaction and is not responsible for losses. Report suspicious listings or messages to
          us right away.
        </p>
      </div>
    </div>
  );
};

export default SafetyDisclaimer;
