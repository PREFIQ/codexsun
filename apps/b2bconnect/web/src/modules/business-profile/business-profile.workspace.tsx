import { WorkspaceFormPanel, WorkspaceStatusBadge } from "@codexsun/ui";
import { useState } from "react";
import { BusinessProfileForm } from "./business-profile.form";
import { useOwnBusinessProfile } from "./business-profile.hooks";
import { saveOwnBusinessProfile } from "./business-profile.services";
import type { BusinessProfileValues } from "./business-profile.types";

export function BusinessProfileWorkspace() {
  const { profile, setProfile, status } = useOwnBusinessProfile();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save(values: BusinessProfileValues) {
    setSaving(true);
    setError("");
    try {
      setProfile(await saveOwnBusinessProfile(values));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
            Public directory identity
          </p>
          <h2 className="mt-2 text-xl font-semibold">Your business profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit updates for administrator review. Only approved profiles appear publicly.
          </p>
        </div>
        {profile ? (
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
        ) : null}
      </div>
      {profile?.reviewNote ? (
        <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Review note:</strong> {profile.reviewNote}
        </p>
      ) : null}
      <WorkspaceFormPanel>
        {status === "loading" ? (
          <p className="p-5 text-sm text-muted-foreground">Loading profile…</p>
        ) : (
          <BusinessProfileForm error={error} loading={saving} onSave={save} profile={profile} />
        )}
      </WorkspaceFormPanel>
    </section>
  );
}
