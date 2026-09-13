import { GoogleGenerativeAI } from '@google/generative-ai';

const ALLOWED = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
]);

function parseJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return null; }
    }
    return null;
  }
}

export async function extractInvoice(req, res) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'Gemini API key is not configured on the server.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an invoice image or PDF.' });
    }
    if (!ALLOWED.has(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Only JPG, PNG, WEBP, GIF, or PDF files are supported.' });
    }

    const mode = req.body.mode === 'client' ? 'client' : 'invoice';
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
    });

    const invoicePrompt = `You are extracting structured data from an invoice image or PDF.
Return ONLY valid JSON with this exact shape:
{
  "billFrom": { "name": "", "companyName": "", "email": "", "phone": "", "address": "" },
  "client": { "name": "", "email": "", "phone": "", "address": "" },
  "invoiceId": "",
  "date": "YYYY-MM-DD or empty",
  "dueDate": "YYYY-MM-DD or empty",
  "items": [{ "desc": "", "qty": 1, "rate": 0 }],
  "tax": 0,
  "notes": "",
  "bankDetails": { "bankName": "", "accountName": "", "accountNumber": "", "routingNumber": "" }
}
Rules:
- billFrom is the seller / billed by / from party.
- client is the buyer / billed to / bill to party.
- qty and rate must be numbers. rate is unit price, not line total.
- tax is a percent number (e.g. 18), not the tax amount. If unknown use 0.
- Use empty string for missing text fields.
- Do not invent line items that are not on the document.`;

    const clientPrompt = `You are extracting the customer / billed-to / client details from an invoice or visiting card.
Return ONLY valid JSON:
{ "name": "", "email": "", "phone": "", "address": "" }
Prefer the buyer / billed-to party if this is an invoice. Use empty string if missing.`;

    const result = await model.generateContent([
      { inlineData: { mimeType: req.file.mimetype, data: req.file.buffer.toString('base64') } },
      { text: mode === 'client' ? clientPrompt : invoicePrompt },
    ]);

    const parsed = parseJson(result.response.text());
    if (!parsed) {
      return res.status(422).json({ success: false, message: 'AI could not read this file. Try a clearer photo or PDF.' });
    }

    if (mode === 'client') {
      return res.json({
        success: true,
        data: {
          name: parsed.name || parsed.client?.name || '',
          email: parsed.email || parsed.client?.email || '',
          phone: parsed.phone || parsed.client?.phone || '',
          address: parsed.address || parsed.client?.address || '',
        },
      });
    }

    const items = Array.isArray(parsed.items) && parsed.items.length
      ? parsed.items.map((item, i) => ({
          id: Date.now() + i,
          desc: item.desc || item.description || '',
          qty: Number(item.qty) || 1,
          rate: Number(item.rate) || 0,
        }))
      : [{ id: Date.now(), desc: '', qty: 1, rate: 0 }];

    return res.json({
      success: true,
      data: {
        billFrom: {
          name: parsed.billFrom?.name || '',
          companyName: parsed.billFrom?.companyName || '',
          email: parsed.billFrom?.email || '',
          phone: parsed.billFrom?.phone || '',
          address: parsed.billFrom?.address || '',
        },
        client: {
          name: parsed.client?.name || '',
          email: parsed.client?.email || '',
          phone: parsed.client?.phone || '',
          address: parsed.client?.address || '',
        },
        invoiceId: parsed.invoiceId || '',
        date: parsed.date || '',
        dueDate: parsed.dueDate || '',
        items,
        tax: Number(parsed.tax) || 0,
        notes: parsed.notes || '',
        bankDetails: {
          bankName: parsed.bankDetails?.bankName || '',
          accountName: parsed.bankDetails?.accountName || '',
          accountNumber: parsed.bankDetails?.accountNumber || '',
          routingNumber: parsed.bankDetails?.routingNumber || parsed.bankDetails?.ifsc || '',
        },
      },
    });
  } catch (err) {
    console.error('Gemini extract error:', err.message);
    return res.status(502).json({
      success: false,
      message: err.message?.includes('API key') ? 'Gemini API key is invalid.' : 'AI extraction failed. Please try again.',
    });
  }
}
