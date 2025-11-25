import { Plus, Edit, Type, Star } from 'lucide-react';

interface TailoringAction {
    action_type: string;
    section: string;
    priority: string;
    suggestion: string;
    example?: string;
}

interface TailoringActionsProps {
    actions: TailoringAction[];
    keywordsToAdd: string[];
}

export default function TailoringActions({ actions, keywordsToAdd }: TailoringActionsProps) {
    const getActionIcon = (type: string) => {
        switch (type) {
            case 'add_skill': return <Plus className="w-4 h-4" />;
            case 'modify_bullet': return <Edit className="w-4 h-4" />;
            case 'add_keyword': return <Type className="w-4 h-4" />;
            default: return <Star className="w-4 h-4" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Keywords Section */}
            {keywordsToAdd.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Missing Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                        {keywordsToAdd.map((keyword, idx) => (
                            <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                <Plus className="w-3 h-3 mr-1" />
                                {keyword}
                            </span>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        Tip: Incorporate these exact terms into your resume to pass ATS filters.
                    </p>
                </div>
            )}

            {/* Actions List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Tailoring Plan</h3>
                </div>
                <div className="divide-y divide-gray-200">
                    {actions.map((action, index) => (
                        <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(action.priority)} capitalize`}>
                                            {action.priority} Priority
                                        </span>
                                        <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                                            {action.section}
                                        </span>
                                    </div>

                                    <div className="flex items-start mt-2">
                                        <div className="flex-shrink-0 mt-1 mr-3 p-1.5 bg-indigo-100 rounded-md text-indigo-600">
                                            {getActionIcon(action.action_type)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{action.suggestion}</p>
                                            {action.example && (
                                                <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 text-sm text-gray-600 font-mono">
                                                    <span className="block text-xs text-gray-400 mb-1 uppercase">Example:</span>
                                                    "{action.example}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
