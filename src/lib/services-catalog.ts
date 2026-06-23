// AMER 24/7 service catalog — two-level hierarchy matching the app.
// hub → groups → services

export type ServiceSubGroup = {
  group: string;
  services: string[];
};

export type ServiceHub = {
  id: string;
  label: string;
  icon: string; // lucide icon name for display
  main: boolean; // true = shown in the app's main Services screen
  groups: ServiceSubGroup[];
};

export const SERVICE_HUBS: ServiceHub[] = [
  {
    id: "amer-business",
    label: "Amer Services",
    icon: "Building2",
    main: true,
    groups: [
      {
        group: "New Entry Permits",
        services: [
          "Spouse Entry Permit",
          "Son / Daughter Entry Permit",
          "Parent's Entry Permit",
          "Investor / Partner Visa",
          "Employment Visa",
          "Virtual Work Visa (Remote Work Visa)",
          "Job Seeker Visa (Inside UAE)",
          "Re-Entry Permit",
        ],
      },
      {
        group: "Visa Extension",
        services: [
          "Sponsored Visit Visa Extend",
          "Gulf Residents Visit Visa Extend",
        ],
      },
      {
        group: "New Born",
        services: ["New Born Residence Visa"],
      },
      {
        group: "Residence Visa Renewal",
        services: [
          "Spouse & Children Visa Renewal",
          "Parents Visa Renewal (01 Year)",
          "Employment Visa Renewal",
          "Partner / Investor Visa Renewal",
          "Virtual Visa Renewal",
        ],
      },
      {
        group: "Residence Visa Stamping",
        services: [
          "Spouse & Children Visa Stamping",
          "Parents Visa Stamping (01 Year)",
          "Employment Visa Stamping",
          "Partner / Investor Visa Stamping",
          "Virtual Visa Stamping (01 Year)",
        ],
      },
      {
        group: "Cancellation",
        services: [
          "Family Residence Visa Cancellation",
          "Employment Visa Cancellation",
          "Partner / Investor Visa Cancellation",
          "Virtual Work Visa Cancellation",
          "Entry Permit Cancellation (After Entry) – Company (1)",
          "Entry Permit Cancellation (After Entry) – Company (2)",
        ],
      },
      {
        group: "Data Modification",
        services: [
          "Data Modification – Family",
          "Data Modification – Company",
        ],
      },
      {
        group: "Travel Report",
        services: [
          "Travel Report – Family",
          "Travel Report – Investor / Partner",
          "Travel Report – Golden Visa",
        ],
      },
      {
        group: "Establishment Card",
        services: [
          "New Establishment Card with Online",
          "New Establishment Card without Online",
          "Renewal – Establishment Card with Online",
          "Renewal – Establishment Card without Online",
        ],
      },
      {
        group: "Change Status",
        services: [
          "Change Status – Family",
          "Change Status – Company",
          "Change Status – Sponsored Visit Visa",
        ],
      },
      {
        group: "Other",
        services: [
          "Security Deposit",
          "Holding Visa",
          "Sponsored Visit Visa – 30 Days",
          "Sponsored Visit Visa – 90 Days",
        ],
      },
    ],
  },
  {
    id: "emirates-id",
    label: "Emirates ID",
    icon: "IdCard",
    main: true,
    groups: [
      {
        group: "New Born",
        services: [
          "New Born Emirates ID / 1 Year",
          "New Born Emirates ID / 2 Year",
        ],
      },
      {
        group: "New Residency",
        services: [
          "New Residency (1st Time Visiting) / 1 Year",
          "New Residency (1st Time Visiting) / 2 Year",
          "New Residency (Previously Visited UAE) / 1 Year",
          "New Residency (Previously Visited UAE) / 2 Year",
        ],
      },
      {
        group: "Sponsor Transfer",
        services: [
          "Emirates ID Sponsor Transfer / 1 Year",
          "Emirates ID Sponsor Transfer / 2 Year",
        ],
      },
      {
        group: "Renewal",
        services: [
          "Emirates ID Renewal / 1 Year",
          "Emirates ID Renewal / 2 Year",
        ],
      },
      {
        group: "Replacement & Other",
        services: [
          "Emirates ID Replacement / Lost",
          "Golden Emirates ID",
        ],
      },
    ],
  },
  {
    id: "golden",
    label: "Golden Visa",
    icon: "Gem",
    main: true,
    groups: [
      {
        group: "All Golden Visa Services",
        services: [
          "Golden Visa for Commercial Investor",
          "Golden Visa for Director / Manager",
          "Golden Visa for Doctors",
          "Golden Visa for Engineers",
          "Golden Visa for New Born Baby",
          "Golden Visa for PhD Holder",
          "Golden Visa for Scientists",
          "Golden Visa for Family Members",
          "Golden Visa for Bachelor Degree Holder / Professionals (30,000 AED+ Salary)",
          "Golden Visa for Commercial Investor (2 Million Fixed Deposit)",
          "Golden Visa for Outstanding Student / Highschool Graduate",
          "Golden Visa for Outstanding Student / University Graduate",
          "Golden Visa for Creative People in Culture & Art",
        ],
      },
    ],
  },
  {
    id: "tasheel",
    label: "Tas-Heel Services",
    icon: "FileText",
    main: true,
    groups: [
      {
        group: "Tas-Heel Services",
        services: ["More Tas-heel services — coming soon"],
      },
    ],
  },
  {
    id: "medical",
    label: "Medical Test",
    icon: "Stethoscope",
    main: true,
    groups: [
      {
        group: "Medical Fitness Test",
        services: ["New Entry", "Renewal", "Golden Visa"],
      },
    ],
  },
  {
    id: "insurance",
    label: "Insurance",
    icon: "ShieldPlus",
    main: true,
    groups: [
      {
        group: "Health Insurance Plans",
        services: [
          "Employees (Age 18–90) · Salary below AED 4,000",
          "Employees / Partners / Investors (Age 18–65) · Salary AED 4,000+",
          "Child Son / Daughter (Age 0–5)",
          "Child Son / Daughter (Age 06–25)",
          "Daughter (Age 26–28)",
          "Spouse (Age 18–60)",
          "Spouse (Age 61–90)",
          "Parents (Aged up to 90)",
        ],
      },
    ],
  },
  {
    id: "tourist",
    label: "Tourist Visa",
    icon: "Plane",
    main: false,
    groups: [
      {
        group: "UAE Tourist & Transit Visas",
        services: [
          "On-Arrival Visa Extension",
          "96 Hours Transit Visa",
          "14 Days Tourist Visa",
          "14 Days Tourist Visa — Express",
          "30 Days Tourist Visa",
          "30 Days Multiple Entry",
          "30 Days Tourist Visa — Express",
          "60 Days Tourist Visa — Express",
          "60 Days Tourist Visa",
          "60 Days Multiple Entry",
          "90 Days Single Entry",
        ],
      },
      {
        group: "Sponsored Visit Visa",
        services: [
          "Sponsored Visit Visa – 30 Days",
          "Sponsored Visit Visa – 90 Days",
        ],
      },
    ],
  },
];

export const ALL_SERVICE_NAMES: string[] = SERVICE_HUBS.flatMap((h) =>
  h.groups.flatMap((g) => g.services)
);
