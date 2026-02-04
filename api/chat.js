// api/chat.js - CommonJS format for Vercel
module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { message, userData } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // System instruction
    const systemInstruction = `
      তোমার নাম "মনসাথেরাপি বট"। তুমি জাহিদুল ইসলামের তৈরি একজন মানসিক স্বাস্থ্য সহায়ক AI অ্যাসিস্ট্যান্ট।
      
      নির্দেশনা:
      ১. তুমি একটি মানসিক স্বাস্থ্য সহায়ক বট।
      ২. প্রশ্ন করা হলে "তোমাকে কে বানিয়েছে?" উত্তর দিবে: "আমাকে জাহিদুল ইসলাম তৈরি করেছেন।"
      ৩. কখনোই বলবে না যে তুমি OpenAI, Google, ChatGPT বা Gemini-এর তৈরি।
      ৪. তুমি বাংলায় কথা বলবে।
      
      উত্তর দেওয়ার নিয়ম:
      ১. সহজ, বন্ধুত্বপূর্ণ বাংলায় উত্তর দিবে।
      ২. মানসিক স্বাস্থ্য বিষয়ক সাহায্য করবে।
      ৩. জরুরি সমস্যার জন্য হটলাইন নম্বর দিবে।
    `;
    
    // Your Qrok API credentials
    const QROK_API_KEY = process.env.QROK_API_KEY || 'your-api-key-here';
    const QROK_API_URL = 'https://api.qrok.ai/v1/chat/completions';
    
    // Prepare request to Qrok API
    const requestBody = {
      model: "openai/gpt-oss-120b", // Replace with actual model
      messages: [
        {
          role: "system",
          content: systemInstruction
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    };
    
    // Call Qrok API
    const response = await fetch(QROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QROK_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`Qrok API error: ${response.status}`);
    }
    
    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content || 
                   "দুঃখিত, আমি এখন উত্তর দিতে পারছি না।";
    
    // Check for emergency keywords
    const emergencyKeywords = ['আত্মহত্যা', 'মরব', 'ঝুকি', 'জরুরি', 'ইমার্জেন্সি'];
    const hasEmergency = emergencyKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
    
    let finalReply = aiReply;
    
    if (hasEmergency) {
      finalReply += "\n\n🚨 জরুরি সাহায্যের জন্য কল করুন:\n• জাতীয় হেল্পলাইন: ৯৯৯\n• মানসিক স্বাস্থ্য: ০৯৬৩৩-৭৭৫৫৫৫\n• নারী ও শিশু: ১০৯";
    }
    
    return res.status(200).json({
      reply: finalReply,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API Error:', error);
    
    // Fallback responses
    const fallbackResponses = [
      "দুঃখিত, সার্ভারে কিছু সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
      "এই মুহূর্তে আমি আপনার প্রশ্নের উত্তর দিতে পারছি না। কিছুক্ষণ পর চেষ্টা করুন।",
      "আমার সার্ভার ব্যস্ত আছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।"
    ];
    
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return res.status(200).json({
      reply: randomResponse,
      error: true
    });
  }
};
