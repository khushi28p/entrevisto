import VapiWidget from "@/components/vapi-widget";
import prisma from "@/lib/prisma";

const clerkId = await 

const resumeText = await prisma.candidateProfile.findMany{
    
}

export default function Page() {
    return <div>
        <VapiWidget 
            assistantId={process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID as string}
            config={{
                "model": {
                    "provider": 'openai',
                    "model": 'gpt-4o',
                    "messages": [
                        {
                            "role": "system",
                            "content": `You are an AI interviewer.Use the candidate's resume provided as ${resumeText} to ask relevant questions. Be professional, friendly, and ask follow-ups when needed.`
                        }
                    ],
                    "temperature": 0.7 
                },
                // "voice": {
                //     "provider": "11labs",
                //     "voice": "Sarah"
                // },
                "firstMessage": "Hello Ayush, can we start with the interview"
            }}
        />
    </div>
}