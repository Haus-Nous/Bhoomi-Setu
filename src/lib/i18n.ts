export type Locale = "en" | "hi";

type Translation = {
  nav: Record<"home" | "dashboard" | "documents" | "family" | "verification" | "survey" | "parcel" | "official" | "earth" | "action" | "timeline", string>;
  notice: string;
  footer: string;
  cta: Record<"check" | "how" | "review" | "continue" | "back" | "close" | "save" | "preparePacket" | "readyForReview" | "exploreDemo" | "resetDemo" | "viewControl", string>;
  labels: Record<"synthetic" | "viewDetails" | "confidence" | "evidence" | "backToCase" | "mock" | "source" | "notAvailable" | "optional" | "caseHeader" | "skip" | "homeLabel" | "primaryNav" | "caseNav" | "contextNav" | "chooseLanguage", string>;
  caseStates: Record<"loading" | "notFoundTitle" | "notFoundDetail" | "errorTitle" | "errorDetail" | "retry", string>;
  home: Record<"eyebrow" | "title" | "lead" | "safety" | "start" | "step1" | "step2" | "step3" | "step4" | "forWho" | "forWhoTitle" | "forWhoDetail" | "does" | "doesDetail" | "doesNot" | "doesNotDetail" | "howTitle" | "createTitle" | "createDetail" | "documentsTitle" | "documentsDetail" | "verifyTitle" | "verifyDetail", string>;
  create: Record<"step" | "title" | "intro" | "location" | "district" | "circle" | "village" | "record" | "khata" | "khataHelp" | "khesra" | "nickname" | "required" | "missing" | "invalidKhata" | "serverError" | "creating" | "submit" | "safety" | "districtPlaceholder" | "circlePlaceholder" | "villagePlaceholder" | "khataPlaceholder" | "khesraPlaceholder" | "nicknamePlaceholder", string>;
  dashboard: Record<"surveyStage" | "surveyDetail" | "openSurvey" | "landSummary" | "noParcel" | "addLand" | "recordedDetails" | "parcelIntelligence" | "familySummary" | "peopleNoted" | "familyAvailable" | "noFamily" | "viewFamily" | "prepareNext" | "differences" | "continuePreparing" | "potentialIssues" | "needAttention" | "noDifferences" | "allChecks" | "documents" | "recordsPlace" | "viewAll" | "attention" | "attentionDetail" | "evidenceContext" | "evidenceContextDetail", string>;
  documents: Record<"header" | "subtitle" | "add" | "choose" | "fixturesNotice" | "noDocuments" | "noDocumentsDetail" | "source" | "extraction" | "suggested" | "extracting" | "runExtraction" | "extractionNotice" | "extractionFailure" | "extractionConfidence" | "close", string>;
  family: Record<"header" | "subtitle" | "relationship" | "emptyTitle" | "emptyDetail" | "check" | "checkDetail", string>;
  survey: Record<"header" | "subtitle" | "emptyTitle" | "emptyDetail" | "recordTitle" | "recordDetail" | "compare" | "comparisonFound" | "noDifferences" | "noDifferencesDetail" | "reviewNext" | "reviewEvidence" | "recordedName" | "recordedArea" | "mapReference" | "stage", string>;
  verification: Record<"pageTitle" | "pageSubtitle" | "summaryTitle" | "passed" | "potentialIssue" | "insufficientEvidence" | "passDetail" | "potentialIssueDetail" | "insufficientEvidenceDetail" | "whyFlagged" | "comparedRecords" | "recordA" | "recordB" | "source" | "reference" | "notAvailable" | "caution" | "cautionDetail" | "allChecks" | "reviewDifferences" | "allChecksTitle" | "noResultsTitle" | "noResultsDetail" | "overviewLink", string>;
  guidance: Record<"header" | "subtitle" | "emptyTitle" | "emptyDetail" | "prepare" | "reviewFirst" | "noUrgency" | "startReview" | "needInformation" | "review" | "information" | "found" | "unavailable" | "compared" | "reviewNext" | "relatedRecords" | "checklist" | "cannot" | "preparation" | "preparationDetail" | "ready" | "moreInfo" | "noAction", string>;
  packet: Record<"header" | "subtitle" | "prepared" | "draft" | "failed" | "preparedMessage" | "savedMessage" | "compared" | "supporting" | "notes" | "request" | "preparing" | "safetyTitle" | "safetyDetail" | "noPacket" | "noPacketDetail", string>;
  timeline: Record<"header" | "subtitle" | "empty" | "reviewPacket" | "continuePreparation" | "back", string>;
  parcel: Record<"header" | "subtitle" | "mappedParcel" | "mapLoading" | "mapUnavailable" | "mapBackgroundUnavailable" | "identity" | "geometry" | "calculatedArea" | "squareMeters" | "hectares" | "acres" | "source" | "provenance" | "historicalArea" | "surveyArea" | "district" | "circle" | "notAvailable" | "emptyTitle" | "emptyDetail" | "safetyTitle" | "safetyDetail" | "calculatedFromGeometry", string>;
  common: Record<"extracted" | "inspect" | "progress" | "steady" | "surveyRecord" | "khataKhesra" | "notAdded" | "currentState", string>;
};

