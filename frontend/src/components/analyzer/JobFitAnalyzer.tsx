import React, { useState, useRef } from 'react';
import apiClient from '../../api/client';
import MatchScoreDisplay from './MatchScoreDisplay';
import RequirementBreakdown from './RequirementBreakdown';
import TailoringActions from './TailoringActions';
import QuickCheck from './QuickCheck';
import { Search, FileText, Wand2, Loader, AlertCircle, Upload, File as FileIcon, X, Target, TrendingUp, Shield, Lightbulb, AlertTriangle, CheckCircle2, BarChart3, List, Check, XCircle, MinusCircle, Tag, Building2, MapPin, Briefcase, ExternalLink, Award, Zap } from 'lucide-react';

// Enhanced types for LLM-powered analysis
interface DetailedGap {
    gap_id: string;
    category: string;
    severity: string;
    requirement_text: string;
    your_level: string;
    required_level: string;
    gap_description: string;
    impact_on_application: string;
    bridging_strategies: string[];
    time_to_bridge?: string;
    transferable_skills: string[];
    talking_points: string[];
}

interface StrengthHighlight {
    strength_id: string;
    category: string;
    title: string;
    description: string;
    evidence: string[];
    competitive_advantage: string;
    how_to_leverage: string;
}

// Enhanced analysis result from LLM-powered endpoint
interface EnhancedAnalysisResult {
    // Job info
    job_title?: string;
    company?: string;
    location?: string;

    // Core scoring
    overall_score: number;
    confidence_score: number;
    fit_tier: string;

    // Executive summary
    executive_summary: string;
    key_verdict: string;

    // Detailed breakdowns
    gaps: DetailedGap[];
    strengths: StrengthHighlight[];

    // Category scores
    category_scores: Record<string, number>;

    // Strategic guidance
    application_strategy: string;
    cover_letter_focus: string[];
    interview_prep: string[];
    questions_to_ask: string[];

    // Risk assessment
    rejection_risk: string;
    rejection_reasons: string[];
    mitigation_strategies: string[];

    // Competitive positioning
    competitive_position: string;
    differentiators: string[];

