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
}

export default function AssessmentQuestionDialog({
  question,
  sections,
  mode,
  trigger,
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

  useEffect(() => {
    if (question && mode === "edit") {
      setFormData({
        question: question.question,
        options: [...question.options],
        correctAnswer: question.correctAnswer,
        sectionId: question.sectionId,
        order: question.order,
      });
    } else {
      setFormData({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        sectionId: sections[0]?.id || 0,
        order: 1,
      });
    }
  }, [question, mode, sections]);

  const createQuestionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/assessment/questions", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assessment question created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
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
    <Dialog open={open} onOpenChange={setOpen}>
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
          <div className="space-y-2">
            <Label htmlFor="section">Section</Label>
            <Select
              value={formData.sectionId.toString()}
              onValueChange={(value) => setFormData({ ...formData, sectionId: parseInt(value) })}
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
            >
              {createQuestionMutation.isPending || updateQuestionMutation.isPending
                ? "Saving..."
                : mode === "create" 
                  ? "Create Question" 
                  : "Update Question"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 