const en: Translation = {
  nav: { home: "Home", dashboard: "My case", documents: "Documents", family: "Family", verification: "Check records", survey: "Survey record", parcel: "Parcel map", official: "Record lookup", earth: "Earth context", action: "Next step", timeline: "Timeline" },
  notice: "Independent prototype · Synthetic demo data only · Not legal advice or a government portal",
  footer: "© 2026 BhoomiCheck · Independent prototype · No real government records are used.",
  cta: { check: "Check My Land Record", how: "See How It Works", review: "Review survey record", continue: "Continue", back: "Back to case summary", close: "Close", save: "Save draft", preparePacket: "Prepare review packet", readyForReview: "Mark ready for review", exploreDemo: "Explore demo case", resetDemo: "Reset demo case", viewControl: "View control case" },
  labels: { synthetic: "Synthetic demo", viewDetails: "View details", confidence: "Confidence", evidence: "Evidence", backToCase: "Back to my case", mock: "Mock only — nothing will be submitted", source: "Source", notAvailable: "Not available", optional: "Optional", caseHeader: "Your land case", skip: "Skip to content", homeLabel: "BhoomiCheck home", primaryNav: "Primary navigation", caseNav: "Case sections", contextNav: "Evidence and context", chooseLanguage: "Choose language" },
  caseStates: { loading: "Loading your synthetic case…", notFoundTitle: "Case not found", notFoundDetail: "This synthetic case does not exist. Choose a demo case or create a new one.", errorTitle: "We could not load this section", errorDetail: "Please try again. Your case has not been changed.", retry: "Try again" },
  home: { eyebrow: "Land record assistance, made understandable", title: "Understand your land record before you act.", lead: "BhoomiCheck uses AI to suggest fields from synthetic records, then compares them with deterministic checks and traceable evidence.", safety: "Independent synthetic prototype for learning and preparation only. BhoomiCheck does not determine legal ownership.", start: "A clearer starting point", step1: "Open the demo case", step2: "Review traceable synthetic records", step3: "See deterministic possible differences", step4: "Choose a careful next step", forWho: "Who this is for", forWhoTitle: "For families making sense of a land-survey case.", forWhoDetail: "Old records, Khata (खाता) and Khesra (खेसरा) numbers, family details, and survey papers can be hard to compare. This prototype gives you one calm place to understand them.", does: "What BhoomiCheck does", doesDetail: "It organizes synthetic records, highlights potential inconsistencies, and explains information in plain language.", doesNot: "What it does not do", doesNotDetail: "It is not a government service, does not use real records, and does not make legal decisions.", howTitle: "One simple path, at your pace.", createTitle: "Create a synthetic case", createDetail: "Add only clearly labelled synthetic details.", documentsTitle: "Inspect traceable records", documentsDetail: "Use clearly labelled synthetic demo documents and quoted evidence.", verifyTitle: "Review deterministic checks", verifyDetail: "See evidence-backed possible differences and a clear explanation." },
  create: { step: "Step 1 of 5", title: "Start with the details you know", intro: "You can add more later. Use fictional or synthetic information only in this prototype.", location: "Land location", district: "District", circle: "Circle", village: "Mauza (मौजा) or village", record: "Land record", khata: "Synthetic Khata (खाता) ID", khataHelp: "Use a fictional ID beginning with DEMO-.", khesra: "Khesra (खेसरा) number", nickname: "Case nickname", required: "Please fill in the fields marked required.", missing: "Please fill in the fields marked required.", invalidKhata: "Use a synthetic Khata ID beginning with DEMO-, for example DEMO-128.", serverError: "We could not create your synthetic case. Please try again.", creating: "Creating your case…", submit: "Create synthetic case", safety: "Nothing is sent to a government system. This creates a local synthetic demo case.", districtPlaceholder: "For example, Demo District", circlePlaceholder: "For example, Demo Circle", villagePlaceholder: "For example, Example Mauza", khataPlaceholder: "For example, DEMO-128", khesraPlaceholder: "For example, DEMO-456", nicknamePlaceholder: "For example, My synthetic land case" },
  dashboard: { surveyStage: "Survey stage", surveyDetail: "Review the record before selecting any next action.", openSurvey: "Open survey record", landSummary: "Land summary", noParcel: "No parcel yet", addLand: "Add land information when ready.", recordedDetails: "See recorded details", parcelIntelligence: "View parcel map", familySummary: "Family summary", peopleNoted: "people noted", familyAvailable: "Relationships are available to review.", noFamily: "No family information added yet.", viewFamily: "View family information", prepareNext: "Prepare next", differences: "possible differences to review", continuePreparing: "Continue preparing your record references", potentialIssues: "Potential issues", needAttention: "items need your attention", noDifferences: "No possible differences found", allChecks: "View all checks", documents: "Documents", recordsPlace: "Your records in one place", viewAll: "View all", attention: "What needs attention", attentionDetail: "Review the available comparisons before deciding what to prepare next.", evidenceContext: "Evidence and context", evidenceContextDetail: "Keep supporting records and contextual views together. Each source has its own limits." },
  documents: { header: "Your documents", subtitle: "Use only the bundled synthetic fixtures in this prototype.", add: "Add a synthetic document", choose: "Choose a demo record to add", fixturesNotice: "Synthetic fixtures only. No real documents are accepted or sent anywhere.", noDocuments: "No documents added", noDocumentsDetail: "Choose a synthetic fixture above to start.", source: "Synthetic source document", extraction: "AI-assisted extraction", suggested: "Suggested fields", extracting: "Extracting…", runExtraction: "Run AI extraction", extractionNotice: "Informational suggestions only. Confidence describes extraction clarity, not ownership, legal validity, or government verification. Check every value against its quoted source evidence.", extractionFailure: "We could not extract fields from this synthetic document. Please try again.", extractionConfidence: "extraction confidence", close: "Close" },
  family: { header: "Family information", subtitle: "A simple view of relationships mentioned in your synthetic records.", relationship: "relationship noted", emptyTitle: "No family information yet", emptyDetail: "Add synthetic family information when it is available.", check: "What to check", checkDetail: "This is a summary of stated relationships, not a decision about inheritance or ownership. Review the source information before relying on it." },
  survey: { header: "Survey record", subtitle: "A citizen-friendly view of a synthetic Khanapuri Parcha (खानापुरी पर्चा).", emptyTitle: "No survey record yet", emptyDetail: "Add a synthetic survey record when it is available.", recordTitle: "Synthetic Khanapuri Parcha (खानापुरी पर्चा) review", recordDetail: "Synthetic demonstration record — not a government record.", compare: "Compare with my records", comparisonFound: "What the deterministic comparison found", noDifferences: "No possible differences found", noDifferencesDetail: "BhoomiCheck does not have a potential discrepancy to prepare from this record.", reviewNext: "What should I review next?", reviewEvidence: "Review all evidence", recordedName: "Recorded name", recordedArea: "Recorded area", mapReference: "Map reference", stage: "Survey stage" },
  verification: { pageTitle: "Check your records", pageSubtitle: "BhoomiCheck compares available synthetic records. It does not make legal conclusions.", summaryTitle: "Record comparison summary", passed: "No obvious discrepancy found", potentialIssue: "Possible mismatch found", insufficientEvidence: "Not enough comparable information", passDetail: "No obvious discrepancy was found in the compared records.", potentialIssueDetail: "A possible mismatch was found. Review the records below.", insufficientEvidenceDetail: "Not enough comparable information is available to make this check.", whyFlagged: "Why was this flagged?", comparedRecords: "Compared records", recordA: "Record A", recordB: "Record B", source: "Source", reference: "Comparison reference", notAvailable: "Not available in the compared records", caution: "Important to know", cautionDetail: "A possible mismatch is not proof that a record is incorrect. BhoomiCheck does not establish legal ownership. Verify important decisions against appropriate official records and processes.", allChecks: "All comparison checks", reviewDifferences: "Review the records that differ", allChecksTitle: "Every result, with its comparison reference", noResultsTitle: "No comparison results yet", noResultsDetail: "BhoomiCheck needs comparable synthetic records before it can show a check.", overviewLink: "Review comparisons" },
  guidance: { header: "Prepare your next review", subtitle: "Use this guide to compare records and get organised. Nothing is submitted from BhoomiCheck.", emptyTitle: "No preparation guidance yet", emptyDetail: "Add comparable synthetic records before BhoomiCheck can suggest what to review.", prepare: "Prepare for review", reviewFirst: "items to review first", noUrgency: "No urgent comparison review suggested", startReview: "Start with the possible differences below, then keep the related synthetic records together.", needInformation: "The available records need more comparable information before BhoomiCheck can assess the checks.", review: "Review", information: "Information", found: "What BhoomiCheck found", unavailable: "The related comparison result is not available.", compared: "Compared", reviewNext: "What you can review next", relatedRecords: "Related existing records", checklist: "Preparation checklist", cannot: "What BhoomiCheck cannot do", preparation: "Preparation, not submission", preparationDetail: "Use these local checklist notes to prepare for your own review. BhoomiCheck does not file, submit, or correct any government record.", ready: "Ready to review", moreInfo: "More information needed", noAction: "No immediate action" },
  packet: { header: "Prepare review packet", subtitle: "Draft for review — not submitted to any government system.", prepared: "Prepared for review", draft: "Draft for review", failed: "This review packet could not be prepared.", preparedMessage: "Prepared for review. This packet has not been submitted to any government system.", savedMessage: "Draft saved locally in this synthetic case.", compared: "Compared values", supporting: "Supporting synthetic records", notes: "Citizen notes", request: "Clarification request", preparing: "Preparing your synthetic draft…", safetyTitle: "Preparation only", safetyDetail: "This packet is a synthetic review aid. BhoomiCheck does not submit it, determine ownership, or correct any government record.", noPacket: "No review packet yet", noPacketDetail: "Choose a possible difference first to prepare a synthetic review packet." },
  timeline: { header: "Your case timeline", subtitle: "Only recorded case activity and current available state are shown here.", empty: "No case activity has been recorded yet.", reviewPacket: "Review prepared packet", continuePreparation: "Continue preparation", back: "Back to case summary" },
  parcel: { header: "Parcel intelligence", subtitle: "A synthetic mapped-boundary view for context only.", mappedParcel: "Mapped parcel", mapLoading: "Loading synthetic parcel map…", mapUnavailable: "The map is unavailable, but the parcel details below remain available.", mapBackgroundUnavailable: "Map background unavailable. The synthetic parcel boundary remains available.", identity: "Parcel identity", geometry: "Mapped geometry", calculatedArea: "Calculated area", squareMeters: "Square metres", hectares: "Hectares", acres: "Acres", source: "Geometry source", provenance: "Geometry provenance", historicalArea: "Historical/document area", surveyArea: "Survey/Parcha area", district: "District", circle: "Circle", notAvailable: "Not available", emptyTitle: "No mapped parcel boundary yet", emptyDetail: "No mapped parcel boundary is available for this synthetic case yet.", safetyTitle: "Synthetic boundary only", safetyDetail: "This mapped boundary is synthetic demonstration data. It is not an official cadastral boundary and does not prove ownership, possession, or encroachment.", calculatedFromGeometry: "Calculated from mapped geometry" },
  common: { extracted: "Extracted", inspect: "Inspect fields", progress: "steps complete", steady: "You are making steady progress.", surveyRecord: "Survey record", khataKhesra: "Khata / Khesra", notAdded: "Not added", currentState: "Current case state" }
};

