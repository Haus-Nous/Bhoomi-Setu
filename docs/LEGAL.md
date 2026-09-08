# Legal and product prohibitions

1. **Presumptive title — state land-revenue/RoR statutes.** Copy MUST say recorded holder/interest and MUST NEVER assert verified ownership or guaranteed title.
2. **State plug-ins — Constitution, Seventh Schedule, List II, Entry 18.** Land is a State subject. Every interpretation MUST retain jurisdiction and rule-pack version; national defaults cannot override state schema.
3. **No transfer primitive — Registration Act, 1908, §§17 and 49.** Instruments covered by §17 require registration and §49 limits unregistered instruments. The system may ingest, validate, flag and route; it MUST NOT transfer, convey, register, perfect or declare title.
4. **Electronic-evidence certification — Bharatiya Sakshya Adhiniyam, 2023, §63.** Electronic/digital evidence intended to be proved under §63 MUST satisfy the applicable statutory certificate and evidentiary requirements, including prescribed certificate information for the electronic-record source and hash. Separately, Bhoomi Setu uses named accountable custodians and permissioned hash anchoring as a governance, attribution and auditability architecture decision. That design supports accountable certification; §63 does not command a permissioned blockchain or government blockchain custodian. A hash proves neither the truth of the underlying land fact nor a legal conclusion, and the system MUST NOT self-declare either.
5. **Consent is an object — DPDP Act, 2023, §§5–8.** Consent MUST be free, specific, informed, unconditional, unambiguous, affirmative, unbundled, purpose-bound and as easy to withdraw as give. Store purpose, notice version, data categories, actor, time, evidence, status and withdrawal; enforce minimisation. A checkbox is insufficient.
6. **Identity seeding is voluntary — Aadhaar Act, 2016, §§4 and 7, read with the Supreme Court Aadhaar judgment.** A fully functional non-identifier path MUST exist unless a specific valid law requires authentication; no denial, degradation or coercion.
7. **Bad input yields an evidenced flag — evidence-quality engineering invariant, not a direct statutory rule.** Preserve the source, provenance, uncertainty and contradictions. Illegible, incomplete or contradictory evidence MUST produce abstention or a well-evidenced flag, never a manufactured confident fact.
8. **No self-executing transfer — Transfer of Property Act, 1882, §52 (lis pendens).** Pending qualifying litigation requires a dispute flag and competent review; automation cannot affect parties' rights.
9. **Non-goals are binding.** The canonical list below defines what this system deliberately does not build.

If a feature could violate a rule above, stop, preserve evidence and require competent state/legal review. This file is an engineering constraint register, not legal advice.

## What we deliberately do not build

1. On-chain title transfer or tokenised property
2. Smart contracts that execute a transfer
3. A public blockchain as the primary ledger
4. Any AI-generated legal conclusion
5. Storing Aadhaar numbers or biometrics
6. Mandatory Aadhaar
7. Online fine-tuning in production
8. Photorealistic 3D city rendering
9. Automatic merging of matched entities
10. Scraping live government portals during the demo

## Additional engineering invariants

- Never assert guaranteed title or verified ownership.
- Never implement transfer, registration, mutation-sanction, title creation or automated adjudication.
- Never correct a cadastral boundary to current ground without a lawful survey.
- Never gate a fully functional flow on an identifier.
- Never bundle, coerce or make consent irrevocable.
- Never delete or destructively merge source records, margin annotations or matched entities.
- Never hardcode customary-unit conversions; require cited, versioned jurisdictional factors.
- Never use floating-point shares or silently reconcile missing or excess shares.
- Never manufacture confident facts from illegible, incomplete, contradictory or unproven input.
