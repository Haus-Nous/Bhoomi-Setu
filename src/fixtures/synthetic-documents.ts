import type { SyntheticDocumentFixture } from "@/types/case";

export const syntheticDocumentFixtures: SyntheticDocumentFixture[] = [
  { id: "fixture-legacy-a", title: "Synthetic legacy land record", kind: "legacy-record", type: "Legacy record", isSynthetic: true, sourceText: "MOCK SYNTHETIC LAND RECORD\nKhata: DEMO-128\nKhesra: DEMO-456\nRecorded name: Demo Elder One\nArea: 0.82 acres\nThis fictional record is not official and cannot be submitted." },
  { id: "fixture-family-a", title: "Synthetic family relationship note", kind: "family-note", type: "Family information", isSynthetic: true, sourceText: "MOCK SYNTHETIC FAMILY NOTE\nGrandparent: Demo Elder One\nParent: Demo Parent One\nRelationship: Grandparent to Parent\nThis fictional note is for prototype testing only." },
  { id: "fixture-survey-a", title: "Synthetic survey record", kind: "survey-record", type: "Survey record", isSynthetic: true, sourceText: "MOCK SYNTHETIC KHANAPURI PARCHA\nKhata: DEMO-128\nKhesra: DEMO-456\nRecorded name: Demo Elder One\nArea: 0.76 acres\nMap reference: DEMO-MAP-A12\nThis fictional record is not a government survey record." }
];
