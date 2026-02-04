// Global variables
let myData = {};
let chatHistory = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initializeChat();
    setupEventListeners();
});

// Load data from JSON file
async function loadData() {
    try {
        const response = await fetch('data.json');
        myData = await response.json();
        console.log("Data loaded successfully");
        
        // Update UI with loaded data
        updateServicesList();
        addWelcomeMessage();
    } catch (error) {
        console.error("Error loading data:", error);
        // Fallback data
        myData = {
            bot_name: "মনসাথেরাপি বট",
            office: "ঢাকা সাইকোলজিক্যাল কেয়ার সেন্টার",
            services: ["মানসিক স্বাস্থ্য কাউন্সেলিং"],
            faq: {},
            custom_qa: {},
            emergency_contacts: [
                "জাতীয় জরুরি সেবা: ৯৯৯",
                "মানসিক স্বাস্থ্য হেল্পলাইন: ০৯৬৩৩-৭৭৫৫৫৫"
            ]
        };
    }
}

// Initialize chat interface
function initializeChat() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    // Add initial welcome message
    setTimeout(() => {
        addMessage("আসসালামু আলাইকুম! আমি আপনার মানসিক স্বাস্থ্য সহায়ক। আজকে আপনি কেমন আছেন? কিভাবে আপনাকে সাহায্য করতে পারি?", 'bot');
    }, 500);
}

// Set up event listeners
function setupEventListeners() {
    // Message input enter key
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('keypress', handleKeyPress);
    
    // Send button click
    document.getElementById('sendButton').addEventListener('click', sendMessage);
    
    // Clear chat button (if added later)
    // document.getElementById('clearChat').addEventListener('click', clearChat);
}

// Update services list in sidebar
function updateServicesList() {
    const servicesList = document.querySelector('.services-list');
    if (servicesList && myData.services) {
        servicesList.innerHTML = myData.services.map(service => 
            `<p><i class="fas fa-check-circle"></i> ${service}</p>`
        ).join('');
    }
}

// Add welcome message
function addWelcomeMessage() {
    const welcomeMessages = [
        "আপনি দ্রুত প্রশ্নের বোতামগুলো ব্যবহার করতে পারেন",
        "আপনার কথা গোপন রাখা হবে",
        "জরুরি অবস্থায় ডাক্তারের শরণাপন্ন হোন",
        "নিয়মিত মনোরম কথা বললে মন ভালো থাকে"
    ];
    
    setTimeout(() => {
        welcomeMessages.forEach((msg, index) => {
            setTimeout(() => {
                addMessage(msg, 'bot', true);
            }, index * 1000);
        });
    }, 2000);
}

// Ask quick question from sidebar
function askQuestion(question) {
    document.getElementById('messageInput').value = question;
    sendMessage();
}

// Send message to chatbot
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessage(message, 'user');
    input.value = '';
    input.focus();
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Add to chat history
        chatHistory.push({ role: 'user', content: message });
        
        // Get response from API
        const response = await getChatResponse(message);
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add bot response to chat
        addMessage(response, 'bot');
        
        // Add to chat history
        chatHistory.push({ role: 'assistant', content: response });
        
    } catch (error) {
        hideTypingIndicator();
        console.error("Error:", error);
        addMessage("দুঃখিত, কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।", 'bot');
    }
}

// Get chat response from API
async function getChatResponse(message) {
    try {
        // First check custom Q&A
        const customResponse = getCustomResponse(message);
        if (customResponse) {
            return customResponse;
        }
        
        // Use API for other responses
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                chatHistory: chatHistory,
                userData: myData
            })
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        return data.reply;
        
    } catch (error) {
        // Fallback to local responses
        return getFallbackResponse(message);
    }
}

// Check custom Q&A first
function getCustomResponse(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Direct matches
    if (myData.custom_qa && myData.custom_qa[question]) {
        return myData.custom_qa[question];
    }
    
    // Check FAQ
    if (myData.faq) {
        for (const [key, value] of Object.entries(myData.faq)) {
            if (lowerQuestion.includes(key.toLowerCase()) || 
                key.toLowerCase().includes(lowerQuestion)) {
                return value;
            }
        }
    }
    
    // Check custom Q&A for partial matches
    if (myData.custom_qa) {
        for (const [key, value] of Object.entries(myData.custom_qa)) {
            if (lowerQuestion.includes(key.toLowerCase()) || 
                key.toLowerCase().includes(lowerQuestion)) {
                return value;
            }
        }
    }
    
    return null;
}

