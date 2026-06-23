// Mirrors the field labels defined in amer-247-expo/src/data/catalog.ts
// (AMER.forms[formType].fields) so admin shows the same labels the
// applicant actually saw when filling the form.
export const FORM_FIELD_LABELS: Record<string, Record<string, string>> = {
  A: {
    applicant: "Full Name of Applicant",
    sponsor: "Full Name of Sponsor",
    email: "Email ID",
    phone: "Mobile No. (with country code)",
    priority: "Application Priority",
    location: "Inside or Outside UAE",
    address: "Address",
    comment: "Comment",
  },
  B: {
    applicant: "Full Name of Applicant",
    email: "Email ID",
    phone: "Mobile No. (with country code)",
    emirates: "Emirates",
    address: "Address",
    comment: "Comment",
  },
  C: {
    applicant: "Full Name of Applicant",
    email: "Email ID",
    phone: "Mobile No. (with country code)",
  },
  D: {
    applicant: "Full Name of Applicant",
    email: "Email ID",
    phone: "Mobile No. (with country code)",
    priority: "Application Priority",
    apptype: "Application Type",
    address: "Address",
    comment: "Comment",
  },
};

export function labelForField(formType: string, key: string): string {
  return (
    FORM_FIELD_LABELS[formType]?.[key] ||
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
