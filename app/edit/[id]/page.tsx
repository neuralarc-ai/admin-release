import { PopupFormHost } from "@/components/PopupFormHost";

export default async function EditPopupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PopupFormHost mode="edit" id={id} />;
}
