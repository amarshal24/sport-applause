import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type PodcastCheckoutKind = "tip" | "unlock" | "membership";

export interface PodcastCheckoutRequest {
  kind: PodcastCheckoutKind;
  podcastId?: string;
  creatorId?: string;
  amountCents?: number;
  title?: string;
}

interface Props {
  request: PodcastCheckoutRequest | null;
  onClose: () => void;
}

const PodcastCheckoutModal = ({ request, onClose }: Props) => {
  if (!request) return null;

  const fetchClientSecret = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-podcast-checkout", {
      body: {
        kind: request.kind,
        podcastId: request.podcastId,
        creatorId: request.creatorId,
        amountCents: request.amountCents,
        returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if (error || !data?.clientSecret) {
      throw new Error(data?.error || error?.message || "Could not start checkout");
    }
    return data.clientSecret;
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{request.title ?? "Support this creator"}</DialogTitle>
        </DialogHeader>
        <div id="podcast-checkout">
          <EmbeddedCheckoutProvider
            stripe={getStripe()}
            options={{ fetchClientSecret }}
            key={`${request.kind}-${request.podcastId ?? request.creatorId}-${request.amountCents ?? 0}`}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PodcastCheckoutModal;
