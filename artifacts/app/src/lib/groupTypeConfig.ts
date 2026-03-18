export const GROUP_TYPE_OPTIONS = [
  { value: "angling_club", label: "Angling / Fishing Club" },
  { value: "neighbourhood_watch", label: "Neighbourhood Watch" },
  { value: "hoa", label: "Residents Association / HOA" },
  { value: "sports_club", label: "Sports / GAA Club" },
  { value: "tidy_towns", label: "Tidy Towns Committee" },
  { value: "environmental", label: "Environmental Group" },
  { value: "other", label: "Other" },
] as const;

export type GroupTypeValue = typeof GROUP_TYPE_OPTIONS[number]["value"];

export interface GroupTerminology {
  reportNoun: string;
  reportNounPlural: string;
  reportVerb: string;
  memberNoun: string;
  memberNounPlural: string;
  areaLabel: string;
  submitButtonLabel: string;
  dashboardHeading: string;
  emptyState: string;
}

const TERMINOLOGY: Record<string, GroupTerminology> = {
  angling_club: {
    reportNoun: "sighting",
    reportNounPlural: "sightings",
    reportVerb: "log",
    memberNoun: "angler",
    memberNounPlural: "anglers",
    areaLabel: "water / stretch",
    submitButtonLabel: "Log Sighting",
    dashboardHeading: "Recent Sightings",
    emptyState: "No sightings logged yet",
  },
  neighbourhood_watch: {
    reportNoun: "incident",
    reportNounPlural: "incidents",
    reportVerb: "report",
    memberNoun: "resident",
    memberNounPlural: "residents",
    areaLabel: "area",
    submitButtonLabel: "Report Incident",
    dashboardHeading: "Recent Incidents",
    emptyState: "No incidents reported yet",
  },
  hoa: {
    reportNoun: "complaint",
    reportNounPlural: "complaints",
    reportVerb: "submit",
    memberNoun: "resident",
    memberNounPlural: "residents",
    areaLabel: "estate",
    submitButtonLabel: "Submit Complaint",
    dashboardHeading: "Recent Complaints",
    emptyState: "No complaints submitted yet",
  },
  sports_club: {
    reportNoun: "report",
    reportNounPlural: "reports",
    reportVerb: "report",
    memberNoun: "member",
    memberNounPlural: "members",
    areaLabel: "facility",
    submitButtonLabel: "Submit Report",
    dashboardHeading: "Recent Reports",
    emptyState: "No reports filed yet",
  },
  tidy_towns: {
    reportNoun: "observation",
    reportNounPlural: "observations",
    reportVerb: "log",
    memberNoun: "volunteer",
    memberNounPlural: "volunteers",
    areaLabel: "patch",
    submitButtonLabel: "Log Observation",
    dashboardHeading: "Recent Observations",
    emptyState: "No observations logged yet",
  },
  environmental: {
    reportNoun: "incident",
    reportNounPlural: "incidents",
    reportVerb: "report",
    memberNoun: "member",
    memberNounPlural: "members",
    areaLabel: "area",
    submitButtonLabel: "Report Incident",
    dashboardHeading: "Recent Incidents",
    emptyState: "No incidents reported yet",
  },
  other: {
    reportNoun: "report",
    reportNounPlural: "reports",
    reportVerb: "report",
    memberNoun: "member",
    memberNounPlural: "members",
    areaLabel: "area",
    submitButtonLabel: "Submit Report",
    dashboardHeading: "Recent Reports",
    emptyState: "No reports filed yet",
  },
};

const DEFAULT_TERMINOLOGY: GroupTerminology = TERMINOLOGY.other;

export function getGroupTerminology(groupType?: string | null): GroupTerminology {
  if (!groupType) return DEFAULT_TERMINOLOGY;
  return TERMINOLOGY[groupType] ?? DEFAULT_TERMINOLOGY;
}

export function getGroupTypeLabel(groupType?: string | null): string {
  if (!groupType) return "Group";
  return GROUP_TYPE_OPTIONS.find((o) => o.value === groupType)?.label ?? groupType;
}

export const DEFAULT_INCIDENT_TYPES: Record<string, string[]> = {
  angling_club: [
    "Illegal Netting / Poaching",
    "Water Pollution",
    "Dead Fish / Fish Kill",
    "Illegal Dumping at Riverbank",
    "Invasive Species Spotted",
    "Suspicious Activity",
  ],
  neighbourhood_watch: [
    "Suspicious Activity",
    "Vandalism",
    "Theft",
    "Anti-Social Behaviour",
    "Fly-Tipping",
    "Noise Complaint",
  ],
  hoa: [
    "Noise Complaint",
    "Parking Violation",
    "Property Damage",
    "Maintenance Issue",
    "Security Concern",
    "Fly-Tipping",
  ],
  sports_club: [
    "Pitch / Surface Damage",
    "Vandalism or Graffiti",
    "Equipment Theft",
    "Unsafe Fixture or Structure",
    "Anti-Social Behaviour",
    "Injury Report",
  ],
  tidy_towns: [
    "Litter",
    "Illegal Dumping",
    "Graffiti",
    "Overgrown Verge",
    "Pothole",
    "Damaged Street Furniture",
  ],
  environmental: [
    "Illegal Dumping / Fly-tipping",
    "Water Pollution",
    "Air Quality / Burning",
    "Invasive Species",
    "Habitat Destruction",
    "Wildlife Injury / Death",
  ],
  other: [
    "Incident",
    "Suspicious Activity",
    "Damage",
    "Safety Concern",
  ],
};
