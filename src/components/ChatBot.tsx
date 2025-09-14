import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Calendar, Clock, Phone, Building2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

interface AppointmentData {
  patientName?: string;
  patientAge?: string;
  doctorName?: string;
  department?: string;
  preferredDateTime?: string;
  symptoms?: string;
}

const departments = [
  'Cardiology',
  'Dermatology',
  'Emergency',
  'General Medicine',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Radiology'
];

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your virtual assistant at City General Hospital. How can I help you today? You can ask me about booking an appointment, hospital services, or general information.',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [appointmentData, setAppointmentData] = useState<AppointmentData>({});
  const [conversationStep, setConversationStep] = useState<string>('initial');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text: string, sender: 'bot' | 'user') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateTyping = async (responseText: string) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    setIsTyping(false);
    addMessage(responseText, 'bot');
  };

  const isAppointmentRequest = (text: string): boolean => {
    const keywords = [
      'book', 'appointment', 'schedule', 'visit', 'doctor', 'consultation',
      'checkup', 'exam', 'treatment', 'see', 'meet', 'available'
    ];
    return keywords.some(keyword => text.toLowerCase().includes(keyword));
  };

  const submitAppointmentToN8N = async (data: AppointmentData) => {
    try {
      await simulateTyping('Thank you for providing all the information! Let me submit your appointment request...');
      
      const response = await fetch(import.meta.env.n8n_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientName: data.patientName,
          patientAge: data.patientAge,
          doctorName: data.doctorName,
          department: data.department,
          preferredDateTime: data.preferredDateTime,
          symptoms: data.symptoms,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // Handle different response scenarios from n8n
        if (responseData.success) {
          if (responseData.message) {
            await simulateTyping(responseData.message);
          } else {
            await simulateTyping('Perfect! Your appointment request has been successfully submitted. Our staff will contact you within 2-4 hours to confirm your appointment details.');
          }
          
          if (responseData.appointmentId) {
            await simulateTyping(`Your appointment reference number is: ${responseData.appointmentId}. Please keep this for your records.`);
          }
          
          if (responseData.additionalInfo) {
            await simulateTyping(responseData.additionalInfo);
          }
        } else {
          // Handle unsuccessful response from n8n
          const errorMessage = responseData.message || 'There was an issue processing your appointment request.';
          await simulateTyping(`I apologize, but ${errorMessage} Please try again later or call our reception at (555) 123-4567 for immediate assistance.`);
        }
        
        await simulateTyping('Is there anything else I can help you with today?');
      } else {
        const errorText = await response.text();
        console.error('HTTP Error:', response.status, errorText);
        await simulateTyping('I apologize, but there was an issue processing your appointment request. Please try again later or call our reception at (555) 123-4567 for immediate assistance.');
      }
    } catch (error) {
      console.error('Error submitting appointment:', error);
      await simulateTyping('I\'m sorry, but I\'m having trouble connecting to our booking system right now. Please call our reception at (555) 123-4567 to book your appointment directly.');
    }
  };

  const handleBotResponse = async (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();

    if (conversationStep === 'initial') {
      if (isAppointmentRequest(lowerMessage)) {
        setConversationStep('collecting_patient_name');
        await simulateTyping('I\'d be happy to help you book an appointment! Let me collect some information from you.');
        await simulateTyping('First, may I have your full name please?');
        return;
      }

      // Handle other general inquiries
      if (lowerMessage.includes('hours') || lowerMessage.includes('time')) {
        await simulateTyping('Our hospital is open 24/7 for emergency services. Regular outpatient services are available Monday-Friday 8:00 AM - 6:00 PM, Saturday 9:00 AM - 4:00 PM.');
        return;
      }

      if (lowerMessage.includes('location') || lowerMessage.includes('address')) {
        await simulateTyping('City General Hospital is located at Nh-24 Merrut expressway near honda showroom .Exact Address is plot-96B Metro-pillar-34 Kohat-Enclave Delhi-110009 . We have free parking available and are accessible via public transportation.');
        return;
      }

      if (lowerMessage.includes('department') || lowerMessage.includes('service')) {
        await simulateTyping('We offer comprehensive medical services including: Cardiology, Dermatology, Emergency, General Medicine, Neurology, Orthopedics, Pediatrics, and Radiology. Would you like to book an appointment with any specific department?');
        return;
      }

      await simulateTyping('I can help you with booking appointments, information about our services, hospital hours, and directions. What would you like to know?');
      return;
    }

    // Appointment booking flow
    if (conversationStep === 'collecting_patient_name') {
      setAppointmentData(prev => ({ ...prev, patientName: userMessage }));
      setConversationStep('collecting_patient_age');
      await simulateTyping(`Thank you, ${userMessage}! May I have your age please?`);
      return;
    }

    if (conversationStep === 'collecting_patient_age') {
      setAppointmentData(prev => ({ ...prev, patientAge: userMessage }));
      setConversationStep('collecting_doctor_name');
      await simulateTyping(`Thank you! Which doctor would you like to schedule your appointment with? Please provide the doctor's name.`);
      return;
    }

    if (conversationStep === 'collecting_doctor_name') {
      setAppointmentData(prev => ({ ...prev, doctorName: userMessage }));
      setConversationStep('collecting_department');
      await simulateTyping(`Great! Which department is Dr. ${userMessage} in?`);
      await simulateTyping('Available departments: ' + departments.join(', '));
      return;
    }

    if (conversationStep === 'collecting_department') {
      const selectedDept = departments.find(dept => 
        dept.toLowerCase().includes(lowerMessage) || lowerMessage.includes(dept.toLowerCase())
      );
      
      if (selectedDept) {
        setAppointmentData(prev => ({ ...prev, department: selectedDept }));
        setConversationStep('collecting_datetime');
        await simulateTyping(`Excellent! I've noted ${selectedDept} for your appointment. What would be your preferred date and time? Please provide both (e.g., "12/25/2024 at 2:30 PM" or "December 25, 2024 at 10:00 AM").`);
      } else {
        await simulateTyping('I didn\'t quite catch that department. Please choose from: ' + departments.join(', '));
      }
      return;
    }

    if (conversationStep === 'collecting_datetime') {
      setAppointmentData(prev => ({ ...prev, preferredDateTime: userMessage }));
      setConversationStep('collecting_symptoms');
      await simulateTyping('Almost done! Could you briefly describe the reason for your visit or any symptoms you\'d like to discuss with the doctor?');
      return;
    }

    if (conversationStep === 'collecting_symptoms') {
      const finalData = { ...appointmentData, symptoms: userMessage };
      setAppointmentData(finalData);
      setConversationStep('initial');
      
      await submitAppointmentToN8N(finalData);
      return;
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    addMessage(userMessage, 'user');
    setInputText('');

    await handleBotResponse(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-lg border-b border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 rounded-full p-3">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">City General Hospital</h1>
              <p className="text-gray-600">Virtual Assistant - Available 24/7</p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div 
          ref={chatContainerRef}
          className="bg-white h-96 overflow-y-auto p-6 space-y-4"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.sender === 'bot' && (
                <div className="bg-blue-600 rounded-full p-2 flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                } shadow-md`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-2 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>

              {message.sender === 'user' && (
                <div className="bg-gray-600 rounded-full p-2 flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start space-x-3">
              <div className="bg-blue-600 rounded-full p-2">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-md">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-b-2xl shadow-lg border-t border-gray-200 p-6">
          <div className="flex space-x-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <button 
              onClick={() => {
                setInputText('I want to book an appointment');
                handleSendMessage();
              }}
              className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg transition-colors duration-200"
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Book Appointment</span>
            </button>
            <button 
              onClick={() => {
                setInputText('What are your hospital hours?');
                handleSendMessage();
              }}
              className="flex items-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg transition-colors duration-200"
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Hours</span>
            </button>
            <button 
              onClick={() => {
                setInputText('What services do you offer?');
                handleSendMessage();
              }}
              className="flex items-center space-x-2 bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-lg transition-colors duration-200"
            >
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium">Services</span>
            </button>
            <button 
              onClick={() => {
                setInputText('What is the hospital location?');
                handleSendMessage();
              }}
              className="flex items-center space-x-2 bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-3 rounded-lg transition-colors duration-200"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}