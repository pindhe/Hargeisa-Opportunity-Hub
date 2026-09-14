export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-accent">Hargeisa Opportunity Hub</p>
      <h1 className="mt-3 text-4xl font-semibold text-navy">One platform. Every opportunity. A better future.</h1>
      <p className="mt-6 leading-7 text-slate-700">
        Students in Hargeisa currently find scholarships, internships, jobs, courses and competitions across websites, WhatsApp groups, Telegram channels and Facebook pages. Important deadlines get missed because the information is scattered.
      </p>
      <p className="mt-4 leading-7 text-slate-700">
        Hargeisa Opportunity Hub brings those opportunities together so students, graduates and young professionals can discover, save, track and apply with confidence.
      </p>
      <p className="mt-4 leading-7 text-slate-700">
        Organizations can publish openings for review. Admins verify listings before they go live. Sample data in development is always labelled so it cannot be mistaken for a real opportunity.
      </p>
    </div>
  );
}