const hi: Translation = {
  nav: { home: "होम", dashboard: "मेरा केस", documents: "दस्तावेज़", family: "परिवार", verification: "रिकॉर्ड जाँचें", survey: "सर्वे रिकॉर्ड", parcel: "भू-खंड मानचित्र", official: "आधिकारिक रिकॉर्ड खोज", earth: "पृथ्वी संदर्भ", action: "अगला कदम", timeline: "समयरेखा" },
  notice: "स्वतंत्र प्रोटोटाइप · केवल सिंथेटिक डेमो डेटा · कानूनी सलाह या सरकारी पोर्टल नहीं",
  footer: "© 2026 BhoomiCheck · स्वतंत्र प्रोटोटाइप · किसी वास्तविक सरकारी रिकॉर्ड का उपयोग नहीं किया जाता।",
  cta: { check: "भूमि रिकॉर्ड जाँचें", how: "कैसे काम करता है", review: "सर्वे रिकॉर्ड देखें", continue: "आगे बढ़ें", back: "केस सारांश पर लौटें", close: "बंद करें", save: "ड्राफ्ट सहेजें", preparePacket: "समीक्षा पैकेट तैयार करें", readyForReview: "समीक्षा के लिए तैयार चिह्नित करें", exploreDemo: "डेमो केस देखें", resetDemo: "डेमो केस रीसेट करें", viewControl: "कंट्रोल केस देखें" },
  labels: { synthetic: "सिंथेटिक डेमो", viewDetails: "विवरण देखें", confidence: "विश्वास", evidence: "साक्ष्य", backToCase: "मेरे केस पर लौटें", mock: "केवल मॉक — कुछ भी जमा नहीं होगा", source: "स्रोत", notAvailable: "उपलब्ध नहीं", optional: "वैकल्पिक", caseHeader: "आपका भूमि केस", skip: "मुख्य सामग्री पर जाएँ", homeLabel: "BhoomiCheck होम", primaryNav: "मुख्य नेविगेशन", caseNav: "केस अनुभाग", contextNav: "साक्ष्य और संदर्भ", chooseLanguage: "भाषा बदलें" },
  caseStates: { loading: "आपका सिंथेटिक केस लोड हो रहा है…", notFoundTitle: "केस नहीं मिला", notFoundDetail: "यह सिंथेटिक केस मौजूद नहीं है। डेमो केस चुनें या नया केस बनाएं।", errorTitle: "यह अनुभाग लोड नहीं हो सका", errorDetail: "कृपया पुनः प्रयास करें। आपके केस में कोई बदलाव नहीं हुआ है।", retry: "पुनः प्रयास करें" },
  home: { eyebrow: "भूमि रिकॉर्ड सहायता, सरल भाषा में", title: "अपना भूमि रिकॉर्ड समझें, कोई कदम उठाने से पहले।", lead: "BhoomiCheck सिंथेटिक रिकॉर्ड से फ़ील्ड सुझाने के लिए AI का उपयोग करता है, फिर निर्धारित जाँचों और स्रोत-साक्ष्य के साथ उनकी तुलना करता है।", safety: "सीखने और तैयारी के लिए स्वतंत्र सिंथेटिक प्रोटोटाइप। BhoomiCheck कानूनी स्वामित्व तय नहीं करता।", start: "एक स्पष्ट शुरुआत", step1: "डेमो केस खोलें", step2: "स्रोत-साक्ष्य वाले सिंथेटिक रिकॉर्ड देखें", step3: "निर्धारित संभावित अंतर देखें", step4: "सावधानी से अगला कदम चुनें", forWho: "यह किसके लिए है", forWhoTitle: "भूमि-सर्वे केस समझने वाले परिवारों के लिए।", forWhoDetail: "पुराने रिकॉर्ड, Khata (खाता) और Khesra (खेसरा) नंबर, पारिवारिक विवरण और सर्वे कागज़ों की तुलना कठिन हो सकती है। यह प्रोटोटाइप उन्हें समझने के लिए एक शांत जगह देता है।", does: "BhoomiCheck क्या करता है", doesDetail: "यह सिंथेटिक रिकॉर्ड व्यवस्थित करता है, संभावित असंगतियाँ दिखाता है और सरल भाषा में जानकारी समझाता है।", doesNot: "यह क्या नहीं करता", doesNotDetail: "यह सरकारी सेवा नहीं है, वास्तविक रिकॉर्ड का उपयोग नहीं करता और कानूनी निर्णय नहीं देता।", howTitle: "एक सरल रास्ता, आपकी गति से।", createTitle: "सिंथेटिक केस बनाएं", createDetail: "केवल स्पष्ट रूप से चिन्हित सिंथेटिक विवरण जोड़ें।", documentsTitle: "स्रोत-साक्ष्य वाले रिकॉर्ड देखें", documentsDetail: "स्पष्ट रूप से चिन्हित सिंथेटिक डेमो दस्तावेज़ और उद्धृत साक्ष्य उपयोग करें।", verifyTitle: "निर्धारित जाँचें देखें", verifyDetail: "साक्ष्य-आधारित संभावित अंतर और स्पष्ट व्याख्या देखें।" },
  create: { step: "5 में से चरण 1", title: "जो विवरण आप जानते हैं, वहीं से शुरू करें", intro: "आप बाद में और जानकारी जोड़ सकते हैं। इस प्रोटोटाइप में केवल काल्पनिक या सिंथेटिक जानकारी उपयोग करें।", location: "भूमि स्थान", district: "ज़िला", circle: "अंचल", village: "Mauza (मौजा) या गाँव", record: "भूमि रिकॉर्ड", khata: "सिंथेटिक Khata (खाता) ID", khataHelp: "DEMO- से शुरू होने वाली काल्पनिक ID उपयोग करें।", khesra: "Khesra (खेसरा) नंबर", nickname: "केस का नाम", required: "कृपया आवश्यक चिन्हित सभी फ़ील्ड भरें।", missing: "कृपया आवश्यक चिन्हित सभी फ़ील्ड भरें।", invalidKhata: "DEMO- से शुरू होने वाली सिंथेटिक Khata ID उपयोग करें, जैसे DEMO-128।", serverError: "आपका सिंथेटिक केस नहीं बनाया जा सका। कृपया पुनः प्रयास करें।", creating: "केस बनाया जा रहा है…", submit: "सिंथेटिक केस बनाएं", safety: "किसी सरकारी सिस्टम को कुछ नहीं भेजा जाता। इससे स्थानीय सिंथेटिक डेमो केस बनता है।", districtPlaceholder: "उदाहरण: Demo District", circlePlaceholder: "उदाहरण: Demo Circle", villagePlaceholder: "उदाहरण: Example Mauza", khataPlaceholder: "उदाहरण: DEMO-128", khesraPlaceholder: "उदाहरण: DEMO-456", nicknamePlaceholder: "उदाहरण: मेरा सिंथेटिक भूमि केस" },
  dashboard: { surveyStage: "सर्वे चरण", surveyDetail: "कोई अगला कदम चुनने से पहले रिकॉर्ड देखें।", openSurvey: "सर्वे रिकॉर्ड खोलें", landSummary: "भूमि सारांश", noParcel: "अभी कोई प्लॉट नहीं", addLand: "तैयार होने पर भूमि जानकारी जोड़ें।", recordedDetails: "दर्ज विवरण देखें", parcelIntelligence: "भू-खंड मानचित्र देखें", familySummary: "परिवार सारांश", peopleNoted: "लोग दर्ज हैं", familyAvailable: "रिश्ते समीक्षा के लिए उपलब्ध हैं।", noFamily: "अभी परिवार की जानकारी नहीं जोड़ी गई।", viewFamily: "परिवार की जानकारी देखें", prepareNext: "अगली तैयारी", differences: "संभावित अंतर की समीक्षा करें", continuePreparing: "अपने रिकॉर्ड संदर्भ तैयार करते रहें", potentialIssues: "संभावित मुद्दे", needAttention: "वस्तुओं पर आपका ध्यान चाहिए", noDifferences: "कोई संभावित अंतर नहीं मिला", allChecks: "सभी जाँचें देखें", documents: "दस्तावेज़", recordsPlace: "आपके रिकॉर्ड एक जगह", viewAll: "सभी देखें", attention: "किन बातों पर ध्यान दें", attentionDetail: "अगली तैयारी तय करने से पहले उपलब्ध तुलनाओं की समीक्षा करें।", evidenceContext: "साक्ष्य और संदर्भ", evidenceContextDetail: "सहायक रिकॉर्ड और संदर्भ दृश्य साथ रखें। हर स्रोत की अपनी सीमाएं हैं।" },
  documents: { header: "आपके दस्तावेज़", subtitle: "इस प्रोटोटाइप में केवल साथ दिए गए सिंथेटिक नमूने उपयोग करें।", add: "सिंथेटिक दस्तावेज़ जोड़ें", choose: "जोड़ने के लिए डेमो रिकॉर्ड चुनें", fixturesNotice: "केवल सिंथेटिक नमूने। कोई वास्तविक दस्तावेज़ स्वीकार या कहीं भेजा नहीं जाता।", noDocuments: "कोई दस्तावेज़ नहीं जोड़ा गया", noDocumentsDetail: "शुरू करने के लिए ऊपर एक सिंथेटिक नमूना चुनें।", source: "सिंथेटिक स्रोत दस्तावेज़", extraction: "AI-सहायित निष्कर्षण", suggested: "सुझाए गए फ़ील्ड", extracting: "निष्कर्षण हो रहा है…", runExtraction: "AI निष्कर्षण चलाएं", extractionNotice: "ये केवल जानकारी के लिए सुझाव हैं। विश्वास निष्कर्षण की स्पष्टता बताता है, स्वामित्व, कानूनी वैधता या सरकारी सत्यापन नहीं। हर मूल्य को उद्धृत स्रोत साक्ष्य से जाँचें।", extractionFailure: "इस सिंथेटिक दस्तावेज़ से फ़ील्ड नहीं निकाले जा सके। कृपया पुनः प्रयास करें।", extractionConfidence: "निष्कर्षण विश्वास", close: "बंद करें" },
  family: { header: "परिवार की जानकारी", subtitle: "आपके सिंथेटिक रिकॉर्ड में दर्ज रिश्तों का सरल दृश्य।", relationship: "रिश्ता दर्ज है", emptyTitle: "अभी परिवार की जानकारी नहीं", emptyDetail: "उपलब्ध होने पर सिंथेटिक परिवार जानकारी जोड़ें।", check: "क्या जाँचें", checkDetail: "यह बताए गए रिश्तों का सारांश है, विरासत या स्वामित्व का निर्णय नहीं। भरोसा करने से पहले स्रोत जानकारी देखें।" },
  survey: { header: "सर्वे रिकॉर्ड", subtitle: "सिंथेटिक Khanapuri Parcha (खानापुरी पर्चा) का नागरिक-अनुकूल दृश्य।", emptyTitle: "अभी कोई सर्वे रिकॉर्ड नहीं", emptyDetail: "उपलब्ध होने पर सिंथेटिक सर्वे रिकॉर्ड जोड़ें।", recordTitle: "सिंथेटिक Khanapuri Parcha (खानापुरी पर्चा) समीक्षा", recordDetail: "सिंथेटिक प्रदर्शन रिकॉर्ड — सरकारी रिकॉर्ड नहीं।", compare: "मेरे रिकॉर्ड से तुलना करें", comparisonFound: "निर्धारित तुलना में क्या मिला", noDifferences: "कोई संभावित अंतर नहीं मिला", noDifferencesDetail: "BhoomiCheck के पास इस रिकॉर्ड से तैयार करने के लिए संभावित असंगति नहीं है।", reviewNext: "मुझे आगे क्या देखना चाहिए?", reviewEvidence: "सभी साक्ष्य देखें", recordedName: "दर्ज नाम", recordedArea: "दर्ज क्षेत्रफल", mapReference: "नक्शा संदर्भ", stage: "सर्वे चरण" },
  verification: { pageTitle: "अपने रिकॉर्ड जाँचें", pageSubtitle: "BhoomiCheck उपलब्ध सिंथेटिक रिकॉर्ड की तुलना करता है। यह कानूनी निष्कर्ष नहीं देता।", summaryTitle: "रिकॉर्ड तुलना सारांश", passed: "कोई स्पष्ट असंगति नहीं मिली", potentialIssue: "संभावित अंतर मिला", insufficientEvidence: "तुलना के लिए पर्याप्त जानकारी नहीं", passDetail: "तुलना किए गए रिकॉर्ड में कोई स्पष्ट अंतर नहीं मिला।", potentialIssueDetail: "संभावित अंतर मिला। नीचे दिए रिकॉर्ड देखें।", insufficientEvidenceDetail: "इस जाँच के लिए पर्याप्त तुलनीय जानकारी उपलब्ध नहीं है।", whyFlagged: "इसे क्यों चिह्नित किया गया?", comparedRecords: "तुलना किए गए रिकॉर्ड", recordA: "रिकॉर्ड A", recordB: "रिकॉर्ड B", source: "स्रोत", reference: "तुलना संदर्भ", notAvailable: "तुलना किए गए रिकॉर्ड में उपलब्ध नहीं", caution: "ध्यान रखें", cautionDetail: "संभावित अंतर यह साबित नहीं करता कि कोई रिकॉर्ड गलत है। BhoomiCheck कानूनी स्वामित्व तय नहीं करता। महत्वपूर्ण निर्णयों की जाँच उचित आधिकारिक रिकॉर्ड और प्रक्रियाओं से करें।", allChecks: "सभी तुलना जाँच", reviewDifferences: "अलग रिकॉर्ड की समीक्षा करें", allChecksTitle: "हर परिणाम और उसका तुलना संदर्भ", noResultsTitle: "अभी कोई तुलना परिणाम नहीं", noResultsDetail: "जाँच दिखाने के लिए BhoomiCheck को तुलनीय सिंथेटिक रिकॉर्ड चाहिए।", overviewLink: "तुलना देखें" },
  guidance: { header: "अपनी अगली समीक्षा तैयार करें", subtitle: "रिकॉर्ड की तुलना और तैयारी के लिए इस मार्गदर्शिका का उपयोग करें। BhoomiCheck से कुछ भी जमा नहीं होता।", emptyTitle: "अभी कोई तैयारी मार्गदर्शन नहीं", emptyDetail: "BhoomiCheck क्या जाँचना है बताने से पहले तुलनीय सिंथेटिक रिकॉर्ड जोड़ें।", prepare: "समीक्षा की तैयारी", reviewFirst: "वस्तुओं की पहले समीक्षा करें", noUrgency: "तुलना की तुरंत समीक्षा का सुझाव नहीं", startReview: "नीचे दिए संभावित अंतरों से शुरू करें, फिर संबंधित सिंथेटिक रिकॉर्ड साथ रखें।", needInformation: "उपलब्ध रिकॉर्ड में तुलना के लिए और जानकारी चाहिए, तब BhoomiCheck जाँच का आकलन कर सकेगा।", review: "समीक्षा", information: "जानकारी", found: "BhoomiCheck को क्या मिला", unavailable: "संबंधित तुलना परिणाम उपलब्ध नहीं है।", compared: "तुलना", reviewNext: "आप आगे क्या देख सकते हैं", relatedRecords: "संबंधित उपलब्ध रिकॉर्ड", checklist: "तैयारी सूची", cannot: "BhoomiCheck क्या नहीं कर सकता", preparation: "तैयारी, जमा करना नहीं", preparationDetail: "अपनी समीक्षा की तैयारी के लिए इन स्थानीय चेकलिस्ट नोट्स का उपयोग करें। BhoomiCheck कोई सरकारी रिकॉर्ड दाखिल, जमा या सही नहीं करता।", ready: "समीक्षा के लिए तैयार", moreInfo: "और जानकारी चाहिए", noAction: "कोई तत्काल कदम नहीं" },
  packet: { header: "समीक्षा पैकेट तैयार करें", subtitle: "समीक्षा के लिए ड्राफ्ट — किसी सरकारी सिस्टम को जमा नहीं किया गया।", prepared: "समीक्षा के लिए तैयार", draft: "समीक्षा के लिए ड्राफ्ट", failed: "यह समीक्षा पैकेट तैयार नहीं हो सका।", preparedMessage: "समीक्षा के लिए तैयार। यह पैकेट किसी सरकारी सिस्टम को जमा नहीं किया गया है।", savedMessage: "ड्राफ्ट इस सिंथेटिक केस में स्थानीय रूप से सहेजा गया।", compared: "तुलना किए गए मूल्य", supporting: "सहायक सिंथेटिक रिकॉर्ड", notes: "नागरिक नोट्स", request: "स्पष्टीकरण अनुरोध", preparing: "आपका सिंथेटिक ड्राफ्ट तैयार हो रहा है…", safetyTitle: "केवल तैयारी", safetyDetail: "यह पैकेट सिंथेटिक समीक्षा सहायक है। BhoomiCheck इसे जमा नहीं करता, स्वामित्व तय नहीं करता, या कोई सरकारी रिकॉर्ड सही नहीं करता।", noPacket: "अभी कोई समीक्षा पैकेट नहीं", noPacketDetail: "सिंथेटिक समीक्षा पैकेट तैयार करने के लिए पहले संभावित अंतर चुनें।" },
  timeline: { header: "आपके केस की समयरेखा", subtitle: "यहाँ केवल दर्ज केस गतिविधि और वर्तमान उपलब्ध स्थिति दिखाई जाती है।", empty: "अभी कोई केस गतिविधि दर्ज नहीं है।", reviewPacket: "तैयार पैकेट देखें", continuePreparation: "तैयारी जारी रखें", back: "केस सारांश पर लौटें" },
  parcel: { header: "भू-खंड जानकारी", subtitle: "केवल संदर्भ के लिए कृत्रिम मानचित्रित भू-सीमा दृश्य।", mappedParcel: "मानचित्रित भू-खंड", mapLoading: "कृत्रिम भू-खंड मानचित्र लोड हो रहा है…", mapUnavailable: "मानचित्र उपलब्ध नहीं है, लेकिन नीचे भू-खंड विवरण उपलब्ध हैं।", mapBackgroundUnavailable: "मानचित्र पृष्ठभूमि उपलब्ध नहीं है। कृत्रिम भू-खंड सीमा फिर भी उपलब्ध है।", identity: "भू-खंड पहचान", geometry: "मानचित्रित ज्यामिति", calculatedArea: "गणना किया गया क्षेत्रफल", squareMeters: "वर्ग मीटर", hectares: "हेक्टेयर", acres: "एकड़", source: "मानचित्र स्रोत", provenance: "ज्यामिति स्रोत", historicalArea: "ऐतिहासिक/दस्तावेज़ क्षेत्रफल", surveyArea: "सर्वे/पर्चा क्षेत्रफल", district: "जिला", circle: "अंचल", notAvailable: "उपलब्ध नहीं", emptyTitle: "अभी कोई मानचित्रित भू-सीमा नहीं", emptyDetail: "इस सिंथेटिक केस के लिए अभी कोई मानचित्रित भू-सीमा उपलब्ध नहीं है।", safetyTitle: "केवल कृत्रिम भू-सीमा", safetyDetail: "यह मानचित्रित सीमा कृत्रिम प्रदर्शन डेटा है। यह आधिकारिक भू-अभिलेख सीमा नहीं है और स्वामित्व, कब्जे या अतिक्रमण का प्रमाण नहीं है।", calculatedFromGeometry: "मानचित्रित ज्यामिति से गणना" },
  common: { extracted: "निकाला गया", inspect: "फ़ील्ड देखें", progress: "चरण पूरे", steady: "आप लगातार प्रगति कर रहे हैं।", surveyRecord: "सर्वे रिकॉर्ड", khataKhesra: "Khata / Khesra", notAdded: "नहीं जोड़ा गया", currentState: "वर्तमान केस स्थिति" }
};

