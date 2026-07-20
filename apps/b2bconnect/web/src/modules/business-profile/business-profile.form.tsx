import {
  Button,
  Input,
  Textarea,
  WorkspaceFormField,
  WorkspaceFormGrid,
  WorkspaceSelect,
  WorkspaceSwitchCard
} from "@codexsun/ui";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { validateBusinessProfile } from "./business-profile.schema";
import type {
  BusinessProfile,
  BusinessProfileErrors,
  BusinessProfileValues
} from "./business-profile.types";

const associationOptions = [
  { label: "TEAMA", value: "teama" },
  { label: "TAEF", value: "taef" },
  { label: "Export Association", value: "export-association" },
  { label: "Industrial Association", value: "industrial-association" },
  { label: "Independent business", value: "independent" }
];
const emptyValues: BusinessProfileValues = {
  association: "independent",
  businessName: "",
  capacityNote: "",
  capabilitiesText: "",
  description: "",
  industrySegment: "",
  productsServices: "",
  whatsappEnabled: true,
  whatsappNumber: ""
};

export function BusinessProfileForm({
  error,
  loading,
  onSave,
  profile
}: {
  error: string;
  loading: boolean;
  onSave: (values: BusinessProfileValues) => void;
  profile: BusinessProfile | null;
}) {
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState<BusinessProfileErrors>({});
  useEffect(() => {
    if (profile)
      setValues({
        association: profile.association,
        businessName: profile.businessName,
        capacityNote: profile.capacityNote,
        capabilitiesText: profile.capabilities.join(", "),
        description: profile.description,
        industrySegment: profile.industrySegment,
        productsServices: profile.productsServices,
        whatsappEnabled: profile.whatsappEnabled,
        whatsappNumber: profile.whatsappNumber
      });
  }, [profile]);
  const set = <K extends keyof BusinessProfileValues>(key: K, value: BusinessProfileValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validateBusinessProfile(values);
    setErrors(next);
    if (Object.keys(next).length === 0) onSave(values);
  }
  return (
    <form className="space-y-5" noValidate onSubmit={submit}>
      {error ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <strong className="block">Unable to save profile</strong>
          {error}
        </div>
      ) : null}
      <WorkspaceFormGrid>
        <WorkspaceFormField label="Business name" required>
          <Input
            className={errors.businessName ? "border-destructive" : ""}
            value={values.businessName}
            onChange={(event) => set("businessName", event.target.value)}
          />
          {errors.businessName ? (
            <small className="text-destructive">{errors.businessName}</small>
          ) : null}
        </WorkspaceFormField>
        <WorkspaceFormField label="Industry segment" required>
          <Input
            className={errors.industrySegment ? "border-destructive" : ""}
            placeholder="Knitting, dyeing, garments, machinery…"
            value={values.industrySegment}
            onChange={(event) => set("industrySegment", event.target.value)}
          />
          {errors.industrySegment ? (
            <small className="text-destructive">{errors.industrySegment}</small>
          ) : null}
        </WorkspaceFormField>
        <WorkspaceFormField label="Association">
          <WorkspaceSelect
            options={associationOptions}
            value={values.association}
            onValueChange={(value) =>
              set("association", value as BusinessProfileValues["association"])
            }
          />
        </WorkspaceFormField>
        <WorkspaceFormField label="WhatsApp number" required={values.whatsappEnabled}>
          <Input
            className={errors.whatsappNumber ? "border-destructive" : ""}
            placeholder="919876543210"
            value={values.whatsappNumber}
            onChange={(event) => set("whatsappNumber", event.target.value)}
          />
          {errors.whatsappNumber ? (
            <small className="text-destructive">{errors.whatsappNumber}</small>
          ) : null}
        </WorkspaceFormField>
      </WorkspaceFormGrid>
      <WorkspaceFormField label="About the business" required>
        <Textarea
          className={errors.description ? "border-destructive" : ""}
          rows={4}
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
        />
        {errors.description ? (
          <small className="text-destructive">{errors.description}</small>
        ) : null}
      </WorkspaceFormField>
      <WorkspaceFormField label="Products and services" required>
        <Textarea
          className={errors.productsServices ? "border-destructive" : ""}
          rows={3}
          value={values.productsServices}
          onChange={(event) => set("productsServices", event.target.value)}
        />
        {errors.productsServices ? (
          <small className="text-destructive">{errors.productsServices}</small>
        ) : null}
      </WorkspaceFormField>
      <WorkspaceFormGrid>
        <WorkspaceFormField label="Capabilities">
          <Input
            placeholder="Organic cotton, printing, 50k pieces/month"
            value={values.capabilitiesText}
            onChange={(event) => set("capabilitiesText", event.target.value)}
          />
          <small className="text-muted-foreground">
            Comma-separated capabilities used for discovery.
          </small>
        </WorkspaceFormField>
        <WorkspaceFormField label="Available capacity">
          <Input
            placeholder="Current production availability"
            value={values.capacityNote}
            onChange={(event) => set("capacityNote", event.target.value)}
          />
        </WorkspaceFormField>
      </WorkspaceFormGrid>
      <WorkspaceSwitchCard
        fieldLabel="WhatsApp inquiries"
        checked={values.whatsappEnabled}
        activeLabel="WhatsApp inquiries enabled"
        inactiveLabel="WhatsApp inquiries disabled"
        description="Allow public visitors to contact this business on WhatsApp."
        onCheckedChange={(checked) => set("whatsappEnabled", checked)}
      />
      <div className="flex justify-end border-t pt-4">
        <Button disabled={loading} type="submit">
          <Save className="size-4" />
          {loading ? "Submitting…" : profile ? "Update and resubmit" : "Submit for approval"}
        </Button>
      </div>
    </form>
  );
}
