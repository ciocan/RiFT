
import React, { useState } from 'react';
import { Save } from 'lucide-react';

interface AdminViewProps {
    currentPrompt: string;
    onSave: (newPrompt: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentPrompt, onSave }) => {
    const [localPrompt, setLocalPrompt] = useState(currentPrompt);

    const handleSave = () => {
        if (localPrompt.trim()) {
            onSave(localPrompt);
        } else {
            alert('Prompt cannot be empty.');
        }
    };

    return (
        <div className="p-6 md:p-10 h-full flex flex-col bg-gray-800 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
                <p className="text-gray-400 mb-4">
                    This system prompt defines the personality and instructions for the AI agent.
                    A well-crafted prompt is crucial for guiding the conversation effectively.
                </p>
                <div className="flex-1 flex flex-col">
                     <textarea
                        value={localPrompt}
                        onChange={(e) => setLocalPrompt(e.target.value)}
                        className="w-full flex-1 p-4 bg-gray-900 text-gray-200 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                        placeholder="Enter the system prompt here..."
                    />
                </div>
               
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="flex items-center px-6 py-3 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 transition-colors"
                    >
                        <Save size={18} className="mr-2" />
                        Save and Apply
                    </button>
                </div>
            </div>
        </div>
    );
};
