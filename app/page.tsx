import { canonicalProject } from "@/fixtures/project";
export default function Home() {
  return <main className="setup"><p className="eyebrow">DreamBid · A better way to build</p><h1>Your next chapter.<br/>Just outside.</h1><p>Turn a backyard idea into a considered design, a clear scope, and contractor bids you can actually compare.</p><div className="setup-panel"><p className="eyebrow">Canonical project · setup checkpoint</p><h2>{canonicalProject.title}</h2><p>A 48 × 58 ft backyard. A mature oak to keep. Room for dinner, shade, and a little more possibility.</p><strong>${canonicalProject.estimatedTotal.toLocaleString()} planning estimate</strong><p>Fixture project · preliminary feasibility · synthetic pricing</p></div></main>;
}
