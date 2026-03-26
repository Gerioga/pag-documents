export interface ScriptDefinition {
  id: string;
  name: string;
  description: string;
  docTypes: string[];
  prompt: string;
  topK: number;
}

export const SCRIPTS: ScriptDefinition[] = [
  {
    id: "transparency-review",
    name: "Transparency Review",
    description:
      "Analyze transparency and disclosure provisions across all laws and decrees",
    docTypes: ["Law", "Decree"],
    prompt: `Analyze the following Serbian legal provisions for transparency and public disclosure requirements.
For each document, identify:
1. What information must be publicly disclosed
2. What registers or databases must be publicly accessible
3. What reporting obligations exist
4. What citizen access rights are guaranteed
5. Gaps or weaknesses in transparency provisions

Provide a structured analysis with specific article citations.`,
    topK: 25,
  },
  {
    id: "asset-governance-gaps",
    name: "Asset Governance Gap Analysis",
    description:
      "Identify gaps in the public asset governance framework",
    docTypes: ["Law", "Decree", "Rulebook"],
    prompt: `Based on the following legal provisions, conduct a gap analysis of Serbia's public asset governance framework.
Identify:
1. Which aspects of public asset management are well-covered by law
2. Which aspects have insufficient legal coverage
3. Overlapping or conflicting provisions between different laws
4. Missing implementing regulations or bylaws
5. International best practice gaps (compared to OECD standards)

Focus on: asset registers, valuation, disposal, oversight, and reporting.`,
    topK: 30,
  },
  {
    id: "institutional-mapping",
    name: "Institutional Responsibility Mapping",
    description:
      "Map which institutions are responsible for what in public asset management",
    docTypes: ["Law", "Decree", "Rulebook"],
    prompt: `From the following legal texts, extract and map ALL institutional responsibilities related to public asset management.
Create a structured mapping showing:
1. Institution name
2. Specific responsibilities assigned by law
3. Which law/article assigns the responsibility
4. Oversight relationships (who oversees whom)
5. Reporting lines
6. Any gaps where responsibility is unclear

Cover: Ministry of Finance, Republic Geodetic Authority, State Audit Institution, local self-governments, public enterprises, and any other relevant bodies.`,
    topK: 25,
  },
  {
    id: "eu-compliance",
    name: "EU Compliance Check",
    description:
      "Check alignment of Serbian laws with EU acquis on public assets",
    docTypes: ["Law"],
    prompt: `Analyze the following Serbian laws for alignment with EU standards and directives related to:
1. Public procurement (Directive 2014/24/EU)
2. Public property management
3. State aid rules
4. Financial reporting (IPSAS/ESA 2010)
5. Cadastre and land registry (INSPIRE Directive)

For each area, assess: current alignment level, key gaps, and recommended amendments.`,
    topK: 20,
  },
  {
    id: "cross-reference",
    name: "Cross-Reference Analysis",
    description:
      "Find cross-references and dependencies between laws and decrees",
    docTypes: ["Law", "Decree", "Rulebook"],
    prompt: `Analyze the following legal texts to identify ALL cross-references between them.
Map:
1. Which laws reference which other laws
2. Which decrees implement which law provisions
3. Circular dependencies or inconsistencies
4. Laws that reference regulations not yet adopted
5. A dependency graph showing the legal hierarchy

Present as a structured table and narrative summary.`,
    topK: 30,
  },
  {
    id: "valuation-framework",
    name: "Valuation Framework Analysis",
    description:
      "Analyze the legal framework for public asset valuation",
    docTypes: ["Law", "Decree", "Rulebook"],
    prompt: `Analyze all provisions related to the valuation of public assets and real estate.
Cover:
1. What valuation methods are prescribed by law
2. Who is authorized to perform valuations
3. How often must assets be revalued
4. What standards apply (national vs international)
5. How valuation results feed into financial reporting
6. Gaps compared to IPSAS 17/IPSAS 45 requirements

Focus especially on the Rulebook on Real Estate Valuation and the Law on Public Property.`,
    topK: 20,
  },
];
