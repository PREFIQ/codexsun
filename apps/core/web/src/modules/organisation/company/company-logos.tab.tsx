import { useEffect, useState } from "react";
import { ImageUp, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFormField, WorkspaceFormGrid } from "@codexsun/ui/workspace/upsert";
import type { MasterSavePayload } from "../../master/master.types";
import { fetchCompanyLogo, uploadCompanyLogo } from "./company-media.services";

type CompanyLogoVariant = "logo" | "logo-dark";

export function CompanyLogosTab({ form, setForm }: {
  form: MasterSavePayload;
  setForm: React.Dispatch<React.SetStateAction<MasterSavePayload>>;
}) {
  const [preview, setPreview] = useState<Record<CompanyLogoVariant, string | null>>({ "logo-dark": null, logo: null });
  const [uploading, setUploading] = useState<CompanyLogoVariant | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [logo, logoDark] = await Promise.all([
        form.logoPath ? fetchCompanyLogo("logo") : Promise.resolve(null),
        form.logoDarkPath ? fetchCompanyLogo("logo-dark") : Promise.resolve(null)
      ]);
      if (!active) {
        if (logo) URL.revokeObjectURL(logo);
        if (logoDark) URL.revokeObjectURL(logoDark);
        return;
      }
      setPreview({ "logo-dark": logoDark, logo });
    };
    void load();
    return () => { active = false; };
  }, [form.logoDarkPath, form.logoPath]);

  async function upload(variant: CompanyLogoVariant, file: File | null) {
    if (!file) return;
    setUploading(variant);
    try {
      const saved = await uploadCompanyLogo(file, variant);
      const localPreview = URL.createObjectURL(file);
      setPreview((current) => {
        if (current[variant]) URL.revokeObjectURL(current[variant]!);
        return { ...current, [variant]: localPreview };
      });
      setForm((current) => ({ ...current, ...(variant === "logo" ? { logoPath: saved.path } : { logoDarkPath: saved.path }) }));
      toast.success(variant === "logo" ? "Logo uploaded" : "Dark logo uploaded");
    } catch (error) {
      toast.error("Unable to upload logo", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setUploading(null);
    }
  }

  return <WorkspaceFormGrid columns={2}>
    <LogoField label="Logo" preview={preview.logo} uploading={uploading === "logo"} onFileChange={(file) => void upload("logo", file)} />
    <LogoField label="Logo dark" dark preview={preview["logo-dark"]} uploading={uploading === "logo-dark"} onFileChange={(file) => void upload("logo-dark", file)} />
  </WorkspaceFormGrid>;
}

function LogoField({ dark = false, label, onFileChange, preview, uploading }: {
  dark?: boolean;
  label: string;
  onFileChange: (file: File | null) => void;
  preview: string | null;
  uploading: boolean;
}) {
  return <WorkspaceFormField label={label}>
    <div className={`flex min-h-44 flex-col justify-between gap-4 rounded-md border p-4 ${dark ? "bg-slate-950" : "bg-muted/30"}`}>
      <div className="flex h-20 items-center justify-center overflow-hidden rounded-md border border-dashed bg-background/80 p-3">
        {preview ? <img alt={label} className="max-h-full max-w-full object-contain" src={preview} /> : <ImageUp className="size-6 text-muted-foreground" />}
      </div>
      <Button asChild className="w-full" disabled={uploading} type="button" variant="outline">
        <label className="cursor-pointer">
          {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
          Upload SVG
          <input accept="image/svg+xml,.svg" className="sr-only" disabled={uploading} onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} type="file" />
        </label>
      </Button>
    </div>
  </WorkspaceFormField>;
}
