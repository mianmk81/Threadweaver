'use client';

import { useState } from 'react';
import { Building2, Users, MapPin, Target, Sparkles, X, Upload, FileText } from 'lucide-react';
import type { CompanyProfile } from '@/lib/types';

interface CompanySetupModalProps {
  isOpen: boolean;
  onComplete: (profile: CompanyProfile) => void;
  onSkip: () => void;
}

const INDUSTRIES = [
  'Food Service / Campus Dining',
  'Restaurant / Hospitality',
  'Manufacturing',
  'Retail',
  'Healthcare',
  'Education',
  'Technology',
  'Agriculture',
  'Transportation',
  'Energy',
];

const COMPANY_SIZES = [
  { value: 'small', label: 'Small (1-50 employees)', description: 'Local operation' },
  { value: 'medium', label: 'Medium (50-500 employees)', description: 'Regional presence' },
  { value: 'large', label: 'Large (500-5000 employees)', description: 'National operation' },
  { value: 'enterprise', label: 'Enterprise (5000+ employees)', description: 'Global organization' },
] as const;

const COMMON_CHALLENGES = [
  'High waste generation',
  'Carbon emissions',
  'Energy consumption',
  'Supply chain sustainability',
  'Cost management',
  'Regulatory compliance',
  'Stakeholder pressure',
  'Resource efficiency',
];

const SUSTAINABILITY_GOALS = [
  'Net zero emissions',
  'Zero waste to landfill',
  'Circular economy',
  'Renewable energy',
  'Sustainable sourcing',
  'Community engagement',
  'Cost reduction',
  'ESG reporting',
];

export default function CompanySetupModal({ isOpen, onComplete, onSkip }: CompanySetupModalProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<CompanyProfile>>({
    currentChallenges: [],
    sustainabilityGoals: [],
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExtractingPDF, setIsExtractingPDF] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    if (!profile.companyName || !profile.industry || !profile.size) {
      alert('Please fill in all required fields');
      return;
    }

    onComplete(profile as CompanyProfile);
  };

  const toggleChallenge = (challenge: string) => {
    const challenges = profile.currentChallenges || [];
    if (challenges.includes(challenge)) {
      setProfile({
        ...profile,
        currentChallenges: challenges.filter(c => c !== challenge),
      });
    } else {
      setProfile({
        ...profile,
        currentChallenges: [...challenges, challenge],
      });
    }
  };

  const toggleGoal = (goal: string) => {
    const goals = profile.sustainabilityGoals || [];
    if (goals.includes(goal)) {
      setProfile({
        ...profile,
        sustainabilityGoals: goals.filter(g => g !== goal),
      });
    } else {
      setProfile({
        ...profile,
        sustainabilityGoals: [...goals, goal],
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setUploadedFile(file);
    setIsExtractingPDF(true);

    try {
      // Create FormData to send file
      const formData = new FormData();
      formData.append('file', file);

      // Send to backend for extraction (we'll create this endpoint)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003'}/api/extract-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract PDF content');
      }

      const data = await response.json();

      // Update profile description with extracted text
      setProfile({
        ...profile,
        description: data.extractedText || profile.description,
      });

      console.log('PDF extracted successfully');
    } catch (error) {
      console.error('Error extracting PDF:', error);
      alert('Failed to extract PDF content. You can still continue with manual input.');
    } finally {
      setIsExtractingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-black border-2 border-gold/30 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-black border-b border-gold/30 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gold flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                Customize Your Simulation
              </h2>
              <p className="text-sm text-gray-400 mt-2">
                Tell us about your organization to generate personalized sustainability scenarios
              </p>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gold transition-colors text-sm"
            >
              Skip Setup
            </button>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-all ${
                  s <= step ? 'bg-gold' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-emerald mb-2">
                  Company/Organization Name *
                </label>
                <input
                  type="text"
                  value={profile.companyName || ''}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  placeholder="e.g., Campus Dining Services"
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-gold focus:outline-none placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-emerald mb-2">
                  Industry *
                </label>
                <select
                  value={profile.industry || ''}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-gold focus:outline-none"
                  style={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                  }}
                >
                  <option value="" style={{ backgroundColor: '#000000', color: '#ffffff' }}>Select industry...</option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry} value={industry} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                      {industry}
                    </option>
                  ))}
                  <option value="Other" style={{ backgroundColor: '#000000', color: '#ffffff' }}>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-emerald mb-3">
                  Organization Size *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {COMPANY_SIZES.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setProfile({ ...profile, size: size.value })}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        profile.size === size.value
                          ? 'border-gold bg-gold/10'
                          : 'border-gray-700 hover:border-gold/50 bg-black'
                      }`}
                    >
                      <div className="font-semibold text-white">{size.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{size.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-emerald mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="e.g., Seattle, WA"
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-gold focus:outline-none placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-emerald mb-2">
                  Upload Company Document (Optional)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={isExtractingPDF}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className={`w-full px-4 py-3 bg-black border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-emerald hover:text-emerald transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      isExtractingPDF ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isExtractingPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald border-t-transparent"></div>
                        <span>Extracting PDF content...</span>
                      </>
                    ) : uploadedFile ? (
                      <>
                        <FileText className="w-5 h-5 text-emerald" />
                        <span className="text-emerald">{uploadedFile.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Click to upload PDF (Annual report, sustainability report, etc.)</span>
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Upload a PDF document about your company. AI will extract relevant information to create personalized scenarios.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Challenges & Goals */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-emerald mb-3">
                  Current Challenges (Select all that apply)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {COMMON_CHALLENGES.map((challenge) => (
                    <button
                      key={challenge}
                      onClick={() => toggleChallenge(challenge)}
                      className={`px-4 py-2 border rounded-lg text-sm text-left transition-all ${
                        profile.currentChallenges?.includes(challenge)
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-gray-700 text-white hover:border-gold/50 bg-black'
                      }`}
                    >
                      {challenge}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-emerald mb-3">
                  Sustainability Goals (Select all that apply)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {SUSTAINABILITY_GOALS.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`px-4 py-2 border rounded-lg text-sm text-left transition-all ${
                        profile.sustainabilityGoals?.includes(goal)
                          ? 'border-emerald bg-emerald/10 text-emerald'
                          : 'border-gray-700 text-white hover:border-emerald/50 bg-black'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Description */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-emerald mb-2">
                  Tell us about your operation (Optional)
                </label>
                <textarea
                  value={profile.description || ''}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder="Describe your current operations, scale, and any specific context that would help generate relevant scenarios..."
                  rows={6}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-gold focus:outline-none resize-none placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Example: "We operate 3 dining halls serving 5,000+ students daily with traditional kitchen equipment. Currently facing high food waste and pressure to improve sustainability."
                </p>
              </div>

              <div className="bg-black border border-purple/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-purple mb-1">AI-Powered Customization</h3>
                    <p className="text-xs text-gray-400">
                      Based on your inputs, we'll generate personalized decision scenarios, scale metrics to your operation size, and create relevant sustainability challenges specific to your industry.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gold/20 p-6 flex justify-between bg-black">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <div className="flex gap-3">
            {step < 3 ? (
              <button onClick={handleNext} className="btn-primary">
                Next
              </button>
            ) : (
              <button onClick={handleComplete} className="btn-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate My Simulation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
