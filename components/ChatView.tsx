import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { ChatMessage } from '../types';
import { Send, Bot, User, Clipboard, Check, RefreshCw, Trash2 } from 'lucide-react';

interface ChatViewProps {
    systemPrompt: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
const CHAT_HISTORY_KEY = 'mvp-architect-chat-history';


interface ChatBubbleProps {
    message: ChatMessage;
    onRetry?: () => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onRetry }) => {
    const [hasCopied, setHasCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    const isModel = message.role === 'model';
    const isError = !!message.error;

    return (
        <div className={`flex items-start gap-3 my-4 ${isModel ? 'justify-start' : 'justify-end'}`}>
            {isModel && <div className={`flex-shrink-0 w-10 h-10 ${isError ? 'bg-red-600' : 'bg-indigo-600'} rounded-full flex items-center justify-center text-white`}><Bot size={24} /></div>}
            <div className={`relative max-w-xl p-4 rounded-xl shadow-md ${isModel ? (isError ? 'bg-gray-700 border border-red-500 text-red-200 rounded-tl-none' : 'bg-gray-700 text-gray-200 rounded-tl-none') : 'bg-blue-600 text-white rounded-br-none'}`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                {isModel && !isError && (
                    <button onClick={handleCopy} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white transition-colors" aria-label="Copy message">
                        {hasCopied ? <Check size={16} className="text-green-400" /> : <Clipboard size={16} />}
                    </button>
                )}
                {isError && onRetry && (
                     <div className="mt-3 pt-3 border-t border-red-500/30 flex justify-end">
                        <button 
                            onClick={onRetry} 
                            className="flex items-center gap-2 text-sm text-red-300 hover:text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-red-500 rounded-md px-3 py-1"
                        >
                            <RefreshCw size={14} />
                            Try Again
                        </button>
                    </div>
                )}
            </div>
            {!isModel && <div className="flex-shrink-0 w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white"><User size={24} /></div>}
        </div>
    );
};


export const ChatView: React.FC<ChatViewProps> = ({ systemPrompt }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
        const initialMessages: ChatMessage[] = storedMessages ? JSON.parse(storedMessages) : [];
        setMessages(initialMessages);

        const history = initialMessages
            .filter(msg => !msg.error)
            .map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }],
            }));
            
        const newChat = ai.chats.create({
            model: 'gemini-2.5-pro',
            config: {
                systemInstruction: systemPrompt,
            },
            history,
        });
        setChat(newChat);
    }, [systemPrompt]);
    
    useEffect(() => {
        // Don't save until chat is initialized
        if (chat) {
             if (messages.length > 0) {
                localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
            } else {
                localStorage.removeItem(CHAT_HISTORY_KEY);
            }
        }
    }, [messages, chat]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const callGemini = useCallback(async (message: string) => {
        if (!chat) return;
        setIsLoading(true);
        try {
            const response = await chat.sendMessage({ message });
            const modelMessage: ChatMessage = { role: 'model', content: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Error sending message to Gemini:", error);
            const errorMessage: ChatMessage = {
                role: 'model',
                content: 'Sorry, I encountered an error. Please try again.',
                error: true,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [chat]);

    const handleSendMessage = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat) return;
        
        const messageToSend = input;
        const userMessage: ChatMessage = { role: 'user', content: messageToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        await callGemini(messageToSend);
    }, [input, isLoading, chat, callGemini]);

    const handleRetry = useCallback(async (messageIndex: number) => {
        if (isLoading || !chat) return;

        const userMessageToRetry = messages[messageIndex - 1];
        if (!userMessageToRetry || userMessageToRetry.role !== 'user') {
            console.error("Could not find user message to retry for index", messageIndex);
            return;
        }
        
        setMessages(prev => prev.slice(0, messageIndex));
        await callGemini(userMessageToRetry.content);

    }, [messages, isLoading, chat, callGemini]);

    const handleNewChat = useCallback(() => {
        if (isLoading) return;
        setMessages([]);
        const newChat = ai.chats.create({
            model: 'gemini-2.5-pro',
            config: { systemInstruction: systemPrompt },
            history: []
        });
        setChat(newChat);
    }, [systemPrompt, isLoading]);


    return (
        <div className="flex flex-col h-full bg-gray-800">
            <div className="p-2 border-b border-gray-700 flex justify-end">
                <button
                    onClick={handleNewChat}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                    aria-label="Clear chat and start a new conversation"
                    title="New Chat"
                >
                    <Trash2 size={16} />
                    <span>New Chat</span>
                </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
                {messages.length === 0 && !isLoading && (
                    <div className="text-center text-gray-400 py-8">
                        <p className="text-lg">Welcome to the MVP Prompt Architect!</p>
                        <p className="mt-2 text-sm">Describe your app idea to get started.</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <ChatBubble key={index} message={msg} onRetry={msg.error ? () => handleRetry(index) : undefined} />
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-3 my-4 justify-start">
                        <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Bot size={24} /></div>
                        <div className="max-w-xl p-4 rounded-xl shadow-md bg-gray-700 text-gray-200 rounded-tl-none">
                            <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    </div>
                 )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-gray-900 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Tell me about your app idea..."
                        className="flex-1 w-full px-4 py-3 text-white bg-gray-700 border border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-3 text-white bg-indigo-600 rounded-full disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors"
                        aria-label="Send message"
                    >
                        <Send size={24} />
                    </button>
                </form>
            </div>
        </div>
    );
};
