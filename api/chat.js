// api/chat.js - Vercel Serverless Function

const YOUR_QROK_API_KEY = process.env.QROK_API_KEY;
const QROK_API_URL = 'https://api.qrok.ai/v1/chat/completions';

// System instruction template
const getSystemInstruction = (userData) => `
  তোমার নাম "${userData.bot_name || 'মনসাথেরাপি বট'}"। তুমি জাহিদুল ইসলামের (Jahidul Islam) তৈরি একজন স্মার্ট এআই অ্যাসিস্ট্যান্ট।
  
  গুরুত্বপূর্ণ নির্দেশনা:
  ১. তুমি একটি মানসিক স্বাস্থ্য সহায়ক বট।
  ২. প্রশ্ন করা হলে "তোমাকে কে বানিয়েছে?" বা "তোমার ডেভেলপার কে?" - উত্তর দিবে: "আমাকে জাহিদুল ইসলাম তৈরি করেছেন।"
  ৩. কখনোই বলবে না যে তুমি OpenAI, Google, ChatGPT বা Gemini-এর তৈরি।
  ৪. তুমি বাংলাদেশ ভিত্তিক এবং বাংলায় কথা বলো।
  ৫. জরুরি মানসিক স্বাস্থ্য সমস্যার জন্য ব্যবহারকারীকে হটলাইন নম্বর দিতে হবে।
  
  প্রোফাইল তথ্য:
  - অফিস: ${userData.office || 'ঢাকা, বাংলাদেশ'}
  - সার্ভিসসমূহ: ${userData.services ? userData.services.join(', ') : 'মানসিক স্বাস্থ্য কাউন্সেলিং'}
  
  উত্তর দেওয়ার নিয়ম:
  ১. প্রশ্নের সরাসরি উত্তর userData থেকে দিতে পারলে সেটাই দিবে।
  ২. না পারলে বুদ্ধিমত্তা দিয়ে মানসিক স্বাস্থ্য বিষয়ক সহায়ক উত্তর দিবে।
  ৩. ভাষা হবে সহজ, বন্ধুত্বপূর্ণ এবং সহানুভূতিশীল বাংলা।
  ৪. উত্তর সর্বোচ্চ ৩-৪ লাইনের হবে।
  ৫. জরুরি সমস্যার জন্য প্রফেশনাল হেল্প নেওয়ার পরামর্শ দিবে।
`;

export default async function handler(req, res) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { message, chatHistory, userData } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        // Check if message is in custom Q&A
        const customResponse = checkCustomResponse(message, userData);
        if (customResponse) {
            return res.status(200).json({ 
                reply: customResponse,
                source: 'custom_data'
            });
        }
        
        // Prepare messages for Qrok API
        const messages = [
            {
                role: "system",
                content: getSystemInstruction(userData || {})
            },
            ...(chatHistory || []),
            {
                role: "user",
                content: message
            }
        ];
        
        // Call Qrok API
        const qrokResponse = await fetch(QROK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${YOUR_QROK_API_KEY}`
            },
            body: JSON.stringify({
                model: "qrok-model", // Replace with your actual model
                messages: messages,
                temperature: 0.7,
                max_tokens: 500,
                stream: false
            })
        });
        
        if (!qrokResponse.ok) {
            const errorText = await qrokResponse.text();
            console.error('Qrok API error:', errorText);
            throw new Error(`Qrok API error: ${qrokResponse.status}`);
        }
        
        const qrokData = await qrokResponse.json();
        
        // Extract reply from response
        let reply = qrokData.choices?.[0]?.message?.content || 
                   "দুঃখিত, আমি এখন উত্তর দিতে পারছি না।";
        
        // Ensure reply is in Bengali and appropriate for mental health context
        reply = formatReply(reply, message, userData);
        
        return res.status(200).json({ 
            reply: reply,
            source: 'qrok_api'
        });
        
    } catch (error) {
        console.error('Error in chat API:', error);
        
        // Fallback response
        const fallbackReplies = [
            "দুঃখিত, এখন আমি উত্তর দিতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করুন।",
            "আমার সার্ভারে কিছু সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
            "এই মুহূর্তে আমি আপনার প্রশ্নের উত্তর দিতে পারছি না। অন্য কোনো প্রশ্ন করুন।"
        ];
        
        return res.status(200).json({
            reply: fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)],
            source: 'fallback'
        });
    }
}

// Check custom Q&A
function checkCustomResponse(message, userData) {
    if (!userData) return null;
    
    const lowerMessage = message.toLowerCase();
    
    // Check FAQ
    if (userData.faq) {
        for (const [key, value] of Object.entries(userData.faq)) {
            if (lowerMessage.includes(key.toLowerCase()) || 
                key.toLowerCase().includes(lowerMessage)) {
                return value;
            }
        }
    }
    
    // Check custom Q&A
    if (userData.custom_qa) {
        for (const [key, value] of Object.entries(userData.custom_qa)) {
            if (lowerMessage.includes(key.toLowerCase()) || 
                key.toLowerCase().includes(lowerMessage)) {
                return value;
            }
        }
    }
    
    return null;
}

// Format reply for mental health context
function formatReply(reply, originalMessage, userData) {
    // Add emergency contact if message indicates emergency
    const emergencyKeywords = ['আত্মহত্যা', 'মরব', 'ঝুকি', 'জরুরি', 'ইমার্জেন্সি', 'সিরিয়াস', 'বিপদ'];
    const originalLower = originalMessage.toLowerCase();
    
    const hasEmergency = emergencyKeywords.some(keyword => 
        originalLower.includes(keyword.toLowerCase())
    );
    
    if (hasEmergency) {
        const emergencyContacts = userData?.emergency_contacts || [
            "জাতীয় জরুরি সেবা: ৯৯৯",
            "মানসিক স্বাস্থ্য হেল্পলাইন: ০৯৬৩৩-৭৭৫৫৫৫"
        ];
        
        reply += `\n\n🚨 জরুরি যোগাযোগ:\n${emergencyContacts.join('\n')}\n\n❗ দয়া করে অবিলম্বে প্রফেশনাল হেল্প নিন।`;
    }
    
    // Ensure reply ends with proper punctuation
    if (!reply.endsWith('.') && !reply.endsWith('!') && !reply.endsWith('?')) {
        reply += '।';
    }
    
    return reply;
}
