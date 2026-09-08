# Land-record domain rules

## Records and identifiers

**D1 — RoR is evidence.** A Record of Rights records revenue interests, possession, liabilities, tenure and land particulars; it is not guaranteed title. Always retain state, local name, edition/year, source location and local plot identifier.

| State / region | Textual record name | Local plot / parcel identifier |
|---|---|---|
| Bihar / Jharkhand | Khatian | Plot number |
| Uttar Pradesh / Uttarakhand | Khatauni | Khasra or gata number |
| Maharashtra / Gujarat | 7/12 extract | Survey or gat number plus subdivision |
| Karnataka | RTC (Record of Rights, Tenancy and Crops) | Survey number plus hissa |
| Andhra Pradesh / Telangana | Adangal | Survey number plus subdivision |
| Punjab / Haryana / Himachal Pradesh | Jamabandi | Khasra number under khata/khewat |
| Tamil Nadu | Chitta | Survey number plus subdivision |
| West Bengal | Khatian (RS/LR) | Dag number |

`dag` is a parcel identifier, not the name of a Record of Rights. State adapters MUST refine all names and identifiers from cited, versioned state sources. **Example:** West Bengal “LR Khatian 18, Dag 456/1” stores record_name=LR Khatian, account_id=18 and plot_id=456/1; it never treats “Dag” as the textual record or parcel 18.

**D2 — Account is not ground.** Khata is an account/holding; khasra/survey/gat/dag is a ground parcel. Model people, accounts, parcels, time-bounded interests and sources separately: relations are many-to-many. **Example:** Khata 18 contains plots 456 and 460 for A and B, while A shares plot 900 under Khata 27. One owner column necessarily duplicates or falsely assigns ownership.

**D3 — A cadastral map is historical evidence.** It draws the measurement/legal-revenue context at its survey date, possibly 90 years ago; it is not a survey of today's ground. Preserve sheet, scale, year, control and uncertainty. **Example:** if a 1936 boundary follows a stream that moved by 2026, flag mismatch; never move the legal boundary to the current stream.

## Events and lineage

**D4 — Mutation follows the event.** Mutation updates the revenue register after sale, gift, inheritance, decree or partition; it does not create title. **Example:** sale registered 4 April and mutation sanctioned 20 June remain two events; transfer date is not 20 June.

**D5 — Subdivision is not a chain break.** Use a dedicated `SUBDIVIDED_INTO` edge with effective date, authority, source and area/geometry allocation. **Example:** 456 → 456/1 and 456/2; lineage queries traverse both children, not “missing successor”.

**D6 — Margin annotations are immutable assertions.** Store image coordinates, transcription, author/date when present and links to affected entries; never merge into a row. **Example:** “half share transferred to Sita, mutation 72/1968” attaches as an event while the original row remains.

## Identity and quantities

**D7 — Relation name is high-weight identity evidence.** Preserve relation type and text. Name/village matches cannot override a conflicting father/husband name. **Example:** Ram Singh son of Mohan and Ram Singh son of Sohan must not auto-merge.

**D8 — Customary area conversion is district- and date-specific.** Never hardcode bigha/katha/biswa factors globally. Every factor MUST be jurisdiction-specific, versioned and cited; absent that authority, retain the original unit and flag conversion as unresolved. **Example:** a record says 3 bigha. Applying the incorrect factor 0.619 acre/bigha yields 1.857 acres; the correct local factor 0.3306 acre/bigha yields approximately 0.992 acre. Comparing those results creates roughly an 87% false discrepancy.

**D9 — Shares are exact rationals.** Store integer numerator/denominator, positive denominator, and reduce by GCD; never float. **Example:** three `0.333333` values total `0.999999`; three `(1,3)` pairs equal exactly `(1,1)`.

## Tenure and title

**D10 — Tenure class controls permitted actions.** It is a jurisdiction/versioned rule, not display text. Some assigned, grant, tribal, protected-tenant, ceiling or restricted classes prohibit transfer or require permission. **Example:** a sale naming non-transferable assigned land is flagged and routed; no transfer workflow advances.

**D11 — Title is presumptive.** Revenue records evidence recorded possession/interests, not guaranteed ownership. **Example:** when RoR names A but B supplies a deed and pending decree, say “A is the recorded holder, subject to competing evidence,” never “A owns the land.”