export const copy: Record<Locale, Translation> = { en, hi };
export const t = (locale: Locale = "en") => copy[locale];

export function localizedPeopleCount(locale: Locale, count: number) {
  if (locale === "hi") return count === 1 ? "1 व्यक्ति दर्ज है" : `${count} लोग दर्ज हैं`;
  return count === 1 ? "1 person noted" : `${count} people noted`;
}

export function localizedExperiencePresentation(locale: Locale) {
  const hi = locale === "hi";
  return {
    traceability: hi ? "ट्रेसबिलिटी और स्रोत विवरण" : "Traceability and source details",
    documents: {
      evidence: hi ? "केस साक्ष्य" : "Case evidence",
      core: hi ? "मुख्य रिकॉर्ड" : "Core records",
      coreDetail: hi ? "इस केस की तुलना और तैयारी में उपयोग होने वाले सिंथेटिक रिकॉर्ड।" : "Synthetic records used to compare and prepare this case.",
      supporting: hi ? "सहायक सामग्री" : "Supporting material",
      supportingDetail: hi ? "ये वैकल्पिक सिंथेटिक फिक्स्चर हैं; इन्हें मुख्य रिकॉर्ड के साथ न मिलाएं।" : "These optional synthetic fixtures are separate from the core records.",
      addSupporting: hi ? "सहायक सिंथेटिक रिकॉर्ड जोड़ें" : "Add supporting synthetic records",
      safety: hi ? "सभी रिकॉर्ड सिंथेटिक डेमो साक्ष्य हैं — ये आधिकारिक या कानूनी रिकॉर्ड नहीं हैं।" : "All records are synthetic demo evidence — not official or legal records.",
      reviewVerification: hi ? "रिकॉर्ड जाँचें देखें" : "Review verification",
      extractionTraceability: hi ? "निष्कर्षण ट्रेसबिलिटी" : "Extraction traceability",
      sourceRecord: hi ? "स्रोत रिकॉर्ड विवरण" : "Source record details",
    },
    landing: {
      eyebrow: hi ? "खंडित रिकॉर्ड से स्पष्ट तैयारी तक" : "From fragmented records to a clear preparation path",
      title: hi ? "काम करने वाला साक्ष्य-आधारित डेमो" : "A working evidence-led demo",
      document: hi ? "दस्तावेज़ साक्ष्य" : "Document evidence",
      documentDetail: hi ? "सिंथेटिक भूमि रिकॉर्ड व्यवस्थित करें और देखें।" : "Organize and inspect synthetic land records.",
      verification: hi ? "निर्धारित जाँच" : "Deterministic verification",
      verificationDetail: hi ? "AI के कानूनी निर्णय के बिना रिकॉर्ड तथ्यों की तुलना करें।" : "Compare record facts without AI making legal judgments.",
      parcel: hi ? "भू-खंड जानकारी" : "Parcel intelligence",
      parcelDetail: hi ? "ऐतिहासिक, सर्वे और मानचित्रित क्षेत्रफलों की तुलना करें।" : "Compare historical, survey, and mapped areas.",
      guidance: hi ? "मार्गदर्शित तैयारी" : "Guided preparation",
      guidanceDetail: hi ? "कुछ जमा किए बिना अगली समीक्षा समझें।" : "Understand what to review next without submitting anything.",
      demoEvidence: hi ? "डेमो साक्ष्य" : "Demo evidence",
      historical: hi ? "ऐतिहासिक" : "Historical",
      survey: hi ? "सर्वे" : "Survey",
      mapped: hi ? "मानचित्रित" : "Mapped",
      result: hi ? "परिणाम" : "Result",
      resultValue: hi ? "ऐतिहासिक क्षेत्रफल में संभावित अंतर" : "Possible historical-area difference",
    },
    parcel: {
      safety: hi ? "कृत्रिम भू-सीमा — केवल संदर्भ के लिए, आधिकारिक भू-अभिलेख साक्ष्य नहीं।" : "Synthetic parcel boundary — contextual only, not official cadastral evidence.",
      traceability: hi ? "ज्यामिति ट्रेसबिलिटी" : "Geometry traceability",
    },
  };
}

