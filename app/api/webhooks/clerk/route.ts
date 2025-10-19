import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Function to handle the POST request from Clerk
export async function POST(req: Request) {
  // 1. Get the headers
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  // 2. If there are missing headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('Missing Svix headers');
    return new Response('Error: Missing required Svix headers', { status: 400 });
  }

  // 3. Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // 4. Get the webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('CRITICAL: CLERK_WEBHOOK_SECRET is not set.');
    return new Response('Error: Server configuration error', { status: 500 });
  }

  // 5. Create a new Svix instance and verify the payload
  let event: WebhookEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification FAILED. Check CLERK_WEBHOOK_SECRET:', err);
    return new Response('Error: Webhook verification failed', { status: 403 }); // 403 Forbidden is correct here
  }
  
  // LOG: Webhook Verified
  console.log(`Webhook successfully verified for event type: ${event.type}`);

  // 6. Handle the event
  const eventType = event.type;

  if (eventType === 'user.created') {
    const { id, email_addresses } = event.data;

    if (!id || !email_addresses || email_addresses.length === 0) {
      console.error('Invalid user data received (missing ID or email).');
      return new Response('Error: Invalid user data received from Clerk', { status: 400 });
    }

    const email = email_addresses[0].email_address;
    
    try {
      // 7. Attempt to create the User record in the Neon database
      const user = await prisma.user.create({
        data: {
          clerkId: id,
          email: email,
          // Role defaults to CANDIDATE
        },
      });
      
      console.log(`SUCCESS: User created in DB with ID: ${user.id}`);
      return new Response('User created successfully in database', { status: 200 });

    } catch (dbError) {
      // 8. LOG: Database creation failure
      console.error('CRITICAL DATABASE ERROR: User creation failed. Check DATABASE_URL and Prisma connection.', dbError);
      return new Response('Database creation failed', { status: 500 });
    }
  }

  // Handle other event types if necessary
  return new Response('Event received, but not handled', { status: 200 });
}