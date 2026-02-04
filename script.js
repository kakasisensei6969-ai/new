// script.js - Updated with proper API handling

let myData = {};
let chatHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initializeChat();
    setupEventListeners();
});

// Load data
async function loadData() {
    try {
        const response = await fetch('./data.json');
        myData = await response.json();
        updateUI();
        addWelcomeMessage();
    } catch (error) {
        console.error("Error loading data:", error);
        myData = getDefaultData();
    }
}

// Get default data
function getDefaultData() {
    return {
        bot_name: "মনসাথেরাপি বট",
        office: "ঢাকা সাইকোলজিক্যাল কেয়ার সেন্টার",
        services: ["মানসিক স্বাস্থ্য কাউন্সেলিং"],
        faq: {},
        custom_qa: {},
        emergency_contacts: ["জাতীয় জরুরি সেবা: ৯৯৯"]
    };
}

// Update UI
function updateUI() {
    // Update services list
    const servicesList = document.querySelector('.services-list');
    if (servicesList && myData.services) {
        servicesList.innerHTML = myData.services.map(service => 
            `<p><i class="fas fa-check-circle"></i> ${service}</p>`
        ).join('');
    }
    
    // Update emergency list
    const emergencyList = document.querySelector('.emergency-list');
    if (emergencyList && myData.emergency_contacts) {
        emergencyList.innerHTML = myData.emergency_contacts.map(contact => 
            `<p>📞 ${contact}</p>`
        ).join('');
    }
}

// Initialize chat
function initializeChat() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    setTimeout(() => {
        addMessage("আসসালামু আলাইকুম! আমি আপনার মানসিক স্বাস্থ্য সহায়ক। আজকে আপনি কেমন আছেন?", 'bot');
    }, 500);
}

// Setup event listeners
function setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    
    messageInput.addEventListener('keypress', handleKeyPress);
    sendButton.addEventListener('click', sendMessage);
    
    // Quick question buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            askQuestion(this.dataset.question);
        });
    });
}

// Ask question
function askQuestion(question) {
    document.getElementById('messageInput').value = question;
    sendMessage();
}

// Send message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    input.value = '';
    input.focus();
    
    // Show typing
    showTypingIndicator();
    
    try {
        // First check custom responses
        const customResponse = getCustomResponse(message);
        if (customResponse) {
            setTimeout(() => {
                hideTypingIndicator();
                addMessage(customResponse, 'bot');
            }, 800);
            return;
        }
        
        // Call API
        const response = await callChatAPI(message);
        
        hideTypingIndicator();
        addMessage(response, 'bot');
        
    } catch (error) {
        hideTypingIndicator();
        console.error("Error:", error);
        addMessage("দুঃখিত, কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।", 'bot');
    }
}

// Call chat API
async function callChatAPI(message) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                userData: myData
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.reply;
        
    } catch (error) {
        console.error('API call failed:', error);
        return getFallbackResponse(message);
    }
}

// Check custom responses
function getCustomResponse(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Direct matches in custom_qa
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
    
    // Check custom_qa for partial matches
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
        'ধন্যবাদ': "আপনাকেও অনেক ধন্যবাদ। আপনার সুস্থতা কামনা করছি। 💚",
        'হ্যালো': "হ্যালো! আমি মনসাথেরাপি বট। আপনার মানসিক স্বাস্থ্য নিয়ে কিভাবে সাহায্য করতে পারি?",
        'কেমন আছ': "ধন্যবাদ জিজ্ঞাসার জন্য! আমি ভালো আছি। আপনি কেমন আছেন?",
        'তোমার নাম কি': `আমার নাম ${myData.bot_name || "মনসাথেরাপি বট"}।`,
        'কে বানিয়েছে': "আমাকে জাহিদুল ইসলাম তৈরি করেছেন।",
        'help': "আমি মানসিক স্বাস্থ্য সাহায্য করতে এখানে আছি। আপনি স্ট্রেস, অ্যাংজাইটি, ডিপ্রেশন নিয়ে কথা বলতে পারেন।"
    };
    
    for (const [key, value] of Object.entries(responses)) {
        if (lowerQuestion.includes(key.toLowerCase())) {
            return value;
        }
    }
    
    return "আমি এখনও সেই প্রশ্নের উত্তর শিখিনি। মানসিক স্বাস্থ্য সংক্রান্ত যেকোনো প্রশ্ন করুন।";
}

// Add message to chat
function addMessage(text, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    
    const time = new Date().toLocaleTimeString('bn-BD', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.className = `message ${sender}-message`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            ${sender === 'bot' ? `<strong>${myData.bot_name || 'মনসাথেরাপি'}:</strong> ` : ''}${text}
            <div class="message-time">${time}</div>
        </div>
    `;
    
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
    const contacts = myData.emergency_contacts || ["জাতীয় জরুরি সেবা: ৯৯৯"];
    
    alert("🚨 জরুরি যোগাযোগ:\n\n" + contacts.join("\n") + 
          "\n\n❗ জরুরি অবস্থায় অবশ্যই প্রফেশনাল হেল্প নিন।");
}

// Add welcome message
function addWelcomeMessage() {
    setTimeout(() => {
        addMessage("💡 পরামর্শ: আপনি দ্রুত প্রশ্নের বোতামগুলো ব্যবহার করতে পারেন", 'bot', true);
    }, 2000);
    
    setTimeout(() => {
        addMessage("🔒 আপনার সকল তথ্য গোপন রাখা হবে", 'bot', true);
    }, 4000);
}

// Add message with tip style
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
