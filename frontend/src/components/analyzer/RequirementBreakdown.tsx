import { useState } from 'react';
import { Check, Minus, X, ChevronDown, ChevronUp } from 'lucide-react';

interface RequirementMatch {
    requirement_text: string;
    category: string;
    strength: string;
    evidence: string[];
    explanation: string;
    suggestion?: string;
}

interface RequirementBreakdownProps {
    matches: RequirementMatch[];
}

export default function RequirementBreakdown({ matches }: RequirementBreakdownProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggleExpand = (index: number) => {
        setExpandedId(expandedId === index ? null : index);
    };

    const getStrengthIcon = (strength: string) => {
        switch (strength.toLowerCase()) {
            case 'strong':
            case 'match':
                return <Check className="w-5 h-5 text-green-500" />;
            case 'partial':
                return <Minus className="w-5 h-5 text-yellow-500" />;
            case 'weak':
            case 'gap':
            default:
                return <X className="w-5 h-5 text-red-500" />;
        }
    };

    const getStrengthColor = (strength: string) => {
        switch (strength.toLowerCase()) {
            case 'strong':
            case 'match':
                return 'bg-green-50 border-green-200';
            case 'partial':
                return 'bg-yellow-50 border-yellow-200';
            case 'weak':
            case 'gap':
            default:
                return 'bg-red-50 border-red-200';
        }
    };

    // Group matches by category
    const groupedMatches = matches.reduce((acc, match) => {
        const category = match.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(match);
        return acc;
    }, {} as Record<string, RequirementMatch[]>);

    return (
        <div className="space-y-6">
            {Object.entries(groupedMatches).map(([category, categoryMatches]) => (
                <div key={category} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            {category.replace('_', ' ')}
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {categoryMatches.map((match, index) => {
                            const isExpanded = expandedId === index; // Simplified for demo, ideally use unique IDs

                            return (
                                <div key={index} className={`p-4 ${getStrengthColor(match.strength)} bg-opacity-30`}>
                                    <div
                                        className="flex items-start justify-between cursor-pointer"
                                        onClick={() => toggleExpand(index)} // Note: this logic needs refinement for unique IDs across categories if flat list used
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="mt-0.5 flex-shrink-0">
                                                {getStrengthIcon(match.strength)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{match.requirement_text}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Match: <span className="font-medium capitalize">{match.strength}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <button className="text-gray-400 hover:text-gray-600">
                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {/* Expanded Details */}
                                    {/* Using a simple expansion logic for now, might need state management per item */}
                                    <div className="mt-3 pl-8 text-sm text-gray-600">
                                        <p className="mb-2"><span className="font-medium">Analysis:</span> {match.explanation}</p>

                                        {match.evidence && match.evidence.length > 0 && (
                                            <div className="mb-2">
                                                <span className="font-medium">Evidence found:</span>
                                                <ul className="list-disc list-inside ml-2 mt-1 text-gray-500">
                                                    {match.evidence.map((e, i) => (
                                                        <li key={i}>{e}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {match.suggestion && (
                                            <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800 text-xs">
                                                <span className="font-bold">Suggestion:</span> {match.suggestion}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
