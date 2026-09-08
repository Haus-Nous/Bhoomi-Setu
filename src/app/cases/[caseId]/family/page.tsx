"use client";
import { CasePage } from "@/components/case-page";
import { CaseHeader, CaseNavigation } from "@/components/shell";
import { EmptyState, FamilyMemberCard } from "@/components/domain";
import { useTranslation } from "@/components/locale-context";
export default function FamilyPage() { const c = useTranslation().family; return <CasePage>{(detail, caseId) => <main id="main" className="case-layout"><CaseNavigation caseId={caseId} /><div className="case-content"><CaseHeader title={c.header} subtitle={c.subtitle} />{detail.family.members.length ? <div className="relationship">{detail.family.members.map((member, index) => <div key={member.id}><FamilyMemberCard {...member} />{index < detail.family.members.length - 1 && <div className="connector">↓<span>{detail.family.relationships[index]?.label || c.relationship}</span></div>}</div>)}</div> : <EmptyState title={c.emptyTitle} detail={c.emptyDetail} />}<aside className="callout"><strong>{c.check}</strong><p>{c.checkDetail}</p></aside></div></main>}</CasePage>; }
