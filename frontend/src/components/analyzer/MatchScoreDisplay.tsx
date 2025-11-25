import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface MatchScoreDisplayProps {
    score: number;
    label: string;
    recommendation: string;
    shouldApply: boolean;
}

export default function MatchScoreDisplay({ score, label, recommendation, shouldApply }: MatchScoreDisplayProps) {
    const percentage = Math.round(score * 100);

    let colorClass = 'text-red-600';
    let bgClass = 'bg-red-50';
    let icon = <XCircle className="w-8 h-8 text-red-600" />;

    if (score >= 0.7) {
        colorClass = 'text-green-600';
        bgClass = 'bg-green-50';
        icon = <CheckCircle className="w-8 h-8 text-green-600" />;
    } else if (score >= 0.4) {
        colorClass = 'text-yellow-600';
        bgClass = 'bg-yellow-50';
        icon = <AlertTriangle className="w-8 h-8 text-yellow-600" />;
    }

    return (
        <div className={`rounded-lg shadow p-6 flex flex-col items-center text-center ${bgClass}`}>
            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                {/* Circular Progress Placeholder - using SVG for simple circle */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-gray-200"
                    />
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={351.86}
                        strokeDashoffset={351.86 - (351.86 * percentage) / 100}
                        className={colorClass}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className={`text-3xl font-bold ${colorClass}`}>{percentage}%</span>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
                {icon}
                <h2 className={`text-2xl font-bold ${colorClass}`}>{label}</h2>
            </div>

            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${shouldApply ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {shouldApply ? 'Recommended to Apply' : 'Not Recommended'}
            </div>

            <p className="text-gray-700 text-sm max-w-md">
                {recommendation}
            </p>
        </div>
    );
}
