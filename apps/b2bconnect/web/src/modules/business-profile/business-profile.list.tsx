import { Button, WorkspaceStatusBadge } from "@codexsun/ui";
import { Check, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import type { BusinessProfile } from "./business-profile.types";

export function BusinessProfileReviewList({
  loadingUuid,
  onReview,
  profiles
}: {
  loadingUuid: string;
  onReview: (uuid: string, decision: "approve" | "reject", note: string) => void;
  profiles: BusinessProfile[];
}) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  if (profiles.length === 0)
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No business profiles have been submitted yet.
      </div>
    );
  return (
    <div className="space-y-3">
      {profiles.map((profile) => (
        <article className="rounded-xl border bg-card p-5 shadow-sm" key={profile.uuid}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{profile.businessName}</h3>
                <WorkspaceStatusBadge
                  label={profile.status}
                  status={profile.status}
                  tone={
                    profile.status === "approved"
                      ? "success"
                      : profile.status === "rejected"
                        ? "danger"
                        : "warning"
                  }
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {profile.industrySegment} · {profile.association} · {profile.ownerEmail}
              </p>
            </div>
            {profile.whatsappEnabled ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <MessageCircle className="size-4" /> WhatsApp enabled
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{profile.description}</p>
          <p className="mt-2 text-xs">
            <strong>Products/services:</strong> {profile.productsServices}
          </p>
          {profile.status === "pending" ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
              <input
                className="h-9 min-w-56 flex-1 rounded-md border bg-background px-3 text-sm"
                placeholder="Review note (required for rejection)"
                value={notes[profile.uuid] ?? ""}
                onChange={(event) =>
                  setNotes((current) => ({ ...current, [profile.uuid]: event.target.value }))
                }
              />
              <Button
                disabled={loadingUuid === profile.uuid}
                onClick={() => onReview(profile.uuid, "approve", notes[profile.uuid] ?? "")}
              >
                <Check className="size-4" />
                Approve
              </Button>
              <Button
                disabled={loadingUuid === profile.uuid}
                variant="destructive"
                onClick={() => onReview(profile.uuid, "reject", notes[profile.uuid] ?? "")}
              >
                <X className="size-4" />
                Reject
              </Button>
            </div>
          ) : profile.reviewNote ? (
            <p className="mt-3 rounded-md bg-muted p-3 text-xs">
              <strong>Review:</strong> {profile.reviewNote}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
