import { Card, StatCard } from "../components/ui/card";
import { PageHeader } from "../components/ui/page-header";
import { PrimaryButton, SecondaryButton } from "../components/ui/button";
import { SectionTitle } from "../components/ui/section-title";

const stats = [
  { label: "Active goals", value: "4", description: "In progress with aligned actions" },
  { label: "Actions due this week", value: "12", description: "Prioritize the top three first" },
  { label: "Coaching notes", value: "18", description: "Recent reflections and insights" },
  { label: "Clients supported", value: "7", description: "Across personal and team goals" },
];

const quickActions = [
  { title: "Start a new goal", description: "Capture a fresh objective and outline what success looks like." },
  { title: "Refine SMART details", description: "Tighten scope, timelines, and measures for a clearer path." },
  { title: "Review upcoming actions", description: "See what is scheduled and adjust priorities for the week." },
];

const noteHighlights = [
  { title: "Momentum check", detail: "Celebrate two quick wins before tackling the complex tasks." },
  { title: "Coaching prompt", detail: "What is the smallest action you can take in 15 minutes?" },
  { title: "Alignment reminder", detail: "Revisit the goal statement to keep actions purposeful." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-6">
        <PageHeader
          title="Action Coach Dashboard"
          description="A minimalist workspace for guiding goals, actions, and coaching notes."
          actions={<PrimaryButton>New goal</PrimaryButton>}
        />

        <div className="grid gap-6 md:grid-cols-2">
          {stats.map((item) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value}
              description={item.description}
            />
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="space-y-6">
            <SectionTitle title="Quick actions" description="Stay focused with streamlined steps." />
            <div className="space-y-4 text-sm text-neutral-700">
              {quickActions.map((action) => (
                <div className="space-y-1" key={action.title}>
                  <p className="text-sm font-semibold text-neutral-800">{action.title}</p>
                  <p className="text-sm text-neutral-600">{action.description}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <PrimaryButton>Capture a goal</PrimaryButton>
              <SecondaryButton>View actions</SecondaryButton>
            </div>
          </Card>

          <Card className="space-y-6">
            <SectionTitle title="Coaching highlights" description="Recent notes surfaced for context." />
            <div className="space-y-4 text-sm text-neutral-700">
              {noteHighlights.map((note) => (
                <div className="space-y-1" key={note.title}>
                  <p className="text-sm font-semibold text-neutral-800">{note.title}</p>
                  <p className="text-sm text-neutral-600">{note.detail}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <PrimaryButton>Open notes</PrimaryButton>
              <SecondaryButton>Share update</SecondaryButton>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
