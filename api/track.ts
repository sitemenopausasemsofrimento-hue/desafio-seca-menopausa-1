import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventName, eventSourceUrl, fbc, fbp, eventId } = req.body;

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || '';
    const userAgent = (req.headers['user-agent'] as string) || '';

    const token = process.env.META_CAPI_TOKEN || '';
    const testCode = process.env.META_TEST_EVENT_CODE || '';

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: eventSourceUrl,
          event_id: eventId,
          action_source: 'website',
          user_data: {
            client_ip_address: ip,
            client_user_agent: userAgent,
            ...(fbc ? { fbc } : {}),
            ...(fbp ? { fbp } : {}),
          },
        },
      ],
    };

    if (testCode) {
      payload.test_event_code = testCode;
    }

    const response = await fetch(
      `https://graph.facebook.com/v19.0/873230481338340/events?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('CAPI error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
