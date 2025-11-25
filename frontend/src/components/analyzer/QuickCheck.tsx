import React, { useState } from 'react';
import { Search, ArrowRight, Loader } from 'lucide-react';

interface QuickCheckProps {
    onCheck: (jobDescription: string, resumeSummary: string) => Promise<void>;
    loading: boolean;
}

export default function QuickCheck({ onCheck, loading }: QuickCheckProps) {
    const [jobDescription, setJobDescription] = useState('');
    const [resumeSummary, setResumeSummary] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (jobDescription && resumeSummary) {
            onCheck(jobDescription, resumeSummary);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <Search className="w-5 h-5 mr-2 text-indigo-600" />
                    Quick Compatibility Check
                </h2>
            </div>

            <p className="text-sm text-gray-500 mb-6">
                Paste a job description and your resume summary to get an instant compatibility assessment before running a full analysis.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="job-desc" className="block text-sm font-medium text-gray-700 mb-1">
                        Job Description Snippet
                    </label>
                    <textarea
                        id="job-desc"
                        rows={3}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Paste key requirements here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="resume-sum" className="block text-sm font-medium text-gray-700 mb-1">
                        Resume Summary / Skills
                    </label>
                    <textarea
                        id="resume-sum"
                        rows={3}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Paste your summary or skills section..."
                        value={resumeSummary}
                        onChange={(e) => setResumeSummary(e.target.value)}
                        required
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || !jobDescription || !resumeSummary}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                Check Compatibility
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
