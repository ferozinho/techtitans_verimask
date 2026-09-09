export type ClaimDef = {
  id: string;
  label: string;
  sample: string;
};

export type SchemaTemplate = {
  id: string;
  label: string;
  blurb: string;
  claims: ClaimDef[];
};

export type PolicyPack = {
  id: string;
  label: string;
  blurb: string;
  required: string[];
};

export const TEMPLATES: SchemaTemplate[] = [
  {
    id: "employer",
    label: "Employer / license",
    blurb: "Issued at onboarding. Name and staff ID stay in the wallet at a hotline.",
    claims: [
      { id: "name", label: "Name", sample: "Ada Okonkwo" },
      { id: "institution", label: "Institution", sample: "St Mary's Hospital" },
      { id: "employmentStatus", label: "Employment status", sample: "Employed" },
      { id: "role", label: "Role", sample: "Attending physician" },
      { id: "department", label: "Department", sample: "Cardiology" },
      { id: "staffId", label: "Staff ID", sample: "STF-204" },
    ],
  },
  {
    id: "event",
    label: "Event / gate",
    blurb: "Registration desk. Address and DOB stay in the wallet at the door.",
    claims: [
      { id: "name", label: "Name", sample: "Ada Okonkwo" },
      { id: "gender", label: "Gender", sample: "Female" },
      { id: "dateOfBirth", label: "Date of birth", sample: "2003-04-11" },
      { id: "address", label: "Address", sample: "12 Marine Drive, Mumbai" },
      { id: "passType", label: "Pass type", sample: "Attendee" },
      { id: "eventId", label: "Event", sample: "Verimask Summit 2026" },
    ],
  },
  {
    id: "campus",
    label: "Campus / hiring",
    blurb: "Qualification file. Recruiter can ask for degree without a name.",
    claims: [
      { id: "name", label: "Name", sample: "Ada Okonkwo" },
      { id: "institution", label: "Institution", sample: "National Institute of Design" },
      { id: "degree", label: "Degree", sample: "B.Tech" },
      { id: "program", label: "Program", sample: "Computer Science" },
      { id: "graduationYear", label: "Graduation year", sample: "2024" },
      { id: "credentialId", label: "Credential ID", sample: "QC-ADA-2024" },
    ],
  },
  {
    id: "staff",
    label: "Staff / org",
    blurb: "Backstage or office. Role in, home address out.",
    claims: [
      { id: "name", label: "Name", sample: "Ada Okonkwo" },
      { id: "role", label: "Role", sample: "Staff" },
      { id: "organization", label: "Organization", sample: "Verimask Ops" },
      { id: "staffId", label: "Staff ID", sample: "STF-204" },
      { id: "address", label: "Address", sample: "12 Marine Drive, Mumbai" },
    ],
  },
  {
    id: "custom",
    label: "Custom",
    blurb: "Name the claims yourself. Same stamp, any attributes.",
    claims: [{ id: "name", label: "Name", sample: "Ada Okonkwo" }],
  },
];

export const CLAIM_LABELS: Record<string, string> = {
  name: "Name",
  gender: "Gender",
  dateOfBirth: "Date of birth",
  address: "Address",
  passType: "Pass type",
  eventId: "Event",
  institution: "Institution",
  degree: "Degree",
  program: "Program",
  graduationYear: "Graduation year",
  credentialId: "Credential ID",
  role: "Role",
  organization: "Organization",
  staffId: "Staff ID",
  employmentStatus: "Employment status",
  department: "Department",
  over18: "Age 18+",
};

export function labelFor(id: string, labels?: Record<string, string>): string {
  return labels?.[id] ?? CLAIM_LABELS[id] ?? id.replace(/_/g, " ");
}

export function uniqueClaimId(label: string, used: Set<string>): string {
  const base = slug(label);
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}_${n++}`;
  used.add(id);
  return id;
}

export const POLICY_PACKS: PolicyPack[] = [
  {
    id: "source",
    label: "Anonymous source",
    blurb: "Institution + employed. Name, ID, department stay hidden.",
    required: ["institution", "employmentStatus"],
  },
  {
    id: "entry",
    label: "Gate entry",
    blurb: "Name + pass. Hide address, DOB, gender.",
    required: ["name", "passType"],
  },
  {
    id: "hiring",
    label: "Hiring desk",
    blurb: "Degree + institution. Name stays off the desk.",
    required: ["institution", "degree"],
  },
  {
    id: "age_gate",
    label: "Age-restricted door",
    blurb: "Name + 18+. Exact birthday never shown.",
    required: ["name", "over18"],
  },
  {
    id: "staff",
    label: "Staff / backstage",
    blurb: "Name + role. Home address stays hidden.",
    required: ["name", "role"],
  },
];

export function packById(id: string): PolicyPack {
  return POLICY_PACKS.find((p) => p.id === id) ?? POLICY_PACKS[0];
}

export function templateById(id: string): SchemaTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function slug(label: string): string {
  const s = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return s || "claim";
}
