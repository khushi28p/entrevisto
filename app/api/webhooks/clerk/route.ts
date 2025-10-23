import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('Missing Svix headers');
    return new Response('Error: Missing required Svix headers', { status: 400 });
  }

  const body = await req.text();

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('CRITICAL: CLERK_WEBHOOK_SECRET is not set');
    return new Response('Error: Server configuration error', { status: 500 });
  }

  let event: WebhookEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification FAILED:', err);
    return new Response('Error: Webhook verification failed', { status: 403 });
  }
  
  const eventType = event.type;
  console.log(`Webhook verified: ${eventType}`);

  // Handle user creation and updates
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses } = event.data;

    if (!id || !email_addresses || email_addresses.length === 0) {
      console.error('Invalid user data received');
      return new Response('Error: Invalid user data', { status: 400 });
    }

    const email = email_addresses[0].email_address;
    
    try {
      const user = await prisma.user.upsert({
        where: { clerkId: id },
        update: { email },
        create: { 
          clerkId: id, 
          email,
          // role defaults to CANDIDATE in your schema
        },
      });
      
      console.log(`✅ User ${eventType === 'user.created' ? 'created' : 'updated'}: ${user.id}`);
      return new Response('User synced successfully', { status: 200 });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return new Response('Database operation failed', { status: 500 });
    }
  }

  // Handle user deletion
  if (eventType === 'user.deleted') {
    const { id } = event.data;
    
    if (!id) {
      console.error('Missing user ID for deletion');
      return new Response('Error: Missing user ID', { status: 400 });
    }

    try {
      await prisma.user.delete({
        where: { clerkId: id },
      });
      
      console.log(`✅ User deleted: ${id}`);
      return new Response('User deleted successfully', { status: 200 });
    } catch (dbError) {
      console.error('Delete failed:', dbError);
      // User might not exist, which is fine
      return new Response('User deletion completed', { status: 200 });
    }
  }

  console.log('Event received but not handled');
  return new Response('Event received', { status: 200 });
}