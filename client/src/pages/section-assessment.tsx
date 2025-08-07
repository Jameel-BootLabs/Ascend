import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, Award, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import type { TrainingSection, AssessmentQuestion, AssessmentResult } from "@shared/schema";

export default function SectionAssessment() {
  const [match, params] = useRoute("/assessment/section/:sectionId");
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes
  const [newResultId, setNewResultId] = useState<number | null>(null);
  const [isRetaking, setIsRetaking] = useState(false);

  const sectionId = params?.sectionId ? parseInt(params.sectionId) : 0;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch section details
  const { data: sections = [] } = useQuery({
    queryKey: ["/api/sections"],
    retry: false,
  });

  const section = sections.find(s => s.id === sectionId);

  // Fetch assessment questions for this section
  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ["/api/sections", sectionId, "/assessment/questions"],
    retry: false,
    enabled: !!sectionId,
  });

  // Fetch existing assessment results
  const { data: results = [] } = useQuery({
    queryKey: ["/api/assessment/results"],
    retry: false,
  });

  const existingResult = results.find(r => r.sectionId === sectionId);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !assessmentComplete && !showResults) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !assessmentComplete) {
      handleSubmitAssessment();
    }
  }, [timeRemaining, assessmentComplete, showResults]);

  // Submit assessment mutation
  const submitAssessment = useMutation({
    mutationFn: async (data: { sectionId: number; score: number; totalQuestions: number; correctAnswers: number; answers: Record<number, string>; passed: boolean }) => {
      return await apiRequest('POST', '/api/assessment/results', data);
    },
    onSuccess: async (response) => {
      const result = await response.json();
      setNewResultId(result.id);
      queryClient.invalidateQueries({ queryKey: ["/api/assessment/results"] });
      setAssessmentComplete(true);
      setShowResults(true);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error('Assessment submission failed:', error);
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !match || !section) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitAssessment = () => {
    // Calculate score
    let correct = 0;
    questions.forEach(question => {
      const selectedAnswer = answers[question.id];
      const correctAnswer = question.correctAnswer.toString();
      if (selectedAnswer === correctAnswer) {
        correct++;
      }
    });
    
    const finalScore = Math.round((correct / questions.length) * 100);
    setScore(finalScore);
    
    // Submit to backend
    submitAssessment.mutate({
      sectionId,
      score: finalScore,
      totalQuestions: questions.length,
      correctAnswers: correct,
      answers,
      passed: finalScore >= 100,
    });
  };

  const currentQuestion = questions[currentQuestionIndex];
  const allQuestionsAnswered = questions.every(q => answers[q.id]);
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Show existing results if already completed and not retaking
  if (existingResult && !showResults && !isRetaking) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-material">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-gray-900">
              Assessment Already Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <div className="text-4xl font-bold text-primary mb-2">
                {existingResult.score}%
              </div>
              <div className="text-gray-600">
                {existingResult.score >= 100 ? 'Passed' : 'Failed'}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {section.title} Assessment
              </h3>
              <p className="text-gray-600">
                Completed on {new Date(existingResult.dateTaken).toLocaleDateString()}
              </p>
              <p className="text-gray-600 mt-2">
                {existingResult.correctAnswers} out of {existingResult.totalQuestions} questions correct
              </p>
            </div>
            
            {/* Show wrong answers if not passed */}
            {existingResult.score < 100 && (
              <div className="mb-6 text-left">
                <h4 className="text-lg font-semibold text-red-600 mb-4">Questions to Review</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {questions
                    .filter(q => {
                      const userAnswer = existingResult.answers[q.id.toString()];
                      const correctAnswer = q.correctAnswer.toString();
                      // Handle both old format (text) and new format (index)
                      if (typeof userAnswer === 'string' && userAnswer.length > 1) {
                        // Old format: compare text with correct option
                        return userAnswer !== q.options[parseInt(correctAnswer)];
                      } else {
                        // New format: compare indices
                        return userAnswer !== correctAnswer;
                      }
                    })
                    .map((question, index) => {
                      const userAnswer = existingResult.answers[question.id.toString()];
                      let userAnswerText, correctAnswerText;
                      
                      if (typeof userAnswer === 'string' && userAnswer.length > 1) {
                        // Old format: userAnswer is text
                        userAnswerText = userAnswer;
                        correctAnswerText = question.options[parseInt(question.correctAnswer)];
                      } else {
                        // New format: userAnswer is index
                        userAnswerText = question.options[parseInt(userAnswer)] || 'No answer';
                        correctAnswerText = question.options[parseInt(question.correctAnswer)];
                      }
                      
                      return (
                        <div key={question.id} className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Question {questions.indexOf(question) + 1}: {question.question}
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="text-red-600">
                              <strong>Your answer:</strong> {userAnswerText}
                            </div>
                            <div className="text-green-600">
                              <strong>Correct answer:</strong> {correctAnswerText}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <Link href="/">
                <Button className="w-full bg-primary text-white hover:bg-primary-dark">
                  Return to Dashboard
                </Button>
              </Link>
              
              {existingResult.score >= 100 && (
                <Button 
                  onClick={() => window.open(`/api/certificate/${existingResult.id}`, '_blank')}
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                >
                  Download Certificate
                </Button>
              )}
              
              {existingResult.score < 100 && (
                <Button 
                  onClick={() => {
                    setIsRetaking(true);
                    setShowResults(false);
                    setAssessmentComplete(false);
                    setCurrentQuestionIndex(0);
                    setAnswers({});
                    setScore(0);
                    setTimeRemaining(30 * 60);
                    setNewResultId(null);
                  }}
                  className="w-full bg-secondary text-white hover:bg-green-600"
                >
                  Retake Assessment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Show results
  if (showResults) {
    const passed = score >= 100;
    
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-material">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-gray-900">
              Assessment Results
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              {passed ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              )}
              
              <div className="text-4xl font-bold text-primary mb-2">
                {score}%
              </div>
              <div className="text-lg text-gray-600">
                {passed ? 'Congratulations! You passed!' : 'You need 100% to pass.'}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {section.title} Assessment
              </h3>
              <p className="text-gray-600">
                {questions.filter(q => answers[q.id] === q.correctAnswer.toString()).length} out of {questions.length} questions correct
              </p>
            </div>
            
            {/* Show wrong answers if not passed */}
            {!passed && (
              <div className="mb-6 text-left">
                <h4 className="text-lg font-semibold text-red-600 mb-4">Questions to Review</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {questions
                    .filter(q => answers[q.id] !== q.correctAnswer.toString())
                    .map((question, index) => (
                    <div key={question.id} className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h5 className="font-medium text-gray-900 mb-2">
                        Question {questions.indexOf(question) + 1}: {question.question}
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div className="text-red-600">
                          <strong>Your answer:</strong> {question.options[parseInt(answers[question.id])]}
                        </div>
                        <div className="text-green-600">
                          <strong>Correct answer:</strong> {question.options[parseInt(question.correctAnswer)]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <Link href="/">
                <Button className="w-full bg-primary text-white hover:bg-primary-dark">
                  Return to Dashboard
                </Button>
              </Link>
              
              {passed && newResultId && (
                <Button 
                  onClick={() => window.open(`/api/certificate/${newResultId}`, '_blank')}
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                >
                  Download Certificate
                </Button>
              )}
              
              {!passed && (
                <Button 
                  onClick={() => {
                    setShowResults(false);
                    setAssessmentComplete(false);
                    setCurrentQuestionIndex(0);
                    setAnswers({});
                    setTimeRemaining(30 * 60);
                    setNewResultId(null);
                  }}
                  className="w-full bg-secondary text-white hover:bg-green-600"
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Main assessment interface
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {section.title} Assessment
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-orange-600">
              <Clock className="w-5 h-5 mr-1" />
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
            <Badge variant="secondary">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
        </div>
        
        <Progress value={progress} className="h-2" />
      </div>

      {currentQuestion && (
        <Card className="shadow-material mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-gray-900">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              className="space-y-4"
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="text-gray-700 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        <div className="text-sm text-gray-600">
          {questions.filter(q => answers[q.id]).length} of {questions.length} answered
        </div>
        
        {currentQuestionIndex === questions.length - 1 ? (
          <Button 
            onClick={handleSubmitAssessment}
            disabled={!allQuestionsAnswered || submitAssessment.isPending}
            className="bg-secondary text-white hover:bg-green-600"
          >
            {submitAssessment.isPending ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        ) : (
          <Button 
            onClick={handleNextQuestion}
            disabled={!answers[currentQuestion?.id]}
          >
            Next
          </Button>
        )}
      </div>
    </main>
  );
}