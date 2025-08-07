import { forwardRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Award, CheckCircle } from "lucide-react";

interface CertificateProps {
  userName: string;
  completionDate: string;
  score: number;
}

const Certificate = forwardRef<HTMLDivElement, CertificateProps>(
  ({ userName, completionDate, score }, ref) => {
    return (
      <Card ref={ref} className="w-full max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-primary shadow-material-lg">
        <CardContent className="p-8">
          <div className="text-center">
            {/* Header */}
            <div className="flex justify-center items-center mb-6">
              <Shield className="text-primary mr-3" size={32} />
              <h1 className="text-2xl font-bold text-primary">SecureLearn</h1>
            </div>
            
            {/* Certificate Title */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Certificate of Completion</h2>
              <p className="text-gray-600">Information Security Training</p>
            </div>
            
            {/* Award Icon */}
            <div className="mb-6">
              <Award className="mx-auto text-accent mb-4" size={64} />
              <Badge className="bg-secondary text-white px-4 py-2 text-sm">
                <CheckCircle className="mr-1 h-4 w-4" />
                Training Completed
              </Badge>
            </div>
            
            {/* Certificate Body */}
            <div className="mb-8">
              <p className="text-gray-700 mb-4">This is to certify that</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2 inline-block">
                {userName}
              </h3>
              <p className="text-gray-700 mb-4">
                has successfully completed the Information Security Training Program
              </p>
              <p className="text-gray-700 mb-2">
                and achieved a score of <span className="font-bold text-primary">{score}%</span>
              </p>
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-300 pt-6">
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <p className="text-sm text-gray-600">Completion Date</p>
                  <p className="font-semibold text-gray-900">{completionDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Certificate ID</p>
                  <p className="font-semibold text-gray-900">
                    SL-{Date.now().toString().slice(-6)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

Certificate.displayName = "Certificate";

export default Certificate;
