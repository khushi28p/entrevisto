import VapiWidget from "@/components/vapi-widget";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export default async function Page() {
  const { userId } = await auth();

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: {
        clerkId: userId
    }
  })

  const resumeText = await prisma.candidateProfile.findUnique({
    where: { userId: user?.id },
    select: { resumeText: true },
  });

  console.log("userId:", userId);
  console.log("resumeText:",resumeText);

  return (
    <div>
      <VapiWidget
        assistantId={process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID as string}
        config={{
          model: {
            provider: "openai",
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are an AI interviewer. Use the candidate's resume provided as: "${resumeText ?? "No resume available"}" to ask relevant questions. Be professional, friendly, and ask follow-ups when needed. Just keep it 2 min interview`,
              },
            ],
            temperature: 0.7,
          },
          firstMessage: "Hello Ayush, can we start with the interview?",
        }}
      />
    </div>
  );
}