export function localizedOfficialRecordPresentation(locale: Locale) { const hi = locale === "hi"; return { title: hi ? "आधिकारिक रिकॉर्ड खोज" : "Official record lookup", subtitle: hi ? "सभी परिणाम कृत्रिम हैं; कोई लाइव सरकारी रिकॉर्ड नहीं खोजा जाता।" : "All results are synthetic; no live government records are searched.", search: hi ? "कृत्रिम रिकॉर्ड खोजें" : "Search synthetic records", synthetic: hi ? "कृत्रिम आधिकारिक-शैली रिकॉर्ड" : "Synthetic official-style record", loading: hi ? "खोज रहे हैं…" : "Searching…", noMatch: hi ? "इन पहचानों से कोई कृत्रिम रिकॉर्ड मेल नहीं खाता।" : "No synthetic fixture matches these identifiers.", multiple: hi ? "एक से अधिक कृत्रिम रिकॉर्ड मिले।" : "Multiple synthetic records found.", import: hi ? "मामले में जोड़ें" : "Import into case", added: hi ? "रिकॉर्ड मामले में जोड़ा गया।" : "Record added to case.", linked: hi ? "रिकॉर्ड पहले से इस मामले से जुड़ा है।" : "Record already linked to this case.", mismatch: hi ? "यह रिकॉर्ड इस केस की पहचान से मेल नहीं खाता।" : "This record does not match this case identity.", safety: hi ? "यह सरकारी रिकॉर्ड नहीं बदलता, कुछ जमा नहीं करता, स्वामित्व नहीं बदलता और मौजूदा दस्तावेज़ नहीं बदलता।" : "It does not modify government records, submit anything, change ownership, or replace existing documents.", context: hi ? "आधिकारिक-शैली रिकॉर्ड संदर्भ" : "Official-style record context", none: hi ? "कोई कृत्रिम आधिकारिक-शैली रिकॉर्ड लिंक नहीं है।" : "No synthetic official-style record has been linked.", area: hi ? "दर्ज क्षेत्रफल" : "Recorded area", provider: hi ? "प्रदाता" : "Provider", provenance: hi ? "उत्पत्ति" : "Provenance", traceability: hi ? "ट्रेसबिलिटी और स्रोत विवरण" : "Traceability and source details", lookup: hi ? "रिकॉर्ड खोजें" : "Search records" }; }