// Fallback responses
function getFallbackResponse(question) {
    const lowerQuestion = question.toLowerCase();
    
    const responses = {
        'ধন্যবাদ': "আপনাকেও অনেক ধন্যবাদ। আপনার সুস্থতা কামনা করছি। প্রয়োজন হলে আবার কথা বলুন।",
        'থ্যাঙ্কস': "আপনাকেও অনেক ধন্যবাদ। আপনার সুস্থতা কামনা করছি। প্রয়োজন হলে আবার কথা বলুন।",
        'হ্যালো': "হ্যালো! আমি মনসাথেরাপি বট। আপনার মানসিক স্বাস্থ্য নিয়ে কিভাবে সাহায্য করতে পারি?",
        'হাই': "হাই! আমি আপনার মানসিক স্বাস্থ্য সহায়ক। কেমন আছেন আপনি?",
        'কেমন আছ': "ধন্যবাদ জিজ্ঞাসার জন্য! আমি ভালো আছি। আপনি কেমন আছেন? আজকে আপনার দিনটি কেমন যাচ্ছে?",
        'তোমার নাম কি': `আমার নাম ${myData.bot_name || "মনসাথেরাপি বট"}। আমি জাহিদুল ইসলামের তৈরি একজন AI সহায়ক।`,
        'কে বানিয়েছে': "আমাকে জাহিদুল ইসলাম তৈরি করেছেন।",
        'ডেভেলপার কে': "আমাকে জাহিদুল ইসলাম তৈরি করেছেন।",
        'help': "আমি মানসিক স্বাস্থ্য সংক্রান্ত সাহায্য করতে এখানে আছি। আপনি স্ট্রেস, অ্যাংজাইটি, ডিপ্রেশন বা ঘুমের সমস্যা নিয়ে কথা বলতে পারেন।"
    };
    
    for (const [key, value] of Object.entries(responses)) {
        if (lowerQuestion.includes(key.toLowerCase())) {
            return value;
        }
    }
    
    return "আমি এখনও সেই প্রশ্নের উত্তর শিখিনি। তবে মানসিক স্বাস্থ্য সংক্রান্ত যেকোনো প্রশ্নের জন্য আমি এখানে আছি। আপনি অন্য কিছু জানতে চান?";
}

// Add message to chat
function addMessage(text, sender, isTip = false) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    
    const time = new Date().toLocaleTimeString('bn-BD', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.className = `message ${sender}-message`;
    
    if (isTip) {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div style="display: flex; align-items: center; gap: 10px; color: #059669;">
                    <i class="fas fa-lightbulb"></i>
                    <div>
                        <strong>পরামর্শ:</strong> ${text}
                        <div class="message-time">${time}</div>
                    </div>
                </div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">
                ${sender === 'bot' ? `<strong>${myData.bot_name || 'মনসাথেরাপি'}:</strong> ` : ''}${text}
                <div class="message-time">${time}</div>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle Enter key
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Show typing indicator
function showTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.style.display = 'block';
}

// Hide typing indicator
function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.style.display = 'none';
}

// Show emergency contacts
function showEmergencyContacts() {
    const contacts = myData.emergency_contacts || [
        "জাতীয় জরুরি সেবা: ৯৯৯",
        "মানসিক স্বাস্থ্য হেল্পলাইন: ০৯৬৩৩-৭৭৫৫৫৫",
        "নারী ও শিশু নির্যাতন: ১০৯",
        "সাইবার ক্রাইম: ০১৭৬৯৬৯১৬০০"
    ];
    
    const contactText = "🚨 জরুরি যোগাযোগ:\n\n" + contacts.join("\n") + 
                       "\n\n❗ জরুরি অবস্থায় অবশ্যই প্রফেশনাল হেল্প নিন।\n💡 আমরা কেবল সীমিত সহায়তা দিতে পারি।";
    
    alert(contactText);
}

// Voice input functionality
function startVoiceInput() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'bn-BD';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        recognition.start();
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('messageInput').value = transcript;
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
        };
    } else {
        alert("দুঃখিত, আপনার ব্রাউজার Voice Input সাপোর্ট করে না।");
    }
}

// Export for Vercel serverless function compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getChatResponse,
        getCustomResponse,
        getFallbackResponse
    };
}
