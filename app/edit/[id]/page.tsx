import { PopupFormHost } from "@/components/PopupFormHost";

export default async function EditPopupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PopupFormHost key={id} mode="edit" id={id} />;
}