export function localizedOfficialRecordInspectionPresentation(locale: Locale) {
  const hi = locale === "hi";
  return {
    searchResults: hi ? "कृत्रिम खोज परिणाम" : "Synthetic search results",
    district: hi ? "जिला" : "District",
    circle: hi ? "अंचल" : "Circle",
    mauza: hi ? "मौजा" : "Mauza",
    khata: "Khata",
    khesra: "Khesra",
    holders: hi ? "दर्ज धारक" : "Holder names",
    recordType: hi ? "रिकॉर्ड प्रकार" : "Record type",
    surveyStage: hi ? "सर्वे चरण" : "Survey stage",
    remarks: hi ? "टिप्पणियां" : "Remarks",
    source: hi ? "स्रोत संदर्भ" : "Source reference",
    traceability: hi ? "ट्रेसबिलिटी और स्रोत विवरण" : "Traceability and source details",
    identity: hi ? "पहचान मिलान" : "Identity match",
    authority: hi ? "प्राधिकार स्थिति" : "Authority status",
    notAuthoritative: hi ? "यह कृत्रिम रिकॉर्ड आधिकारिक नहीं है।" : "This synthetic record is not authoritative.",
    exact: hi ? "केस की पहचान से पूरा मिलान" : "Exact match with this case identity",
    partial: hi ? "केस की पहचान से आंशिक मिलान" : "Partial match with this case identity",
    validation: hi ? "जिला, अंचल, मौजा और Khata या Khesra भरें।" : "Provide district, circle, mauza, and either Khata or Khesra.",
    serverError: hi ? "कृत्रिम रिकॉर्ड अभी नहीं खोजे जा सके। कृपया फिर कोशिश करें।" : "Synthetic records could not be searched right now. Please try again.",
    importError: hi ? "कृत्रिम रिकॉर्ड मामले में नहीं जोड़ा जा सका। कृपया फिर कोशिश करें।" : "The synthetic record could not be added to the case. Please try again.",
    adding: hi ? "मामले में जोड़ा जा रहा है…" : "Adding to case…",
    notLive: hi ? "यह लाइव सरकारी सिस्टम से प्राप्त नहीं किया गया है।" : "Not retrieved from a live government system.",
    importSafety: hi ? "इसे मामले में जोड़ने से सरकारी रिकॉर्ड नहीं बदलते, किसी प्राधिकरण को कुछ जमा नहीं होता, स्वामित्व नहीं बदलता और मौजूदा दस्तावेज़ नहीं बदलते।" : "Adding this record does not modify government records, submit anything to authorities, change ownership, or replace existing documents.",
  };
}

export function localizedOfficialRecordDocumentsPresentation(locale: Locale) {
  const hi = locale === "hi";
  return {
    title: hi ? "आयात किए गए रिकॉर्ड" : "Imported records",
    traceability: hi ? "ट्रेसबिलिटी और स्रोत विवरण" : "Traceability and source details",
    loading: hi ? "आयात किए गए रिकॉर्ड लोड हो रहे हैं…" : "Loading imported records…",
    unavailable: hi ? "आयात किए गए रिकॉर्ड अभी नहीं दिखाए जा सके। कृपया फिर कोशिश करें।" : "Imported records could not be shown right now. Please try again.",
    view: hi ? "रिकॉर्ड देखें" : "View record",
    source: hi ? "स्रोत" : "Source",
    identity: hi ? "पहचान मिलान" : "Identity match",
    notAuthoritative: hi ? "यह कृत्रिम रिकॉर्ड आधिकारिक नहीं है।" : "This synthetic record is not authoritative.",
  };
}

