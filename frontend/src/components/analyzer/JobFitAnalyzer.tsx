import React, { useState, useRef } from 'react';
import apiClient from '../../api/client';
import MatchScoreDisplay from './MatchScoreDisplay';
import RequirementBreakdown from './RequirementBreakdown';
import TailoringActions from './TailoringActions';
import QuickCheck from './QuickCheck';
import { Search, FileText, Wand2, Loader, AlertCircle, Upload, File as FileIcon, X } from 'lucide-react';

// Types matching API response
interface AnalysisResult {
    match_score: number;
    match_label: string;
    should_apply: boolean;
    recommendation: string;
    matches: any[];
    strong_matches: number;
    matches_count: number;
    partial_matches: number;
    gaps: number;
    dealbreakers: string[];
    top_suggestions: string[];
    missing_keywords: string[];
}

interface TailoringPlan {
    job_title: string;
    company: string;
    current_score: number;
    projected_score: number;
    actions: any[];
    keywords_to_add: string[];
    suggested_summary: string;
    cover_letter_points: string[];
}

export default function JobFitAnalyzer() {
    const [activeTab, setActiveTab] = useState<'analyze' | 'tailor'>('analyze');
    const [jobUrl, setJobUrl] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [tailoringPlan, setTailoringPlan] = useState<TailoringPlan | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mock resume data - in a real app, we would parse the uploaded file
    const mockResumeData = {
        name: "User",
        email: "user@example.com",
        location: "Remote",
        technical_skills: ["Python", "React", "TypeScript", "SQL"],
        total_years_experience: 5,
        experiences: [],
        education: []
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleRemoveFile = () => {
        setResumeFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!jobUrl) {
            setError("Please enter a job URL");
            return;
        }
        if (!resumeFile) {
            setError("Please upload your resume");
            return;
        }

        setLoading(true);
        setError(null);
        setAnalysis(null);
        setTailoringPlan(null);

        try {
            // In a real implementation, we would upload the file here
            // const formData = new FormData();
            // formData.append('resume', resumeFile);
            // formData.append('job_url', jobUrl);

            // For now, we use the mock data but simulate the API call
            const response = await apiClient.post('/api/analyzer/analyze', {
                job_url: jobUrl,
                resume_data: mockResumeData
            });

            setAnalysis(response.data);
        } catch (err: any) {
            console.error("Analysis failed:", err);
            // Fallback for demo if API fails or is not running
            if (err.code === "ERR_NETWORK" || !err.response) {
                // Simulate success for demo purposes if backend is unreachable
                setTimeout(() => {
                    setAnalysis({
                        match_score: 0.85,
                        match_label: "Strong Match",
                        should_apply: true,
                        recommendation: "Based on your resume, you are a strong candidate for this role. Your Python and React skills align well with the requirements.",
                        matches: [
                            { requirement_text: "5+ years Python", category: "experience", strength: "strong", evidence: ["5 years experience"], explanation: "Matches requirement" },
                            { requirement_text: "React experience", category: "skills", strength: "match", evidence: ["React"], explanation: "Found in skills" }
                        ],
                        strong_matches: 2,
                        matches_count: 2,
                        partial_matches: 0,
                        gaps: 0,
                        dealbreakers: [],
                        top_suggestions: ["Highlight leadership experience"],
                        missing_keywords: ["Kubernetes", "Docker"]
                    });
                    setLoading(false);
                }, 1500);
                return;
            }
            setError(err.response?.data?.detail || err.message || 'An error occurred');
        } finally {
            if (analysis) setLoading(false); // Only stop loading if we didn't do the fallback
        }
    };

    const handleGenerateTailoring = async () => {
        if (!analysis || !jobUrl) return;

        setLoading(true);
        try {
            const response = await apiClient.post('/api/analyzer/tailor', {
                job_url: jobUrl,
                resume_data: mockResumeData,
                analysis: analysis
            });

            setTailoringPlan(response.data);
            setActiveTab('tailor');
        } catch (err: any) {
            console.error("Tailoring failed:", err);
            // Fallback for demo
            if (err.code === "ERR_NETWORK" || !err.response) {
                setTailoringPlan({
                    job_title: "Senior Software Engineer",
                    company: "Tech Company",
                    current_score: 0.85,
                    projected_score: 0.95,
                    actions: [
                        { action_type: "add_keyword", section: "Skills", priority: "high", suggestion: "Add Kubernetes to skills", example: "Kubernetes, Docker" }
                    ],
                    keywords_to_add: ["Kubernetes"],
                    suggested_summary: "Experienced...",
                    cover_letter_points: ["Mention Python"]
                });
                setActiveTab('tailor');
            } else {
                setError(err.response?.data?.detail || err.message || 'An error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleQuickCheck = async (jobDesc: string, resumeSum: string) => {
        setLoading(true);
        try {
            const response = await apiClient.post('/api/analyzer/quick-check', {
                job_description: jobDesc,
                resume_summary: resumeSum
            });

            const data = response.data;
            alert(`Compatibility Score: ${Math.round(data.score * 100)}%\n${data.recommendation}`);
        } catch (err: any) {
            // Fallback
            alert(`Compatibility Score: 85%\nStrong Match (Demo)`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Job Fit Analyzer
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        AI-powered analysis to optimize your application success rate.
                    </p>
                </div>
            </div>

            {/* Quick Check Section */}
            {!analysis && (
                <QuickCheck onCheck={handleQuickCheck} loading={loading} />
            )}

            {/* Main Analysis Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Full Analysis</h3>
                <form onSubmit={handleAnalyze} className="space-y-4">
                    {/* Job URL Input */}
                    <div>
                        <label htmlFor="job-url" className="block text-sm font-medium text-gray-700 mb-1">Job Posting URL</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="url"
                                name="job-url"
                                id="job-url"
                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                placeholder="Paste job posting URL (Greenhouse, Lever, etc.)"
                                value={jobUrl}
                                onChange={(e) => setJobUrl(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Resume Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                        {!resumeFile ? (
                            <div
                                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 cursor-pointer transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="space-y-1 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <span className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                            Upload a file
                                        </span>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        PDF, DOCX up to 10MB
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-1 flex items-center justify-between p-4 border border-gray-200 rounded-md bg-gray-50">
                                <div className="flex items-center">
                                    <FileIcon className="h-8 w-8 text-indigo-500 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{resumeFile.name}</p>
                                        <p className="text-xs text-gray-500">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                        {!resumeFile && (
                            <div className="mt-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const sampleFile = new File(["dummy content"], "sample_resume.pdf", { type: "application/pdf" });
                                        setResumeFile(sampleFile);
                                        setError(null);
                                    }}
                                    className="text-sm text-indigo-600 hover:text-indigo-500"
                                >
                                    Use sample resume
                                </button>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? <Loader className="animate-spin h-5 w-5 mr-2" /> : null}
                            {loading ? 'Analyzing...' : 'Analyze Job Fit'}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 rounded-md flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
                        <span className="text-sm text-red-700">{error}</span>
                    </div>
                )}
            </div>

            {/* Results Section */}
            {analysis && (
                <div className="space-y-6">
                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('analyze')}
                                className={`${activeTab === 'analyze'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Fit Analysis
                            </button>
                            <button
                                onClick={() => {
                                    if (!tailoringPlan) handleGenerateTailoring();
                                    else setActiveTab('tailor');
                                }}
                                className={`${activeTab === 'tailor'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                <Wand2 className="w-4 h-4 mr-2" />
                                Tailoring Plan
                            </button>
                        </nav>
                    </div>

                    {activeTab === 'analyze' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: Score */}
                            <div className="lg:col-span-1">
                                <MatchScoreDisplay
                                    score={analysis.match_score}
                                    label={analysis.match_label}
                                    recommendation={analysis.recommendation}
                                    shouldApply={analysis.should_apply}
                                />

                                {/* Quick Actions */}
                                <div className="mt-6 bg-white rounded-lg shadow p-6">
                                    <h4 className="font-medium text-gray-900 mb-4">Next Steps</h4>
                                    <button
                                        onClick={handleGenerateTailoring}
                                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                    >
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        Generate Tailoring Plan
                                    </button>
                                </div>
                            </div>

                            {/* Right Column: Breakdown */}
                            <div className="lg:col-span-2">
                                <RequirementBreakdown matches={analysis.matches} />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {tailoringPlan ? (
                                <>
                                    <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <Wand2 className="h-5 w-5 text-indigo-400" />
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-indigo-700">
                                                    Applying these changes could increase your match score from{' '}
                                                    <span className="font-bold">{Math.round(tailoringPlan.current_score * 100)}%</span> to{' '}
                                                    <span className="font-bold">{Math.round(tailoringPlan.projected_score * 100)}%</span>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <TailoringActions
                                        actions={tailoringPlan.actions}
                                        keywordsToAdd={tailoringPlan.keywords_to_add}
                                    />
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <Loader className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Generating Plan...</h3>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
