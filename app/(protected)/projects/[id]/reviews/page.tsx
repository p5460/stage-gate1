import { redirect } from "next/navigation";

interface ProjectReviewsRedirectProps {
  params: {
    id: string;
  };
}

export default async function ProjectReviewsRedirect({
  params,
}: ProjectReviewsRedirectProps) {
  // Await params for Next.js 15 compatibility
  const { id } = await params;

  // Redirect from /projects/[id]/reviews to /projects/[id]/review
  redirect(`/projects/${id}/review`);
}