export function localizedEarthObservationPresentation(locale: Locale) {
  const hi = locale === "hi";
  return {
    header: hi ? "पृथ्वी अवलोकन संदर्भ" : "Earth observation context",
    subtitle: hi ? "दो सिंथेटिक संदर्भ छवियों की सावधानीपूर्ण, गैर-कानूनी तुलना।" : "A careful, non-legal comparison of two synthetic context images.",
    teaserTitle: hi ? "पृथ्वी अवलोकन संदर्भ" : "Earth observation context",
    teaserDetail: hi ? "दो सिंथेटिक छवियों में संदर्भ परिवर्तन की तुलना करें।" : "Compare context change across two synthetic images.",
    view: hi ? "परिवर्तन संदर्भ देखें" : "View change context",
    synthetic: hi ? "सिंथेटिक संदर्भ छवियां" : "Synthetic contextual imagery",
    earlier: hi ? "पहले का अवलोकन" : "Earlier observation",
    later: hi ? "बाद का अवलोकन" : "Later observation",
    provider: hi ? "प्रदाता" : "Provider",
    provenance: hi ? "उत्पत्ति" : "Provenance",
    quality: hi ? "संदर्भ गुणवत्ता" : "Context quality",
    source: hi ? "स्रोत संदर्भ" : "Source reference",
    indicators: hi ? "संदर्भ संकेतक" : "Context indicators",
    earlierValue: hi ? "पहले" : "Earlier",
    laterValue: hi ? "बाद में" : "Later",
    change: hi ? "परिवर्तन" : "Change",
    vegetation: hi ? "वनस्पति संदर्भ" : "Vegetation context",
    builtUp: hi ? "निर्मित-सतह संदर्भ" : "Built-up context",
    surface: hi ? "सतह परिवर्तन" : "Surface change",
    water: hi ? "जल संदर्भ" : "Water context",
    stable: hi ? "स्थिर" : "Stable",
    small: hi ? "छोटा परिवर्तन" : "Small change",
    noticeable: hi ? "ध्यान देने योग्य परिवर्तन" : "Noticeable change",
    insufficient: hi ? "पर्याप्त साक्ष्य नहीं" : "Insufficient evidence",
    overall: hi ? "समग्र संदर्भ सारांश" : "Overall context summary",
    heroSummary: hi ? "दो सिंथेटिक अवलोकन तिथियों के बीच, भू-खंड संदर्भ में वनस्पति की उल्लेखनीय कमी और निर्मित सतह में वृद्धि दिखाई देती है।" : "Between the two synthetic observation dates, the parcel context shows a noticeable reduction in vegetation and an increase in built-up surface.",
    controlSummary: hi ? "दो सिंथेटिक अवलोकन तिथियों में कोई बड़ा संदर्भ परिवर्तन नहीं दिखता।" : "The two synthetic observation dates show no major contextual change.",
    insufficientSummary: hi ? "इस केस के लिए दो तुलनीय सिंथेटिक संदर्भ छवियां उपलब्ध नहीं हैं। BhoomiCheck कोई निष्कर्ष नहीं बनाता।" : "Two comparable synthetic context images are not available for this case. BhoomiCheck does not infer a change.",
    explanationVegetation: hi ? "वनस्पति संदर्भ में यह परिवर्तन केवल सिंथेटिक प्रदर्शन संकेतक है।" : "This vegetation-context change is a synthetic demonstration indicator only.",
    explanationBuiltUp: hi ? "निर्मित-सतह संदर्भ में यह परिवर्तन केवल सिंथेटिक प्रदर्शन संकेतक है।" : "This built-up-context change is a synthetic demonstration indicator only.",
    explanationInsufficient: hi ? "तुलना के लिए आवश्यक सिंथेटिक संदर्भ जानकारी उपलब्ध नहीं है।" : "The synthetic context information needed for comparison is unavailable.",
    safetyTitle: hi ? "न भू-अभिलेखीय, न कानूनी साक्ष्य" : "Not cadastral or legal evidence",
    safetyDetail: hi ? "ये सिंथेटिक संदर्भ छवियां हैं। दिखाए गए परिवर्तन स्वामित्व, कब्जे, अतिक्रमण, निर्माण की वैधता या भू-सीमा की शुद्धता स्थापित नहीं करते।" : "These are synthetic contextual images. Changes shown here do not establish ownership, possession, encroachment, construction legality, or boundary correctness.",
    traceability: hi ? "ट्रेसबिलिटी और सीमाएं" : "Traceability and limits",
    traceabilityDetail: hi ? "प्रदाता स्थानीय सिंथेटिक फिक्स्चर है। यह डेमो नीति केवल संदर्भ संकेतकों का वर्गीकरण करती है और क्षेत्रफल तुलना, आधिकारिक रिकॉर्ड या सत्यापन परिणामों को नहीं बदलती।" : "The provider is a local synthetic fixture. This demo policy classifies context indicators only; it does not change area comparison, official records, or verification results.",
    unavailableTitle: hi ? "सिंथेटिक संदर्भ छवियां उपलब्ध नहीं" : "Synthetic context imagery unavailable",
    unavailableDetail: hi ? "यह नया सिंथेटिक केस है और इसके लिए कोई दो-तारीख संदर्भ फिक्स्चर नहीं बनाया गया है।" : "This is a new synthetic case and no two-date context fixture has been created for it.",
    back: hi ? "भू-खंड जानकारी पर लौटें" : "Back to Parcel Intelligence",
    loading: hi ? "सिंथेटिक संदर्भ छवियां लोड हो रही हैं…" : "Loading synthetic contextual imagery…",
    error: hi ? "सिंथेटिक संदर्भ छवियां अभी नहीं दिखाई जा सकीं। कृपया फिर कोशिश करें।" : "Synthetic contextual imagery could not be shown right now. Please try again.",
  };
}

export function localizedParcelComparisonPresentation(locale: Locale, summaryKey?: string) {
  const hi = locale === "hi";
  const summaries: Record<string, { title: string; detail: string }> = hi ? {
    ALL_AREA_SOURCES_CLOSELY_ALIGNED: { title: "क्षेत्रफल स्रोत लगभग समान हैं", detail: "ऐतिहासिक रिकॉर्ड, सर्वे रिकॉर्ड और मानचित्रित कृत्रिम भू-खंड प्रदर्शन तुलना सीमा के भीतर हैं।" },
    HISTORICAL_DIFFERS_SURVEY_AND_GEOMETRY_ALIGN: { title: "ऐतिहासिक क्षेत्रफल में संभावित अंतर", detail: "सर्वे मूल्य और मानचित्रित कृत्रिम सीमा लगभग समान हैं, जबकि ऐतिहासिक रिकॉर्ड में अधिक अंतर दिखता है।" },
    AREA_COMPARISON_NEEDS_MORE_EVIDENCE: { title: "तुलना के लिए अधिक जानकारी चाहिए", detail: "उपलब्ध स्रोतों में से एक में क्षेत्रफल नहीं है। इसे अंतर न मानें।" },
    AREA_COMPARISON_REVIEW_RECOMMENDED: { title: "क्षेत्रफल तुलना की समीक्षा करें", detail: "कुछ उपलब्ध क्षेत्रफल मूल्य प्रदर्शन तुलना सीमा से अलग हैं। स्रोत रिकॉर्ड साथ रखकर समीक्षा करें।" },
  } : {
    ALL_AREA_SOURCES_CLOSELY_ALIGNED: { title: "Area sources closely aligned", detail: "The historical record, survey record, and mapped synthetic parcel are within the demo comparison tolerance." },
    HISTORICAL_DIFFERS_SURVEY_AND_GEOMETRY_ALIGN: { title: "Possible historical-area difference", detail: "The survey value and mapped synthetic boundary are closely aligned, while the historical record differs more substantially." },
    AREA_COMPARISON_NEEDS_MORE_EVIDENCE: { title: "More information is needed for comparison", detail: "An available source does not contain an area value. This is not a discrepancy." },
    AREA_COMPARISON_REVIEW_RECOMMENDED: { title: "Review the area comparison", detail: "Some available area values differ beyond the demo comparison tolerance. Review the source records together." },
  };
  return {
    areaComparison: hi ? "क्षेत्रफल तुलना" : "Area comparison",
    historical: hi ? "ऐतिहासिक रिकॉर्ड" : "Historical record",
    survey: hi ? "सर्वे / पर्चा" : "Survey / Parcha",
    geometry: hi ? "मानचित्रित सीमा" : "Mapped geometry",
    source: hi ? "स्रोत" : "Source",
    provenance: hi ? "उत्पत्ति" : "Provenance",
    unavailable: hi ? "पर्याप्त जानकारी नहीं" : "Not enough information",
    comparisons: hi ? "जोड़ी में तुलना" : "Pairwise comparisons",
    difference: hi ? "अंतर" : "difference",
    consistent: hi ? "लगभग समान" : "Closely aligned",
    review: hi ? "समीक्षा आवश्यक" : "Needs review",
    potential: hi ? "संभावित अंतर" : "Possible difference",
    insufficient: hi ? "पर्याप्त जानकारी नहीं" : "Not enough information",
    evidence: hi ? "स्रोत रिकॉर्ड देखें" : "Review source records",
    sourcesAvailable: hi ? "3 क्षेत्रफल स्रोत उपलब्ध हैं" : "3 area sources available",
    noMappedBoundary: hi ? "अभी कोई मानचित्रित भू-सीमा उपलब्ध नहीं है" : "No mapped parcel boundary yet",
    how: hi ? "यह तुलना कैसे काम करती है" : "How this comparison works",
    howDetail: hi ? "मूल्य एकड़ में बदले जाते हैं। प्रतिशत अंतर दो मूल्यों के अंतर को बड़े मूल्य से भाग देकर निकाला जाता है। GeoJSON/Turf से मानचित्रित क्षेत्रफल निकलता है। प्रदर्शन सीमाएँ AI, कानूनी, भू-अभिलेख, वैधानिक या सरकारी नियम नहीं हैं।" : "Values are normalized to acres. Percentage difference is the absolute difference divided by the larger value. Mapped area comes from GeoJSON/Turf. These demo tolerances are not AI, legal, cadastral, statutory, or government rules.",
    summary: summaries[summaryKey ?? "AREA_COMPARISON_NEEDS_MORE_EVIDENCE"]!,
  };
}