    // Backward compatibility
    match_score: number;
    match_label: string;
    should_apply: boolean;
    recommendation: string;
    matches: any[];
    strong_matches: number;
    matches_count: number;
    partial_matches: number;
    gap_count: number;
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

// Helper function to get severity color
const getSeverityColor = (severity: string) => {
    switch (severity) {
        case 'critical': return 'bg-red-100 text-red-800 border-red-200';
        case 'significant': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'minor': return 'bg-blue-100 text-blue-800 border-blue-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

// Helper to get risk color
const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
        case 'high': return 'text-red-600 bg-red-50';
        case 'medium': return 'text-yellow-600 bg-yellow-50';
        case 'low': return 'text-green-600 bg-green-50';
        default: return 'text-gray-600 bg-gray-50';
    }
};


// Process API response - only use actual API data, no demo data merging
const processAnalysisData = (apiData: Partial<EnhancedAnalysisResult>): EnhancedAnalysisResult => {
    return {
        // Job info
        job_title: apiData.job_title || 'Unknown Position',
        company: apiData.company || 'Unknown Company',
        location: apiData.location || '',

        // Core scoring
        overall_score: apiData.overall_score || 0,
        confidence_score: apiData.confidence_score || 0,
        fit_tier: apiData.fit_tier || 'Unknown',

        // Executive summary
        executive_summary: apiData.executive_summary || '',
        key_verdict: apiData.key_verdict || '',

        // Arrays - use API data as-is (empty if not provided)
        gaps: apiData.gaps || [],
        strengths: apiData.strengths || [],
        matches: apiData.matches || [],
        cover_letter_focus: apiData.cover_letter_focus || [],
        interview_prep: apiData.interview_prep || [],
        questions_to_ask: apiData.questions_to_ask || [],
        rejection_reasons: apiData.rejection_reasons || [],
        mitigation_strategies: apiData.mitigation_strategies || [],
        differentiators: apiData.differentiators || [],
        top_suggestions: apiData.top_suggestions || [],
        missing_keywords: apiData.missing_keywords || [],
        dealbreakers: apiData.dealbreakers || [],

        // Category scores
        category_scores: apiData.category_scores || {},

        // Counts - calculate from matches if not provided
        strong_matches: apiData.strong_matches ?? (apiData.matches?.filter(m => m.strength === 'strong' || m.strength === 'exceeds').length || 0),
        matches_count: apiData.matches_count ?? (apiData.matches?.filter(m => m.strength === 'match').length || 0),
        partial_matches: apiData.partial_matches ?? (apiData.matches?.filter(m => m.strength === 'partial').length || 0),
        gap_count: apiData.gap_count ?? (apiData.gaps?.length || apiData.matches?.filter(m => m.strength === 'gap').length || 0),

        // Strategy
        application_strategy: apiData.application_strategy || '',
        competitive_position: apiData.competitive_position || '',
        rejection_risk: apiData.rejection_risk || 'Unknown',

        // Backward compatibility
        match_score: apiData.match_score || apiData.overall_score || 0,
        match_label: apiData.match_label || apiData.fit_tier || 'Unknown',
        should_apply: apiData.should_apply ?? (apiData.overall_score ? apiData.overall_score >= 0.5 : false),
        recommendation: apiData.recommendation || apiData.executive_summary || '',
    };
};

export default function JobFitAnalyzer() {
    const [activeTab, setActiveTab] = useState<'analyze' | 'requirements' | 'tailor' | 'gaps' | 'strategy'>('analyze');
    const [inputMode, setInputMode] = useState<'url' | 'paste'>('url');
    const [jobUrl, setJobUrl] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<EnhancedAnalysisResult | null>(null);
    const [tailoringPlan, setTailoringPlan] = useState<TailoringPlan | null>(null);
    const [useEnhancedAnalysis] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State to store parsed resume data
    const [parsedResumeData, setParsedResumeData] = useState<any>(null);
    const [parsingResume, setParsingResume] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleRemoveFile = () => {
        setResumeFile(null);
        setParsedResumeData(null); // Clear cached parsed data
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate based on input mode
        if (inputMode === 'url' && !jobUrl) {
            setError("Please enter a job URL");
            return;
        }
        if (inputMode === 'paste' && !jobDescription.trim()) {
            setError("Please paste the job description");
            return;
        }
        if (!resumeFile) {
            setError("Please upload your resume");
            return;
        }

        setLoading(true);
        setParsingResume(true);
        setError(null);
        setAnalysis(null);
        setTailoringPlan(null);

        try {
            // Step 1: Parse the PDF resume
            let resumeData = parsedResumeData;

            // Only parse if we don't have cached data or file changed
            if (!resumeData || resumeFile.name !== resumeData._fileName) {
                const formData = new FormData();
                formData.append('resume_file', resumeFile);

                const parseResponse = await apiClient.post('/api/analyzer/parse-resume', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (!parseResponse.data.success) {
                    throw new Error(parseResponse.data.detail || 'Failed to parse resume');
                }

                resumeData = {
                    ...parseResponse.data.resume_data,
                    _fileName: resumeFile.name // Cache file name to detect changes
                };
                setParsedResumeData(resumeData);
            }

            setParsingResume(false);

            // Step 2: Run job fit analysis with parsed resume
            const endpoint = useEnhancedAnalysis
                ? '/api/analyzer/analyze-enhanced'
                : '/api/analyzer/analyze';

            // Build request based on input mode
            const requestData: Record<string, any> = {
                resume_data: resumeData,
                use_llm: useEnhancedAnalysis
            };

            if (inputMode === 'url') {
                requestData.job_url = jobUrl;
            } else {
                // Paste mode - send job description directly
                requestData.job_description = jobDescription;
                requestData.job_url = ''; // Empty URL since we're using pasted description
            }

            const response = await apiClient.post(endpoint, requestData);

            // Process API response (no demo data merging)
            setAnalysis(processAnalysisData(response.data));
            setLoading(false);
        } catch (err: any) {
            console.error("Analysis failed:", err);
            setParsingResume(false);
            setError(err.response?.data?.detail || err.message || 'An error occurred. Make sure the backend is running.');
            setLoading(false);
        }
    };

    const handleGenerateTailoring = async () => {
        if (!analysis || !jobUrl || !parsedResumeData) return;

        setLoading(true);
        try {
            // Transform analysis to match backend's FitAnalysisInput schema
            const analysisForTailoring = {
                match_score: analysis.match_score || analysis.overall_score,
                match_label: analysis.match_label || analysis.fit_tier,
                should_apply: analysis.should_apply,
                recommendation: analysis.recommendation || analysis.executive_summary,
                matches: analysis.matches || [],
                strong_matches: analysis.strong_matches || 0,
                matches_count: analysis.matches_count || 0,
                partial_matches: analysis.partial_matches || 0,
                gaps: analysis.gap_count || 0, // Backend expects integer, not array
                dealbreakers: analysis.dealbreakers || [],
                top_suggestions: analysis.top_suggestions || [],
                missing_keywords: analysis.missing_keywords || []
            };

            const response = await apiClient.post('/api/analyzer/tailor', {
                job_url: jobUrl,
                resume_data: parsedResumeData,
                analysis: analysisForTailoring
            });

            setTailoringPlan(response.data);
            setActiveTab('tailor');
        } catch (err: any) {
            console.error("Tailoring failed:", err);
            setError(err.response?.data?.detail || err.message || 'Failed to generate tailoring plan.');
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
            console.error("Quick check failed:", err);
            alert(`Quick check failed: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
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
                    {/* Input Mode Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Posting</label>
                        <div className="flex rounded-lg bg-gray-100 p-1 mb-3">
                            <button
                                type="button"
                                onClick={() => setInputMode('url')}
                                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                                    inputMode === 'url'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Search className="w-4 h-4 inline mr-1.5" />
                                From URL
                            </button>
                            <button
                                type="button"
                                onClick={() => setInputMode('paste')}
                                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                                    inputMode === 'paste'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <FileText className="w-4 h-4 inline mr-1.5" />
                                Paste Description
                            </button>
                        </div>

                        {/* URL Input */}
                        {inputMode === 'url' && (
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
                                />
                            </div>
                        )}

                        {/* Paste Description */}
                        {inputMode === 'paste' && (
                            <div>
                                <textarea
                                    name="job-description"
                                    id="job-description"
                                    rows={8}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    placeholder="Paste the full job description here...

Include:
• Job title and company name
• Requirements and qualifications
• Responsibilities
• Nice-to-haves"
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                />
                                <p className="mt-1.5 text-xs text-gray-500">
                                    Tip: Paste the complete job description for the most accurate analysis. This also saves on API costs.
                                </p>
                            </div>
                        )}
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
                            {loading ? (parsingResume ? 'Parsing Resume...' : 'Analyzing...') : 'Analyze Job Fit'}
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
                    {/* Job Info Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 text-indigo-200 text-sm mb-1">
                                    <Briefcase className="w-4 h-4" />
                                    <span>Analyzing Position</span>
                                </div>
                                <h3 className="text-2xl font-bold">
                                    {analysis.job_title || 'Position'}
                                </h3>
                                <div className="flex flex-wrap items-center gap-4 mt-2 text-indigo-100">
                                    {analysis.company && (
                                        <div className="flex items-center gap-1.5">
                                            <Building2 className="w-4 h-4" />
                                            <span>{analysis.company}</span>
                                        </div>
                                    )}
                                    {analysis.location && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4" />
                                            <span>{analysis.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-center bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                                    <div className="text-3xl font-bold">{Math.round((analysis.overall_score || analysis.match_score) * 100)}%</div>
                                    <div className="text-xs text-indigo-200 uppercase tracking-wide">Match Score</div>
                                </div>
                                {jobUrl && (
                                    <a
                                        href={jobUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                        title="View Original Posting"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Key Verdict Banner */}
                    {analysis.key_verdict && (
                        <div className={`p-4 rounded-lg border-l-4 ${analysis.should_apply ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'}`}>
                            <div className="flex items-start">
                                <Target className={`h-5 w-5 mt-0.5 mr-3 ${analysis.should_apply ? 'text-green-500' : 'text-yellow-500'}`} />
                                <div>
                                    <p className="font-medium text-gray-900">{analysis.key_verdict}</p>
                                    {analysis.confidence_score && (
                                        <p className="text-sm text-gray-500 mt-1">Analysis confidence: {Math.round(analysis.confidence_score * 100)}%</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('analyze')}
                                className={`${activeTab === 'analyze'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('requirements')}
                                className={`${activeTab === 'requirements'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                <List className="w-4 h-4 mr-2" />
                                Requirements ({analysis.matches?.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveTab('gaps')}
                                className={`${activeTab === 'gaps'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Gaps ({analysis.gaps?.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveTab('strategy')}
                                className={`${activeTab === 'strategy'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                <Lightbulb className="w-4 h-4 mr-2" />
                                Strategy
                            </button>
                            <button
                                onClick={() => setActiveTab('tailor')}
                                className={`${activeTab === 'tailor'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                <Wand2 className="w-4 h-4 mr-2" />
                                Tailoring
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'analyze' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: Score & Summary */}
                            <div className="lg:col-span-1 space-y-6">
                                <MatchScoreDisplay
                                    score={analysis.overall_score || analysis.match_score}
                                    label={analysis.fit_tier || analysis.match_label}
                                    recommendation={analysis.executive_summary || analysis.recommendation}
                                    shouldApply={analysis.should_apply}
                                />

                                {/* Category Scores - Improved Design */}
                                {analysis.category_scores && Object.keys(analysis.category_scores).length > 0 && (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                            <h4 className="font-semibold text-gray-900 flex items-center">
                                                <BarChart3 className="w-5 h-5 text-indigo-500 mr-2" />
                                                Category Breakdown
                                            </h4>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            {Object.entries(analysis.category_scores).map(([category, score]) => (
                                                <div key={category} className="group">
                                                    <div className="flex justify-between text-sm mb-2">
                                                        <span className="text-gray-700 font-medium capitalize">{category.replace(/_/g, ' ')}</span>
                                                        <span className={`font-bold ${score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                            {score}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                        <div
                                                            className={`h-2.5 rounded-full transition-all duration-500 ${score >= 70 ? 'bg-gradient-to-r from-green-400 to-green-500' : score >= 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                                                            style={{ width: `${score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Risk Assessment - Improved Design */}
                                {analysis.rejection_risk && (
                                    <div className={`rounded-xl overflow-hidden shadow-sm border ${
                                        analysis.rejection_risk?.toLowerCase() === 'high' ? 'border-red-200 bg-red-50' :
                                        analysis.rejection_risk?.toLowerCase() === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                                        'border-green-200 bg-green-50'
                                    }`}>
                                        <div className={`px-6 py-4 ${
                                            analysis.rejection_risk?.toLowerCase() === 'high' ? 'bg-red-100' :
                                            analysis.rejection_risk?.toLowerCase() === 'medium' ? 'bg-yellow-100' :
                                            'bg-green-100'
                                        }`}>
                                            <h4 className="font-semibold text-gray-900 flex items-center">
                                                <Shield className={`w-5 h-5 mr-2 ${
                                                    analysis.rejection_risk?.toLowerCase() === 'high' ? 'text-red-600' :
                                                    analysis.rejection_risk?.toLowerCase() === 'medium' ? 'text-yellow-600' :
                                                    'text-green-600'
                                                }`} />
                                                Risk Assessment
                                            </h4>
                                        </div>
                                        <div className="p-6">
                                            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getRiskColor(analysis.rejection_risk)}`}>
                                                {analysis.rejection_risk} Risk
                                            </div>
                                            {analysis.rejection_reasons?.length > 0 && (
                                                <ul className="mt-4 space-y-2">
                                                    {analysis.rejection_reasons.map((reason, i) => (
                                                        <li key={i} className="flex items-start text-sm text-gray-700">
                                                            <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                                                            {reason}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Strengths & Quick View */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Strengths - Improved Design */}
                                {analysis.strengths?.length > 0 && (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                                            <h4 className="font-semibold text-gray-900 flex items-center">
                                                <Award className="w-5 h-5 text-green-600 mr-2" />
                                                Your Strengths
                                                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                    {analysis.strengths.length}
                                                </span>
                                            </h4>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {analysis.strengths.map((strength) => (
                                                <div key={strength.strength_id} className="p-6 hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                            <Zap className="w-5 h-5 text-green-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="font-semibold text-gray-900">{strength.title}</h5>
                                                            <p className="text-sm text-gray-600 mt-1">{strength.description}</p>
                                                            <div className="mt-3 flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                                                                <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                                <p className="text-sm text-green-800 font-medium">
                                                                    {strength.competitive_advantage}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Differentiators - Improved Design */}
                                {analysis.differentiators?.length > 0 && (
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                            <Target className="w-5 h-5 text-indigo-600 mr-2" />
                                            What Sets You Apart
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.differentiators.map((diff, i) => (
                                                <span key={i} className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white text-indigo-700 border border-indigo-200 shadow-sm">
                                                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-indigo-500" />
                                                    {diff}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Competitive Position - Improved Design */}
                                {analysis.competitive_position && (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                                            <h4 className="font-semibold text-gray-900 flex items-center">
                                                <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                                                Competitive Position
                                            </h4>
                                        </div>
                                        <div className="p-6">
                                            <p className="text-gray-700 leading-relaxed">{analysis.competitive_position}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Legacy Requirement Breakdown */}
                                {analysis.matches?.length > 0 && (
                                    <RequirementBreakdown matches={analysis.matches} />
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'requirements' && (
                        <div className="space-y-6">
                            {/* Summary Stats - Improved Visual */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-gray-900">Requirements Overview</h4>
                                    <span className="text-sm text-gray-500">{analysis.matches?.length || 0} total requirements</span>
                                </div>
                                <div className="grid grid-cols-5 gap-3">
                                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-3 text-center border border-green-100">
                                        <div className="text-2xl font-bold text-green-600">{analysis.strong_matches || 0}</div>
                                        <div className="text-xs font-medium text-green-700">Exceeds</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 text-center border border-green-100">
                                        <div className="text-2xl font-bold text-green-500">{analysis.matches_count || 0}</div>
                                        <div className="text-xs font-medium text-green-600">Match</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-3 text-center border border-yellow-100">
                                        <div className="text-2xl font-bold text-yellow-600">{analysis.partial_matches || 0}</div>
                                        <div className="text-xs font-medium text-yellow-700">Partial</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 text-center border border-orange-100">
                                        <div className="text-2xl font-bold text-orange-500">{analysis.matches?.filter(m => m.strength === 'weak').length || 0}</div>
                                        <div className="text-xs font-medium text-orange-600">Weak</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-3 text-center border border-red-100">
                                        <div className="text-2xl font-bold text-red-600">{analysis.gap_count || 0}</div>
                                        <div className="text-xs font-medium text-red-700">Gap</div>
                                    </div>
                                </div>
                            </div>

                            {/* Grouped Requirements */}
                            {analysis.matches?.length > 0 ? (
                                <>
                                    {/* Strong/Exceeds Matches */}
                                    {analysis.matches.filter(m => m.strength === 'strong' || m.strength === 'exceeds').length > 0 && (
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                                                <h4 className="font-semibold text-gray-900 flex items-center">
                                                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                                                    Strong Matches
                                                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                        {analysis.matches.filter(m => m.strength === 'strong' || m.strength === 'exceeds').length}
                                                    </span>
                                                </h4>
                                                <p className="text-sm text-green-700 mt-1">Requirements you exceed or fully meet</p>
                                            </div>
                                            <div className="divide-y divide-gray-50">
                                                {analysis.matches.filter(m => m.strength === 'strong' || m.strength === 'exceeds').map((match, index) => (
                                                    <div key={index} className="p-4 hover:bg-green-50/50 transition-colors">
                                                        <div className="flex items-start gap-3">
                                                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-gray-900 font-medium">{match.requirement_text}</p>
                                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                                                        {match.category?.toUpperCase()}
                                                                    </span>
                                                                    {match.evidence?.length > 0 && (
                                                                        <span className="text-sm text-green-600">
                                                                            ✓ {match.evidence.slice(0, 3).join(', ')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {match.explanation && (
                                                                    <p className="text-sm text-gray-500 mt-1">{match.explanation}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Match */}
                                    {analysis.matches.filter(m => m.strength === 'match').length > 0 && (
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-teal-50 border-b border-green-100">
                                                <h4 className="font-semibold text-gray-900 flex items-center">
                                                    <Check className="w-5 h-5 text-green-500 mr-2" />
                                                    Matches
                                                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-600 text-xs font-bold rounded-full">
                                                        {analysis.matches.filter(m => m.strength === 'match').length}
                                                    </span>
                                                </h4>
                                                <p className="text-sm text-green-600 mt-1">Requirements you meet</p>
                                            </div>
                                            <div className="divide-y divide-gray-50">
                                                {analysis.matches.filter(m => m.strength === 'match').map((match, index) => (
                                                    <div key={index} className="p-4 hover:bg-green-50/30 transition-colors">
                                                        <div className="flex items-start gap-3">
                                                            <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-gray-900">{match.requirement_text}</p>
                                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                                                        {match.category?.toUpperCase()}
                                                                    </span>
                                                                    {match.evidence?.length > 0 && (
                                                                        <span className="text-sm text-green-600">
                                                                            ✓ {match.evidence.slice(0, 3).join(', ')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Partial Matches */}
                                    {analysis.matches.filter(m => m.strength === 'partial').length > 0 && (
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                            <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-100">
                                                <h4 className="font-semibold text-gray-900 flex items-center">
                                                    <MinusCircle className="w-5 h-5 text-yellow-500 mr-2" />
                                                    Partial Matches
                                                    <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                                                        {analysis.matches.filter(m => m.strength === 'partial').length}
                                                    </span>
                                                </h4>
                                                <p className="text-sm text-yellow-700 mt-1">Requirements you partially meet - highlight transferable skills</p>
                                            </div>
                                            <div className="divide-y divide-gray-50">
                                                {analysis.matches.filter(m => m.strength === 'partial').map((match, index) => (
                                                    <div key={index} className="p-4 hover:bg-yellow-50/30 transition-colors">
                                                        <div className="flex items-start gap-3">
                                                            <MinusCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-gray-900">{match.requirement_text}</p>
                                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                                                        {match.category?.toUpperCase()}
                                                                    </span>
                                                                    {match.evidence?.length > 0 && (
                                                                        <span className="text-sm text-yellow-600">
                                                                            ~ {match.evidence.slice(0, 3).join(', ')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {match.suggestion && (
                                                                    <div className="mt-2 p-2 bg-yellow-50 rounded-lg text-sm text-yellow-800 flex items-start gap-2">
                                                                        <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                                        {match.suggestion}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Weak Matches */}
                                    {analysis.matches.filter(m => m.strength === 'weak').length > 0 && (
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                            <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                                                <h4 className="font-semibold text-gray-900 flex items-center">
                                                    <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                                                    Weak Matches
                                                    <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                                                        {analysis.matches.filter(m => m.strength === 'weak').length}
                                                    </span>
                                                </h4>
                                                <p className="text-sm text-orange-700 mt-1">Areas to address in your cover letter</p>
                                            </div>
                                            <div className="divide-y divide-gray-50">
                                                {analysis.matches.filter(m => m.strength === 'weak').map((match, index) => (
                                                    <div key={index} className="p-4 hover:bg-orange-50/30 transition-colors">
                                                        <div className="flex items-start gap-3">
                                                            <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-gray-900">{match.requirement_text}</p>
                                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                                                        {match.category?.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                {match.explanation && (
                                                                    <p className="text-sm text-gray-500 mt-1">{match.explanation}</p>
                                                                )}
                                                                {match.suggestion && (
                                                                    <div className="mt-2 p-2 bg-orange-50 rounded-lg text-sm text-orange-800 flex items-start gap-2">
                                                                        <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                                        {match.suggestion}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Gaps */}
                                    {analysis.matches.filter(m => m.strength === 'gap').length > 0 && (
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                            <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100">
                                                <h4 className="font-semibold text-gray-900 flex items-center">
                                                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                                                    Gaps
                                                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                                        {analysis.matches.filter(m => m.strength === 'gap').length}
                                                    </span>
                                                </h4>
                                                <p className="text-sm text-red-700 mt-1">Requirements not found in your resume</p>
                                            </div>
                                            <div className="divide-y divide-gray-50">
                                                {analysis.matches.filter(m => m.strength === 'gap').map((match, index) => (
                                                    <div key={index} className="p-4 hover:bg-red-50/30 transition-colors">
                                                        <div className="flex items-start gap-3">
                                                            <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-gray-900">{match.requirement_text}</p>
                                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                                                        {match.category?.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                {match.suggestion && (
                                                                    <div className="mt-2 p-2 bg-red-50 rounded-lg text-sm text-red-800 flex items-start gap-2">
                                                                        <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                                        {match.suggestion}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                                    <List className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                    <h4 className="text-lg font-medium text-gray-900">No Requirements Analyzed</h4>
                                    <p className="text-gray-500 mt-1">Run the analysis to see a detailed breakdown of each requirement.</p>
                                </div>
                            )}

                            {/* Keywords Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Matched Keywords */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                        <Tag className="w-5 h-5 text-green-500 mr-2" />
                                        Keywords Found
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.matches?.flatMap(m => m.evidence || []).filter((v, i, a) => a.indexOf(v) === i).slice(0, 20).map((keyword, i) => (
                                            <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-100">
                                                <Check className="w-3.5 h-3.5 mr-1.5" />
                                                {keyword}
                                            </span>
                                        ))}
                                        {(!analysis.matches || analysis.matches.flatMap(m => m.evidence || []).length === 0) && (
                                            <span className="text-sm text-gray-400">No matched keywords found</span>
                                        )}
                                    </div>
                                </div>

                                {/* Missing Keywords */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                        <Tag className="w-5 h-5 text-red-500 mr-2" />
                                        Keywords to Add
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.missing_keywords?.slice(0, 20).map((keyword, i) => (
                                            <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-100">
                                                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                                                {keyword}
                                            </span>
                                        ))}
                                        {(!analysis.missing_keywords || analysis.missing_keywords.length === 0) && (
                                            <span className="text-sm text-gray-400">No missing keywords identified</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Critical Gaps Alert */}
                            {analysis.dealbreakers?.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                                    <h4 className="font-semibold text-red-800 flex items-center mb-3">
                                        <AlertTriangle className="w-5 h-5 mr-2" />
                                        Potential Dealbreakers
                                    </h4>
                                    <ul className="space-y-2">
                                        {analysis.dealbreakers.map((gap, i) => (
                                            <li key={i} className="text-sm text-red-700 flex items-start bg-white/50 p-3 rounded-lg">
                                                <XCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                                {gap}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Action Items */}
                            {analysis.top_suggestions?.length > 0 && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                    <h4 className="font-medium text-indigo-800 flex items-center mb-2">
                                        <Lightbulb className="w-5 h-5 mr-2" />
                                        Action Items
                                    </h4>
                                    <ul className="space-y-2">
                                        {analysis.top_suggestions.map((suggestion, i) => (
                                            <li key={i} className="text-sm text-indigo-700 flex items-start">
                                                <span className="font-bold mr-2">{i + 1}.</span>
                                                {suggestion}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'gaps' && (
                        <div className="space-y-6">
                            {analysis.gaps?.length > 0 ? (
                                analysis.gaps.map((gap) => (
                                    <div key={gap.gap_id} className={`bg-white rounded-lg shadow overflow-hidden border-l-4 ${getSeverityColor(gap.severity).replace('bg-', 'border-').split(' ')[0]}`}>
                                        <div className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(gap.severity)}`}>
                                                        {gap.severity.toUpperCase()}
                                                    </span>
                                                    <span className="ml-2 text-xs text-gray-500 capitalize">{gap.category.replace(/_/g, ' ')}</span>
                                                </div>
                                            </div>
                                            <h4 className="mt-3 font-medium text-gray-900">{gap.requirement_text}</h4>
                                            <p className="mt-2 text-gray-600">{gap.gap_description}</p>

                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-red-50 p-3 rounded">
                                                    <p className="text-xs font-medium text-red-800 uppercase">Your Level</p>
                                                    <p className="mt-1 text-sm text-red-700">{gap.your_level}</p>
                                                </div>
                                                <div className="bg-green-50 p-3 rounded">
                                                    <p className="text-xs font-medium text-green-800 uppercase">Required Level</p>
                                                    <p className="mt-1 text-sm text-green-700">{gap.required_level}</p>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-3 bg-yellow-50 rounded">
                                                <p className="text-sm font-medium text-yellow-800">Impact on Application</p>
                                                <p className="mt-1 text-sm text-yellow-700">{gap.impact_on_application}</p>
                                            </div>

                                            {gap.bridging_strategies?.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-medium text-gray-900 mb-2">How to Bridge This Gap</p>
                                                    <ul className="space-y-2">
                                                        {gap.bridging_strategies.map((strategy, i) => (
                                                            <li key={i} className="flex items-start text-sm">
                                                                <Lightbulb className="w-4 h-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                                                                <span className="text-gray-700">{strategy}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {gap.time_to_bridge && (
                                                <p className="mt-3 text-sm text-gray-500">
                                                    Estimated time to bridge: <span className="font-medium">{gap.time_to_bridge}</span>
                                                </p>
                                            )}

                                            {gap.talking_points?.length > 0 && (
                                                <div className="mt-4 border-t pt-4">
                                                    <p className="text-sm font-medium text-gray-900 mb-2">Interview Talking Points</p>
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {gap.talking_points.map((point, i) => (
                                                            <li key={i} className="text-sm text-gray-600">{point}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-green-50 rounded-lg">
                                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                                    <h3 className="mt-2 text-lg font-medium text-gray-900">No Significant Gaps</h3>
                                    <p className="mt-1 text-gray-500">Your profile aligns well with the requirements!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'strategy' && (
                        <div className="space-y-6">
                            {/* Application Strategy */}
                            {analysis.application_strategy && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                        <Target className="w-5 h-5 text-indigo-500 mr-2" />
                                        Application Strategy
                                    </h4>
                                    <p className="text-gray-700">{analysis.application_strategy}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Cover Letter Focus */}
                                {analysis.cover_letter_focus?.length > 0 && (
                                    <div className="bg-white rounded-lg shadow p-6">
                                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                            <FileText className="w-5 h-5 text-blue-500 mr-2" />
                                            Cover Letter Focus
                                        </h4>
                                        <ul className="space-y-2">
                                            {analysis.cover_letter_focus.map((point, i) => (
                                                <li key={i} className="flex items-start text-sm">
                                                    <span className="text-blue-500 mr-2">•</span>
                                                    <span className="text-gray-700">{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Interview Prep */}
                                {analysis.interview_prep?.length > 0 && (
                                    <div className="bg-white rounded-lg shadow p-6">
                                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                            <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                                            Interview Preparation
                                        </h4>
                                        <ul className="space-y-2">
                                            {analysis.interview_prep.map((topic, i) => (
                                                <li key={i} className="flex items-start text-sm">
                                                    <span className="text-yellow-500 mr-2">•</span>
                                                    <span className="text-gray-700">{topic}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Questions to Ask */}
                            {analysis.questions_to_ask?.length > 0 && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h4 className="font-medium text-gray-900 mb-3">Questions to Ask the Interviewer</h4>
                                    <ul className="space-y-2">
                                        {analysis.questions_to_ask.map((question, i) => (
                                            <li key={i} className="flex items-start text-sm bg-gray-50 p-3 rounded">
                                                <span className="text-indigo-500 mr-2 font-bold">{i + 1}.</span>
                                                <span className="text-gray-700">{question}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Mitigation Strategies */}
                            {analysis.mitigation_strategies?.length > 0 && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                        <Shield className="w-5 h-5 text-green-500 mr-2" />
                                        Risk Mitigation
                                    </h4>
                                    <ul className="space-y-2">
                                        {analysis.mitigation_strategies.map((strategy, i) => (
                                            <li key={i} className="flex items-start text-sm">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-700">{strategy}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'tailor' && (
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
                            ) : loading ? (
                                <div className="text-center py-12">
                                    <Loader className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Generating Tailoring Plan...</h3>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <Wand2 className="mx-auto h-12 w-12 text-indigo-400" />
                                    <h3 className="mt-4 text-lg font-medium text-gray-900">Resume Tailoring</h3>
                                    <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                                        Get personalized suggestions to optimize your resume for this specific job posting.
                                    </p>
                                    <button
                                        onClick={handleGenerateTailoring}
                                        disabled={loading}
                                        className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        Generate Tailoring Plan
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
