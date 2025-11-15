
import React, { useState, useEffect } from 'react';
import { ChatView } from './components/ChatView';
import { AdminView } from './components/AdminView';
import { DEFAULT_SYSTEM_PROMPT, LOCAL_STORAGE_KEY } from './constants';
import { Settings, MessageSquare, X } from 'lucide-react';

type View = 'chat' | 'admin';

const App: React.FC = () => {
    const [view, setView] = useState<View>('chat');
    const [systemPrompt, setSystemPrompt] = useState<string>('');

    useEffect(() => {
        const storedPrompt = localStorage.getItem(LOCAL_STORAGE_KEY);
        setSystemPrompt(storedPrompt || DEFAULT_SYSTEM_PROMPT);
    }, []);

    const handleUpdateSystemPrompt = (newPrompt: string) => {
        setSystemPrompt(newPrompt);
        localStorage.setItem(LOCAL_STORAGE_KEY, newPrompt);
        alert('System prompt updated successfully!');
        setView('chat');
    };

    const HeaderIcon = view === 'chat' ? Settings : MessageSquare;
    const headerTitle = view === 'chat' ? 'MVP Prompt Architect' : 'Admin: Edit System Prompt';
    const toggleView = () => setView(v => (v === 'chat' ? 'admin' : 'chat'));
    const toggleTitle = view === 'chat' ? 'Admin Panel' : 'Back to Chat';
    
    return (
        <div className="flex flex-col h-screen font-sans bg-gray-900 text-gray-100">
            <header className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-md">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                        <MessageSquare size={24} className="text-white"/>
                    </div>
                    <h1 className="text-xl font-bold text-white">{headerTitle}</h1>
                </div>
                <button
                    onClick={toggleView}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors"
                    aria-label={toggleTitle}
                >
                    <HeaderIcon size={18} className="mr-2" />
                    {toggleTitle}
                </button>
            </header>
            <main className="flex-1 overflow-hidden">
                {systemPrompt && (
                    view === 'chat' ? <ChatView systemPrompt={systemPrompt} /> : <AdminView currentPrompt={systemPrompt} onSave={handleUpdateSystemPrompt} />
                )}
            </main>
        </div>
    );
};

export default App;
