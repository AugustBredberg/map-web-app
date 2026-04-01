import WorkJobDetailPage from "@/components/work/WorkJobDetailPage";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function WorkProjectPage({ params }: Props) {
  const { projectId } = await params;
  return <WorkJobDetailPage projectId={projectId} />;
}
