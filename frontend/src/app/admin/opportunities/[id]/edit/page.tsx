import { EditOpportunity } from "./editor";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditOpportunity id={id} />;
}