export function localizedVerificationPresentation(locale: Locale, ruleId: "AREA_CONSISTENCY" | "FAMILY_CONTEXT", outcome: "PASS" | "POTENTIAL_ISSUE" | "INSUFFICIENT_EVIDENCE") {
  const hi = locale === "hi";
  if (outcome === "INSUFFICIENT_EVIDENCE") return { title: hi ? "तुलना के लिए पर्याप्त जानकारी नहीं" : "Not enough comparable information", detail: hi ? "इस जाँच के लिए आवश्यक तुलनीय जानकारी उपलब्ध नहीं है। इसे असंगति न मानें; उपलब्ध रिकॉर्ड साथ रखें और आवश्यक जानकारी खोजें।" : "The comparable information needed for this check is not available. This is not a discrepancy; keep the available records together and identify what is missing." };
  if (ruleId === "AREA_CONSISTENCY") return outcome === "POTENTIAL_ISSUE" ? { title: hi ? "क्षेत्रफल मूल्यों में संभावित अंतर" : "Possible difference in area values", detail: hi ? "उपलब्ध रिकॉर्ड और सर्वे प्रविष्टि में क्षेत्रफल अलग दिखाई देता है। दोनों स्रोतों को साथ रखकर देखें; BhoomiCheck यह तय नहीं करता कि कौन सा मूल्य सही है।" : "The available record and survey entry show different area values. Review both sources together; BhoomiCheck does not determine which value is correct." } : { title: hi ? "क्षेत्रफल में कोई स्पष्ट अंतर नहीं मिला" : "No obvious area difference found", detail: hi ? "तुलना किए गए सिंथेटिक रिकॉर्ड में क्षेत्रफल का कोई स्पष्ट अंतर नहीं मिला।" : "No obvious area difference was found in the compared synthetic records." };
  return outcome === "POTENTIAL_ISSUE" ? { title: hi ? "परिवार और धारक संदर्भ में संभावित अंतर" : "Possible difference in family and holder context", detail: hi ? "वंशावली/परिवार जानकारी और वर्तमान धारक या सर्वे संदर्भ में अंतर दिखाई देता है। स्रोत रिकॉर्ड की समीक्षा करें; BhoomiCheck स्वामित्व या विरासत तय नहीं करता।" : "The genealogy/family information differs from the current holder or survey context. Review the source records; BhoomiCheck does not determine ownership or inheritance." } : { title: hi ? "परिवार-संदर्भ में कोई स्पष्ट अंतर नहीं मिला" : "No obvious family-context difference found", detail: hi ? "तुलना किए गए सिंथेटिक रिकॉर्ड में परिवार-संदर्भ का कोई स्पष्ट अंतर नहीं मिला।" : "No obvious family-context difference was found in the compared synthetic records." };
}

export function localizedPacketPresentation(locale: Locale, ruleId: "AREA_CONSISTENCY" | "FAMILY_CONTEXT") {
  const hi = locale === "hi";
  if (ruleId === "AREA_CONSISTENCY") return { summary: hi ? "सिंथेटिक रिकॉर्ड में क्षेत्रफल मूल्य अलग दिखाई देते हैं। संबंधित स्रोत रिकॉर्ड साथ रखकर समीक्षा के लिए तैयार करें।" : "Synthetic records show differing area values. Keep the related source records together for review.", request: hi ? "कृपया इस सिंथेटिक ड्राफ्ट में सूचीबद्ध रिकॉर्ड की समीक्षा करें और दिखाए गए क्षेत्रफल अंतर के बारे में स्पष्टीकरण दें।" : "Please review the synthetic records listed in this draft and clarify the area difference shown above." };
  return { summary: hi ? "सिंथेटिक रिकॉर्ड में परिवार और धारक संदर्भ अलग दिखाई देता है। संबंधित स्रोत रिकॉर्ड साथ रखकर समीक्षा के लिए तैयार करें।" : "Synthetic records show differing family and holder context. Keep the related source records together for review.", request: hi ? "कृपया इस सिंथेटिक ड्राफ्ट में सूचीबद्ध रिकॉर्ड की समीक्षा करें और दिखाए गए परिवार-संदर्भ अंतर के बारे में स्पष्टीकरण दें।" : "Please review the synthetic records listed in this draft and clarify the family-context difference shown above." };
}

export function localizedTimelinePresentation(locale: Locale, id: string, fallback: { title: string; detail: string }) {
  const hi = locale === "hi";
  const known: Record<string, { title: string; detail: string }> = hi ? {
    "documents-available": { title: "दस्तावेज़ उपलब्ध हैं", detail: "इस केस के लिए सिंथेटिक रिकॉर्ड उपलब्ध हैं।" },
    "structured-information": { title: "संरचित जानकारी उपलब्ध है", detail: "कम से कम एक सिंथेटिक रिकॉर्ड के तैयार फ़ील्ड उपलब्ध हैं।" },
    "verification-completed": { title: "रिकॉर्ड जाँच पूरी हुई", detail: "निर्धारित जाँचें समीक्षा के लिए उपलब्ध हैं।" },
    "potential-discrepancy": { title: "संभावित असंगति पहचानी गई", detail: "एक रिकॉर्ड तुलना को नागरिक समीक्षा चाहिए।" },
    "guidance-available": { title: "मार्गदर्शन उपलब्ध है", detail: "वर्तमान रिकॉर्ड स्थिति के लिए तैयारी मार्गदर्शन उपलब्ध है।" }
  } : {
    "documents-available": { title: "Documents available", detail: "Synthetic records are available for this case." },
    "structured-information": { title: "Structured information available", detail: "At least one synthetic record has prepared fields." },
    "verification-completed": { title: "Verification completed", detail: "Deterministic checks are available to review." },
    "potential-discrepancy": { title: "Potential discrepancy identified", detail: "A record comparison needs citizen review." },
    "guidance-available": { title: "Guidance available", detail: "Preparation guidance is available for the current record state." }
  };
  if (known[id]) return known[id];
  if (id.endsWith("-created")) return hi ? { title: "समीक्षा पैकेट बनाया गया", detail: "सिंथेटिक समीक्षा पैकेट ड्राफ्ट उपलब्ध है।" } : { title: "Review packet created", detail: "A synthetic review packet draft exists." };
  if (id.endsWith("-ready")) return hi ? { title: "समीक्षा के लिए तैयार", detail: "पैकेट समीक्षा के लिए तैयार है और जमा नहीं किया गया है।" } : { title: "Ready for review", detail: "A packet is prepared for review and has not been submitted." };
  return fallback;
}
