import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit } from "lucide-react";

interface AssessmentQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  sectionId: number;
  order: number;
}

interface AssessmentQuestionDialogProps {
  question?: AssessmentQuestion;
  sections: Array<{ id: number; title: string }>;
  mode: "create" | "edit";
  trigger?: React.ReactNode;
  existingQuestions?: AssessmentQuestion[]; // Add this prop to get existing questions for order calculation
}

export default function AssessmentQuestionDialog({
  question,
  sections,
  mode,
  trigger,
  existingQuestions = [], // Default to empty array
}: AssessmentQuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    sectionId: 0,
    order: 1,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate next available order for a section
  const getNextOrder = (sectionId: number) => {
    const sectionQuestions = existingQuestions.filter(q => q.sectionId === sectionId);
    if (sectionQuestions.length === 0) return 1;
    
    // Get all existing orders and sort them
    const existingOrders = sectionQuestions.map(q => q.order).sort((a, b) => a - b);
    
    // Find the first gap in the sequence, or use the next number after the highest
    let nextOrder = 1;
    for (const order of existingOrders) {
      if (order === nextOrder) {
        nextOrder++;
      } else {
        break; // Found a gap, use this number
      }
    }
    
    return nextOrder;
  };

  // Reset form function
  const resetForm = () => {
    const selectedSectionId = sections.length > 0 ? sections[0].id : 0;
    setFormData({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      sectionId: selectedSectionId,
      order: getNextOrder(selectedSectionId),
    });
  };

  // Update order when section changes
  const handleSectionChange = (sectionId: number) => {
    setFormData(prev => ({
      ...prev,
      sectionId,
      order: getNextOrder(sectionId),
    }));
  };

  // Log order calculation for debugging
  useEffect(() => {
    if (open && mode === "create") {
      console.log(`Calculating order for section ${formData.sectionId}:`, getNextOrder(formData.sectionId));
    }
  }, [open, mode, formData.sectionId]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (question && mode === "edit") {
        setFormData({
          question: question.question,
          options: [...question.options],
          correctAnswer: question.correctAnswer,
          sectionId: question.sectionId,
          order: question.order,
        });
      } else {
        resetForm();
      }
    } else {
      // Reset form when dialog closes
      resetForm();
    }
  }, [open, question, mode, sections]);

  // Don't allow opening dialog if no sections are available
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && sections.length === 0) {
      toast({
        title: "Error",
        description: "No sections available. Please create a section first.",
        variant: "destructive",
      });
      return;
    }
    setOpen(newOpen);
  };

  const createQuestionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/assessment/questions", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assessment question created successfully",
      });
      // Invalidate both sections and assessment questions queries
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assessment/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sections", "assessment", "questions"] });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create assessment question",
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("PUT", `/api/assessment/questions/${question?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assessment question updated successfully",
      });
      // Invalidate both sections and assessment questions queries
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assessment/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sections", "assessment", "questions"] });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update assessment question",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim()) {
      toast({
        title: "Error",
        description: "Question text is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.options.some(option => !option.trim())) {
      toast({
        title: "Error",
        description: "All options must be filled",
        variant: "destructive",
      });
      return;
    }

    if (!formData.correctAnswer) {
      toast({
        title: "Error",
        description: "Please select the correct answer",
        variant: "destructive",
      });
      return;
    }

    if (mode === "create") {
      createQuestionMutation.mutate(formData);
    } else {
      updateQuestionMutation.mutate(formData);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const defaultTrigger = mode === "create" ? (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Add Question
    </Button>
  ) : (
    <Button variant="ghost" size="sm">
      <Edit className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Assessment Question" : "Edit Assessment Question"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Add a new assessment question for a training section."
              : "Update the assessment question details."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {sections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No sections available. Please create a section first.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Select
                  value={formData.sectionId.toString()}
                  onValueChange={(value) => handleSectionChange(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id.toString()}>
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter the assessment question..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <Label>Answer Options</Label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Label className="w-8 text-sm font-medium">
                      {String.fromCharCode(97 + index)}.
                    </Label>
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="correctAnswer">Correct Answer</Label>
                <Select
                  value={formData.correctAnswer}
                  onValueChange={(value) => setFormData({ ...formData, correctAnswer: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select the correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.options.map((option, index) => (
                      <SelectItem key={index} value={String.fromCharCode(97 + index)}>
                        {String.fromCharCode(97 + index)}. {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  min="1"
                />
                {mode === "create" && (
                  <p className="text-sm text-gray-500">
                    This question will be displayed as "Question {formData.order}" in the assessment.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending || sections.length === 0}
                >
                  {createQuestionMutation.isPending || updateQuestionMutation.isPending
                    ? "Saving..."
                    : mode === "create" 
                      ? "Create Question" 
                      : "Update Question"
                  }
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
} 